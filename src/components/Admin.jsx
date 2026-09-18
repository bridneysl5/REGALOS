import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ALL_PRODUCTS } from '../data';
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
  Save,
  RotateCcw,
  LoaderCircle,
  Lock,
  UploadCloud,
} from 'lucide-react';
import { CATEGORIES, OCCASIONS } from '../routes';
import {
  subscribeOverrides,
  applyOverrides,
  saveOverride,
  mensajeDeError,
} from '../catalogOverrides';
import {
  subscribeProductosRegalos,
  mergeCatalogo,
  productosFaltantes,
  importarProducto,
} from '../productosFirebase';

// ---------------------------------------------------------------------------
// Acceso al panel
//
// >>> LA CLAVE DEL ADMIN ES ESTA LINEA <<<
// Para cambiarla: edita el texto de abajo, guarda el archivo, y sube el cambio
// (git commit + git push). Netlify publica solo en 1-2 minutos.
//
// Es una traba para curiosos, no seguridad fuerte: la clave viaja dentro del
// codigo de la pagina, asi que quien sepa buscar puede verla. La proteccion
// de verdad seria un login con Firebase Authentication.
//
// (Tambien se puede definir la variable VITE_ADMIN_PASSWORD en Netlify; si
// existe, esa manda sobre la clave de abajo.)
// ---------------------------------------------------------------------------
const CLAVE_ADMIN = import.meta.env.VITE_ADMIN_PASSWORD || '1502';
const SESION_KEY = 'm365_admin';

const leerSesion = () => {
  try {
    return sessionStorage.getItem(SESION_KEY) === 'ok';
  } catch {
    return false;
  }
};

const guardarSesion = () => {
  try {
    sessionStorage.setItem(SESION_KEY, 'ok');
  } catch {
    /* modo incógnito: no pasa nada, sólo no recuerda */
  }
};

const PantallaDeAcceso = ({ onEntrar }) => {
  const [clave, setClave] = useState('');
  const [error, setError] = useState(false);

  const entrar = (e) => {
    e.preventDefault();
    if (clave === CLAVE_ADMIN) {
      guardarSesion();
      onEntrar();
    } else {
      setError(true);
      setClave('');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <form
        onSubmit={entrar}
        className="bg-white border border-gray-100 shadow-sm rounded-2xl p-8 w-full max-w-sm flex flex-col gap-4"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-rose-50 text-rose-500 p-3 rounded-full">
            <Lock size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Panel de administración</h2>
          <p className="text-sm text-gray-500">Ingresa la clave para continuar.</p>
        </div>

        <input
          type="password"
          value={clave}
          onChange={(e) => {
            setClave(e.target.value);
            setError(false);
          }}
          placeholder="Clave"
          autoFocus
          className="border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none rounded-xl px-4 py-3 transition"
        />

        {error && (
          <p className="text-sm text-red-600 flex items-center gap-2">
            <AlertCircle size={16} /> Clave incorrecta.
          </p>
        )}

        <button
          type="submit"
          className="bg-gray-900 hover:bg-rose-500 text-white py-3 rounded-xl font-bold transition"
        >
          Entrar
        </button>
      </form>
    </div>
  );
};

// ---------------------------------------------------------------------------

const DetailsEditor = ({ details, onChange }) => {
  const lista = Array.isArray(details) ? details : [];

  const actualizar = (index, value) =>
    onChange(lista.map((d, i) => (i === index ? value : d)));

  return (
    <div className="flex flex-col gap-2 min-w-[300px]">
      {lista.map((detail, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <input
            value={detail}
            onChange={(e) => actualizar(idx, e.target.value)}
            placeholder="Ej. Contiene 1 peluche..."
            className="border border-gray-200 focus:border-rose-500 outline-none rounded-lg px-3 py-2 flex-1 text-sm bg-white"
          />
          <button
            type="button"
            onClick={() => onChange(lista.filter((_, i) => i !== idx))}
            className="text-red-400 hover:text-red-600 transition p-1"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...lista, ''])}
        className="text-sm text-rose-500 font-bold flex items-center gap-1 hover:text-rose-600 transition w-fit mt-1"
      >
        <Plus size={16} /> Añadir detalle
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------

const Admin = () => {
  const [autorizado, setAutorizado] = useState(leerSesion);

  const [overrides, setOverrides] = useState({});
  const [firebaseProducts, setFirebaseProducts] = useState([]);
  const [importando, setImportando] = useState(false);
  const [editados, setEditados] = useState({}); // { [id]: producto editado }
  const [guardando, setGuardando] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroOcasion, setFiltroOcasion] = useState('Todas');
  const [activeTab, setActiveTab] = useState('catalog');

  const statusTimer = useRef(null);

  const avisar = (type, text, ms = 4000) => {
    setStatusMessage({ type, text });
    clearTimeout(statusTimer.current);
    if (ms) statusTimer.current = setTimeout(() => setStatusMessage(null), ms);
  };

  useEffect(() => {
    if (!autorizado) return undefined;
    const unsubOverrides = subscribeOverrides(setOverrides, () =>
      avisar('error', 'No se pudieron leer los datos guardados en Firebase.', 0)
    );
    const unsubProductos = subscribeProductosRegalos(setFirebaseProducts, () =>
      avisar('error', 'No se pudo leer el catálogo de Firebase.', 0)
    );
    return () => {
      unsubOverrides();
      unsubProductos();
    };
  }, [autorizado]);

  // El mismo catálogo que ve la tienda: Firebase manda, y de src/data.js solo
  // se suman los productos que aún no existen allí.
  const products = useMemo(
    () => applyOverrides(mergeCatalogo(ALL_PRODUCTS, firebaseProducts), overrides),
    [firebaseProducts, overrides]
  );

  const faltantes = useMemo(
    () => productosFaltantes(ALL_PRODUCTS, firebaseProducts),
    [firebaseProducts]
  );

  const pendientes = useMemo(() => Object.keys(editados), [editados]);
  const hayPendientes = pendientes.length > 0;

  // Aviso del navegador si intenta cerrar con cambios sin guardar.
  useEffect(() => {
    if (!hayPendientes) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hayPendientes]);

  useEffect(() => () => clearTimeout(statusTimer.current), []);

  /** Producto tal como debe mostrarse: la edición en curso, o lo guardado. */
  const verProducto = (product) => editados[product.id] || product;

  const handleChange = (id, field, newValue) => {
    setEditados((prev) => {
      const base = prev[id] || products.find((p) => p.id === id);
      if (!base) return prev;
      const actualizado = {
        ...base,
        [field]: field === 'price' ? (newValue === '' ? '' : Number(newValue)) : newValue,
      };
      return { ...prev, [id]: actualizado };
    });
  };

  const descartar = () => {
    setEditados({});
    avisar('success', 'Cambios descartados.');
  };

  const importarFaltantes = async () => {
    if (importando || faltantes.length === 0) return;
    setImportando(true);
    setStatusMessage(null);

    let creados = 0;
    let primerError = null;
    for (const producto of faltantes) {
      try {
        await importarProducto(producto);
        creados++;
      } catch (err) {
        console.error('[admin] error al importar', producto.name, err);
        if (!primerError) primerError = err;
      }
    }

    setImportando(false);
    if (primerError) {
      avisar('error', `${mensajeDeError(primerError)} (se importaron ${creados}).`, 0);
    } else {
      avisar('success', `${creados} ${creados === 1 ? 'producto importado' : 'productos importados'} a Firebase.`);
    }
  };

  const guardar = async () => {
    if (!hayPendientes || guardando) return;
    setGuardando(true);
    setStatusMessage(null);

    const aGuardar = pendientes.map((id) => editados[id]);
    const fallidos = [];
    let primerError = null;

    for (const producto of aGuardar) {
      try {
        await saveOverride(producto);
      } catch (err) {
        console.error('[admin] error al guardar', producto.id, err);
        fallidos.push(producto);
        if (!primerError) primerError = err;
      }
    }

    setGuardando(false);

    if (fallidos.length === 0) {
      setEditados({});
      avisar('success', `Guardado (${aGuardar.length} ${aGuardar.length === 1 ? 'producto' : 'productos'}).`);
    } else {
      const quedan = {};
      fallidos.forEach((p) => {
        quedan[p.id] = p;
      });
      setEditados(quedan);
      avisar('error', mensajeDeError(primerError), 0);
    }
  };

  const SIN_ASIGNAR = 'Sin asignar';

  const filteredProducts = useMemo(() => {
    const texto = search.trim().toLowerCase();

    const coincide = (valor, filtro) => {
      if (filtro === 'Todas') return true;
      const lista = (Array.isArray(valor) ? valor : [valor]).filter(
        (v) => v && v !== 'Todos'
      );
      if (filtro === SIN_ASIGNAR) return lista.length === 0;
      return lista.includes(filtro);
    };

    return products.filter((base) => {
      const p = verProducto(base);
      return (
        (!texto || p.name.toLowerCase().includes(texto)) &&
        coincide(p.category, filtroCategoria) &&
        coincide(p.occasion, filtroOcasion)
      );
    });
  }, [products, editados, search, filtroCategoria, filtroOcasion]);

  const hayFiltros =
    search.trim() !== '' || filtroCategoria !== 'Todas' || filtroOcasion !== 'Todas';

  const limpiarFiltros = () => {
    setSearch('');
    setFiltroCategoria('Todas');
    setFiltroOcasion('Todas');
  };

  if (!autorizado) return <PantallaDeAcceso onEntrar={() => setAutorizado(true)} />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Administrador de Catálogo</h2>
          <p className="text-gray-500">
            Edita lo que necesites y presiona <strong>Guardar cambios</strong>.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 w-full sm:w-56"
          />

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer bg-white w-full sm:w-52"
          >
            <option value="Todas">Todas las categorías</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={SIN_ASIGNAR}>— Sin categoría —</option>
          </select>

          <select
            value={filtroOcasion}
            onChange={(e) => setFiltroOcasion(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer bg-white w-full sm:w-52"
          >
            <option value="Todas">Todas las ocasiones</option>
            {OCCASIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
            <option value={SIN_ASIGNAR}>— Sin ocasión —</option>
          </select>

          {hayFiltros && (
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 rounded-xl font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition whitespace-nowrap"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-6 py-2.5 font-bold rounded-xl transition whitespace-nowrap ${activeTab === 'catalog' ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          Catálogo General
        </button>
        <button
          onClick={() => setActiveTab('descriptions')}
          className={`px-6 py-2.5 font-bold rounded-xl transition whitespace-nowrap ${activeTab === 'descriptions' ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          Descripciones y Detalles
        </button>

        <span className="ml-auto self-center text-sm text-gray-500 whitespace-nowrap">
          {hayFiltros
            ? `${filteredProducts.length} de ${products.length} productos`
            : `${products.length} productos`}
        </span>
      </div>

      {faltantes.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <p className="font-bold text-amber-900">
              {faltantes.length} {faltantes.length === 1 ? 'producto vive solo en el código' : 'productos viven solo en el código'}
            </p>
            <p className="text-sm text-amber-800 mt-1">
              {faltantes.map((p) => p.name).join(', ')}
            </p>
            <p className="text-xs text-amber-700 mt-2">
              Impórtalos y quedarán en Firebase junto al resto, para administrarlos desde un solo lugar.
            </p>
          </div>
          <button
            onClick={importarFaltantes}
            disabled={importando}
            className="shrink-0 px-6 py-3 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 transition shadow disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {importando ? <LoaderCircle size={18} className="animate-spin" /> : <UploadCloud size={18} />}
            {importando ? 'Importando...' : 'Importar a Firebase'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden pb-32">
        <div className="overflow-x-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              {activeTab === 'catalog' ? (
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                  <th className="px-6 py-4 font-semibold w-[340px] min-w-[340px]">Producto</th>
                  <th className="px-6 py-4 font-semibold">Precio</th>
                  <th className="px-6 py-4 font-semibold text-center">Top</th>
                  <th className="px-6 py-4 font-semibold text-center">Barato</th>
                  <th className="px-6 py-4 font-semibold w-56">Categoría(s)</th>
                  <th className="px-6 py-4 font-semibold w-56">Ocasión(es)</th>
                </tr>
              ) : (
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                  <th className="px-6 py-4 font-semibold w-[340px] min-w-[340px]">Producto</th>
                  <th className="px-6 py-4 font-semibold w-1/3">Descripción General</th>
                  <th className="px-6 py-4 font-semibold">Detalles (Puntos Clave)</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((base) => {
                const product = verProducto(base);
                const pendiente = !!editados[base.id];
                return (
                  <tr
                    key={base.id}
                    className={`transition ${pendiente ? 'bg-amber-50/60' : 'hover:bg-gray-50/50'}`}
                  >
                    <td className="px-6 py-4 align-top w-[340px] min-w-[340px]">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                          <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="block text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-1">
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => handleChange(base.id, 'name', e.target.value)}
                            placeholder="Nombre del producto"
                            className="font-bold text-gray-800 text-sm bg-white border border-gray-200 rounded-lg hover:border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none w-full px-2 py-1.5 transition"
                          />
                        </div>
                      </div>
                    </td>

                    {activeTab === 'catalog' ? (
                      <>
                        <td className="px-6 py-4 font-bold text-gray-700 align-top">
                          <label className="block text-[10px] uppercase tracking-wide text-gray-400 font-bold mb-1">
                            Precio
                          </label>
                          <div className="flex items-center gap-1">
                            <span>S/</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={product.price}
                              onChange={(e) => handleChange(base.id, 'price', e.target.value)}
                              className="bg-white border border-gray-200 rounded-lg hover:border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none w-24 px-2 py-1.5 transition"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center align-top pt-8">
                          <input
                            type="checkbox"
                            className="rounded text-rose-500 focus:ring-rose-500 cursor-pointer w-5 h-5"
                            checked={!!product.isTop}
                            onChange={(e) => handleChange(base.id, 'isTop', e.target.checked)}
                          />
                        </td>
                        <td className="px-6 py-4 text-center align-top pt-8">
                          <input
                            type="checkbox"
                            className="rounded text-rose-500 focus:ring-rose-500 cursor-pointer w-5 h-5"
                            checked={!!product.isCheap}
                            onChange={(e) => handleChange(base.id, 'isCheap', e.target.checked)}
                          />
                        </td>
                        <td className="px-6 py-4 relative align-top pt-8">
                          <details className="group">
                            <summary className="bg-white border border-gray-200 hover:border-rose-300 text-gray-800 text-sm rounded-lg p-2 cursor-pointer list-none min-h-[38px] flex items-center justify-between shadow-sm">
                              <span className="truncate pr-2">
                                {Array.isArray(product.category) && product.category.length > 0
                                  ? product.category.join(', ')
                                  : 'Seleccionar'}
                              </span>
                              <span className="text-gray-400 text-xs">▼</span>
                            </summary>
                            <div className="absolute z-20 w-56 mt-1 bg-white border border-gray-200 shadow-xl rounded-lg p-2 flex flex-col gap-1 max-h-60 overflow-y-auto">
                              {CATEGORIES.map((c) => (
                                <label
                                  key={c}
                                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-rose-50 p-1.5 rounded transition"
                                >
                                  <input
                                    type="checkbox"
                                    className="rounded text-rose-500 focus:ring-rose-500 cursor-pointer"
                                    checked={Array.isArray(product.category) && product.category.includes(c)}
                                    onChange={(e) => {
                                      const actual = Array.isArray(product.category) ? product.category : [];
                                      handleChange(
                                        base.id,
                                        'category',
                                        e.target.checked ? [...actual, c] : actual.filter((i) => i !== c)
                                      );
                                    }}
                                  />
                                  {c}
                                </label>
                              ))}
                            </div>
                          </details>
                        </td>
                        <td className="px-6 py-4 relative align-top pt-8">
                          <details className="group">
                            <summary className="bg-white border border-gray-200 hover:border-rose-300 text-gray-800 text-sm rounded-lg p-2 cursor-pointer list-none min-h-[38px] flex items-center justify-between shadow-sm">
                              <span className="truncate pr-2">
                                {Array.isArray(product.occasion) && product.occasion.length > 0
                                  ? product.occasion.join(', ')
                                  : 'Seleccionar'}
                              </span>
                              <span className="text-gray-400 text-xs">▼</span>
                            </summary>
                            <div className="absolute z-20 w-56 right-6 mt-1 bg-white border border-gray-200 shadow-xl rounded-lg p-2 flex flex-col gap-1 max-h-60 overflow-y-auto">
                              {OCCASIONS.map((o) => (
                                <label
                                  key={o}
                                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-rose-50 p-1.5 rounded transition"
                                >
                                  <input
                                    type="checkbox"
                                    className="rounded text-rose-500 focus:ring-rose-500 cursor-pointer"
                                    checked={Array.isArray(product.occasion) && product.occasion.includes(o)}
                                    onChange={(e) => {
                                      const actual = Array.isArray(product.occasion) ? product.occasion : [];
                                      handleChange(
                                        base.id,
                                        'occasion',
                                        e.target.checked ? [...actual, o] : actual.filter((i) => i !== o)
                                      );
                                    }}
                                  />
                                  {o}
                                </label>
                              ))}
                            </div>
                          </details>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 align-top">
                          <textarea
                            value={product.description || ''}
                            onChange={(e) => handleChange(base.id, 'description', e.target.value)}
                            placeholder="Un detalle especial y único..."
                            className="w-full min-h-[120px] bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition resize-y"
                          />
                        </td>
                        <td className="px-6 py-4 align-top">
                          <DetailsEditor
                            details={product.details}
                            onChange={(nuevos) => handleChange(base.id, 'details', nuevos)}
                          />
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={activeTab === 'catalog' ? 6 : 3} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">🔍</span>
                      <p className="font-medium">Ningún producto coincide con los filtros.</p>
                      {hayFiltros && (
                        <button
                          onClick={limpiarFiltros}
                          className="text-rose-500 font-bold mt-1"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barra fija de guardado */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
          <div className="flex items-center gap-3 text-sm">
            {statusMessage ? (
              <span
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold ${statusMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              >
                {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {statusMessage.text}
              </span>
            ) : hayPendientes ? (
              <span className="text-amber-600 font-bold">
                {pendientes.length} {pendientes.length === 1 ? 'producto sin guardar' : 'productos sin guardar'}
              </span>
            ) : (
              <span className="text-gray-400">Todo guardado.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={descartar}
              disabled={!hayPendientes || guardando}
              className="px-5 py-3 rounded-xl font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RotateCcw size={18} /> Descartar
            </button>
            <button
              onClick={guardar}
              disabled={!hayPendientes || guardando}
              className="px-8 py-3 rounded-xl font-bold text-white bg-gray-900 hover:bg-rose-500 transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-900 flex items-center gap-2"
            >
              {guardando ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
