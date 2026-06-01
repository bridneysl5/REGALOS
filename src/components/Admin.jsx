import React, { useState } from 'react';
import { ALL_PRODUCTS } from '../data';
import { AlertCircle, CheckCircle2, Plus, X } from 'lucide-react';

const DetailsEditor = ({ product, onChange }) => {
  const [details, setDetails] = useState(product.details || []);

  const addDetail = () => {
    const newDetails = [...details, ''];
    setDetails(newDetails);
    onChange(newDetails);
  };

  const updateDetail = (index, value) => {
    const newDetails = [...details];
    newDetails[index] = value;
    setDetails(newDetails);
  };

  const removeDetail = (index) => {
    const newDetails = details.filter((_, i) => i !== index);
    setDetails(newDetails);
    onChange(newDetails);
  };

  return (
    <div className="flex flex-col gap-2 min-w-[300px]">
      {details.map((detail, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <input 
             value={detail} 
             onChange={(e) => updateDetail(idx, e.target.value)}
             onBlur={() => onChange(details)}
             placeholder="Ej. Contiene 1 peluche..."
             className="border border-gray-200 focus:border-rose-500 outline-none rounded-lg px-3 py-2 flex-1 text-sm bg-white"
          />
          <button onClick={() => removeDetail(idx)} className="text-red-400 hover:text-red-600 transition p-1">
            <X size={16} />
          </button>
        </div>
      ))}
      <button onClick={addDetail} className="text-sm text-rose-500 font-bold flex items-center gap-1 hover:text-rose-600 transition w-fit mt-1">
        <Plus size={16} /> Añadir detalle
      </button>
    </div>
  );
};

const Admin = () => {
  const [products, setProducts] = useState([...ALL_PRODUCTS]);
  const [search, setSearch] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('catalog');

  const categories = ['Sets y Gift Boxes', 'Arreglos de Flores', 'Cuadros', 'Tortas y Repostería'];
  const occasions = ['Cumpleaños', 'Graduación', 'Aniversarios y Parejas', 'Para Ella', 'Para El', 'Día del Padre', 'Nacimientos', 'Nacimientos / Baby Shower', 'Bodas y Compromisos'];

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleChange = (id, field, newValue) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        return { ...p, [field]: field === 'price' ? Number(newValue) : newValue };
      }
      return p;
    }));

    const p = products.find(prod => prod.id === id);
    
    const payload = {
      id,
      name: field === 'name' ? newValue : p.name,
      price: field === 'price' ? Number(newValue) : p.price,
      category: field === 'category' ? newValue : p.category,
      occasion: field === 'occasion' ? newValue : p.occasion,
      isTop: field === 'isTop' ? newValue : p.isTop,
      isCheap: field === 'isCheap' ? newValue : p.isCheap,
      description: field === 'description' ? newValue : p.description,
      details: field === 'details' ? newValue : p.details,
    };

    updateProductOnServer(payload);
  };

  const updateProductOnServer = async (payload) => {
    try {
      const response = await fetch('/api/update-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Guardado correctamente' });
      } else {
        setStatusMessage({ type: 'error', text: 'Error al guardar' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Error de conexión' });
    }
    
    setTimeout(() => setStatusMessage(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Administrador de Catálogo</h2>
          <p className="text-gray-500">Modifica categorías, descripciones y detalles.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {statusMessage && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold animate-in zoom-in shrink-0 ${statusMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {statusMessage.text}
            </div>
          )}
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 w-full md:w-64"
          />
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
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden pb-32">
        <div className="overflow-x-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              {activeTab === 'catalog' ? (
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                  <th className="px-6 py-4 font-semibold">Producto</th>
                  <th className="px-6 py-4 font-semibold">Precio</th>
                  <th className="px-6 py-4 font-semibold text-center">Top</th>
                  <th className="px-6 py-4 font-semibold text-center">Barato</th>
                  <th className="px-6 py-4 font-semibold w-64">Categoría(s)</th>
                  <th className="px-6 py-4 font-semibold w-64">Ocasión(es)</th>
                </tr>
              ) : (
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                  <th className="px-6 py-4 font-semibold w-1/4">Producto</th>
                  <th className="px-6 py-4 font-semibold w-1/3">Descripción General</th>
                  <th className="px-6 py-4 font-semibold">Detalles (Puntos Clave)</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                        <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      {activeTab === 'catalog' ? (
                        <input 
                          type="text"
                          value={product.name}
                          onChange={(e) => handleChange(product.id, 'name', e.target.value)}
                          className="font-bold text-gray-800 text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-rose-500 outline-none w-full max-w-[200px] px-1 py-0.5 transition"
                        />
                      ) : (
                        <span className="font-bold text-gray-800 text-sm">{product.name}</span>
                      )}
                    </div>
                  </td>

                  {activeTab === 'catalog' ? (
                    <>
                      <td className="px-6 py-4 font-bold text-gray-700 align-top pt-8">
                        <div className="flex items-center gap-1">
                          <span>S/</span>
                          <input 
                            type="number"
                            value={product.price}
                            onChange={(e) => handleChange(product.id, 'price', e.target.value)}
                            className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-rose-500 outline-none w-20 px-1 py-0.5 transition"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center align-top pt-8">
                        <input 
                          type="checkbox" 
                          className="rounded text-rose-500 focus:ring-rose-500 cursor-pointer w-5 h-5"
                          checked={!!product.isTop}
                          onChange={(e) => handleChange(product.id, 'isTop', e.target.checked)}
                        />
                      </td>
                      <td className="px-6 py-4 text-center align-top pt-8">
                        <input 
                          type="checkbox" 
                          className="rounded text-rose-500 focus:ring-rose-500 cursor-pointer w-5 h-5"
                          checked={!!product.isCheap}
                          onChange={(e) => handleChange(product.id, 'isCheap', e.target.checked)}
                        />
                      </td>
                      <td className="px-6 py-4 relative align-top pt-8">
                        <details className="group">
                          <summary className="bg-white border border-gray-200 hover:border-rose-300 text-gray-800 text-sm rounded-lg p-2 cursor-pointer list-none min-h-[38px] flex items-center justify-between shadow-sm">
                            <span className="truncate pr-2">{Array.isArray(product.category) && product.category.length > 0 ? product.category.join(', ') : 'Seleccionar'}</span>
                            <span className="text-gray-400 text-xs">▼</span>
                          </summary>
                          <div className="absolute z-20 w-56 mt-1 bg-white border border-gray-200 shadow-xl rounded-lg p-2 flex flex-col gap-1 max-h-60 overflow-y-auto">
                            {categories.map(c => (
                              <label key={c} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-rose-50 p-1.5 rounded transition">
                                <input 
                                  type="checkbox" 
                                  className="rounded text-rose-500 focus:ring-rose-500 cursor-pointer"
                                  checked={Array.isArray(product.category) && product.category.includes(c)}
                                  onChange={(e) => {
                                    const current = Array.isArray(product.category) ? product.category : [];
                                    const newValue = e.target.checked ? [...current, c] : current.filter(item => item !== c);
                                    handleChange(product.id, 'category', newValue);
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
                            <span className="truncate pr-2">{Array.isArray(product.occasion) && product.occasion.length > 0 ? product.occasion.join(', ') : 'Seleccionar'}</span>
                            <span className="text-gray-400 text-xs">▼</span>
                          </summary>
                          <div className="absolute z-20 w-56 right-6 mt-1 bg-white border border-gray-200 shadow-xl rounded-lg p-2 flex flex-col gap-1 max-h-60 overflow-y-auto">
                            {occasions.map(o => (
                              <label key={o} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-rose-50 p-1.5 rounded transition">
                                <input 
                                  type="checkbox" 
                                  className="rounded text-rose-500 focus:ring-rose-500 cursor-pointer"
                                  checked={Array.isArray(product.occasion) && product.occasion.includes(o)}
                                  onChange={(e) => {
                                    const current = Array.isArray(product.occasion) ? product.occasion : [];
                                    const newValue = e.target.checked ? [...current, o] : current.filter(item => item !== o);
                                    handleChange(product.id, 'occasion', newValue);
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
                          defaultValue={product.description || ''}
                          onBlur={(e) => handleChange(product.id, 'description', e.target.value)}
                          placeholder="Un detalle especial y único..."
                          className="w-full min-h-[120px] bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition resize-y"
                        />
                      </td>
                      <td className="px-6 py-4 align-top">
                        <DetailsEditor 
                          product={product} 
                          onChange={(newDetails) => handleChange(product.id, 'details', newDetails)} 
                        />
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={activeTab === 'catalog' ? 6 : 3} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">🔍</span>
                      <p className="font-medium">No se encontraron productos con ese nombre.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
