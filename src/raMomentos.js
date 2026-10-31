// ---------------------------------------------------------------------------
// Momentos con realidad aumentada (ar.momentos365.com) desde el admin.
//
// Todo el trabajo pesado pasa en el navegador (celular o laptop):
//   - se achican las fotos,
//   - se prepara el reconocimiento de la foto del regalo (targets.mind) con el
//     mismo compilador de MindAR que usa el visor,
//   - se arma el QR.
// Luego los archivos se suben a Cloudflare (R2) con la clave de subida.
// ---------------------------------------------------------------------------

import QRCode from 'qrcode';

export const RA_API = (import.meta.env.VITE_RA_API || 'https://ar.momentos365.com').replace(/\/+$/, '');
export const MAX_FOTOS = 8;
const LADO_TARGET = 1000;
const LADO_FOTO = 1280;
export const MB = 1024 * 1024;
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0/O ni 1/I/L

const CLAVE_KEY = 'm365_ra_clave';
export const leerClave = () => { try { return localStorage.getItem(CLAVE_KEY) || ''; } catch { return ''; } };
export const guardarClave = (c) => { try { localStorage.setItem(CLAVE_KEY, c); } catch { /* sin almacenamiento */ } };
export const borrarClave = () => { try { localStorage.removeItem(CLAVE_KEY); } catch { /* sin almacenamiento */ } };

export const urlDelMomento = (codigo) => `${RA_API}/m/${codigo}/`;
export const mb = (n) => (n / MB).toFixed(1) + ' MB';

// ─── API ────────────────────────────────────────────────────────────────────
async function api(clave, ruta, { permitir404 = false, ...opciones } = {}) {
  let r;
  try {
    r = await fetch(`${RA_API}/api/momentos${ruta}`, {
      ...opciones,
      headers: { Authorization: `Bearer ${clave}`, ...(opciones.headers || {}) },
    });
  } catch {
    throw new Error('Sin conexión con ar.momentos365.com. Revisa tu internet.');
  }
  let datos = {};
  try { datos = await r.json(); } catch { /* sin cuerpo */ }
  if (!r.ok && !(permitir404 && r.status === 404)) {
    const e = new Error(datos.error || `Error ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return { status: r.status, ...datos };
}

export const listarMomentos = (clave) => api(clave, '').then((d) => d.momentos || []);
export const eliminarMomentoRA = (clave, codigo) => api(clave, `/${codigo}`, { method: 'DELETE' });

/** Sube un archivo con avance (XHR, porque fetch no informa el progreso de subida). */
function subirArchivo(clave, codigo, nombre, blob, onAvance) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', `${RA_API}/api/momentos/${codigo}/${nombre}`);
    xhr.setRequestHeader('Authorization', `Bearer ${clave}`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onAvance) onAvance(e.loaded); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let msg = `Error ${xhr.status}`;
      try { msg = JSON.parse(xhr.responseText).error || msg; } catch { /* nada */ }
      reject(new Error(`${nombre}: ${msg}`));
    };
    xhr.onerror = () => reject(new Error('Se cortó la conexión al subir ' + nombre));
    xhr.send(blob);
  });
}

// ─── Imágenes ───────────────────────────────────────────────────────────────
export async function leerImagen(file) {
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { return await createImageBitmap(file); }
}
export function achicar(bmp, lado) {
  const k = Math.min(1, lado / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(bmp, 0, 0, c.width, c.height);
  return c;
}
const aBlob = (canvas, tipo = 'image/jpeg', q = 0.9) => new Promise((r) => canvas.toBlob(r, tipo, q));

// ─── Reconocimiento de la foto (MindAR) ─────────────────────────────────────
let cargaMindar = null;
const cargarCompilador = () => {
  if (!cargaMindar) {
    cargaMindar = import(/* @vite-ignore */ `${RA_API}/lib/mindar/mindar-image.prod.js`)
      .then(() => window.MINDAR.IMAGE.Compiler)
      .catch((e) => { cargaMindar = null; throw e; });
  }
  return cargaMindar;
};

/** Prepara la foto del regalo: devuelve el canvas (1000 px), el .mind y sus puntos. */
export async function prepararFotoRegalo(file, onAvance) {
  const canvas = achicar(await leerImagen(file), LADO_TARGET);
  const Compiler = await cargarCompilador();
  const compiler = new Compiler();
  const lista = await compiler.compileImageTargets([canvas], (p) => onAvance && onAvance(p));
  const puntos = (lista[0].matchingData || []).reduce(
    (a, m) => a + (m.maximaPoints || []).length + (m.minimaPoints || []).length, 0);
  const mind = new Uint8Array(await compiler.exportData());
  return { canvas, mind, puntos };
}

export function calidad(puntos) {
  if (puntos >= 3000) return { nivel: 'ok', titulo: 'Excelente', texto: 'La cámara la reconocerá fácil.' };
  if (puntos >= 1800) return { nivel: 'ok', titulo: 'Buena', texto: 'Debería reconocerse bien.' };
  if (puntos >= 1000) return { nivel: 'medio', titulo: 'Regular', texto: 'Puede costar. Mejor una foto más nítida o con más detalle.' };
  return { nivel: 'mal', titulo: 'Débil', texto: 'Usa otra foto: más nítida, con más detalle y contraste.' };
}

export function infoVideo(file) {
  return new Promise((res) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () => { res({ dur: v.duration, w: v.videoWidth, h: v.videoHeight }); URL.revokeObjectURL(v.src); };
    v.onerror = () => res(null);
    v.src = URL.createObjectURL(file);
  });
}

// ─── QR (mismo diseño que el armador de la laptop) ──────────────────────────
export function dibujarQR(url, codigo) {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'H' });
  const n = qr.modules.size, celda = Math.floor(440 / n), lado = n * celda;
  const W = 600, H = 780;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#ff2b5e'; g.font = 'bold 40px system-ui, sans-serif'; g.textAlign = 'center';
  g.fillText('Escanea tu sorpresa', W / 2, 72);
  g.fillStyle = '#6b4a5a'; g.font = '24px system-ui, sans-serif';
  g.fillText('y apunta la cámara a la foto ♥', W / 2, 112);
  const x0 = Math.round((W - lado) / 2), y0 = 150;
  g.fillStyle = '#1a0a1e';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.modules.get(r, k)) g.fillRect(x0 + k * celda, y0 + r * celda, celda, celda);
  g.fillStyle = '#1a0a1e'; g.font = 'bold 30px system-ui, sans-serif';
  g.fillText('✿ Momentos365', W / 2, y0 + lado + 70);
  g.fillStyle = '#9a7a8a'; g.font = '22px ui-monospace, monospace';
  g.fillText(codigo, W / 2, y0 + lado + 108);
  return c;
}
export const qrComoDataUrl = (codigo) => dibujarQR(urlDelMomento(codigo), codigo).toDataURL('image/png');

export function descargarQR(codigo) {
  const a = document.createElement('a');
  a.href = qrComoDataUrl(codigo);
  a.download = `QR-${codigo}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ─── Crear el momento ───────────────────────────────────────────────────────
function nuevoCodigo() {
  const r = crypto.getRandomValues(new Uint32Array(6));
  return Array.from(r, (n) => ALFABETO[n % ALFABETO.length]).join('');
}

async function codigoLibre(clave) {
  for (let i = 0; i < 10; i++) {
    const codigo = nuevoCodigo();
    const r = await api(clave, `/${codigo}`, { permitir404: true });
    if (r.status === 404) return codigo;
  }
  throw new Error('No se pudo generar un código. Intenta de nuevo.');
}

/**
 * datos = { foto: {canvas, mind}, tipo: 'fotos'|'video', fotos: File[], video: File,
 *           musica: Blob|null, titulo, mensaje, cliente }
 * onEstado({ texto, avance 0..1 })
 */
export async function crearMomentoRA(clave, datos, onEstado = () => {}) {
  onEstado({ texto: 'Preparando…', avance: 0 });
  const codigo = await codigoLibre(clave);

  const archivos = [
    { nombre: 'foto.jpg', blob: await aBlob(datos.foto.canvas, 'image/jpeg', 0.9) },
    { nombre: 'targets.mind', blob: new Blob([datos.foto.mind]) },
  ];
  if (datos.tipo === 'video') {
    archivos.push({ nombre: 'video.mp4', blob: datos.video });
  } else {
    for (let i = 0; i < datos.fotos.length; i++) {
      onEstado({ texto: `Achicando fotos ${i + 1}/${datos.fotos.length}…`, avance: 0 });
      const c = achicar(await leerImagen(datos.fotos[i]), LADO_FOTO);
      archivos.push({ nombre: `fotos/${i + 1}.jpg`, blob: await aBlob(c, 'image/jpeg', 0.85) });
    }
  }
  if (datos.musica) archivos.push({ nombre: 'musica.mp3', blob: datos.musica });

  const total = archivos.reduce((a, f) => a + f.blob.size, 0);
  let listo = 0;
  for (let i = 0; i < archivos.length; i++) {
    const f = archivos[i];
    const texto = `Subiendo ${i + 1} de ${archivos.length}…`;
    await subirArchivo(clave, codigo, f.nombre, f.blob, (bytes) => onEstado({ texto, avance: (listo + bytes) / total }));
    listo += f.blob.size;
    onEstado({ texto, avance: listo / total });
  }

  onEstado({ texto: 'Publicando…', avance: 1 });
  await api(clave, `/${codigo}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipo: datos.tipo,
      fotos: datos.tipo === 'fotos' ? datos.fotos.length : 0,
      musica: !!datos.musica,
      titulo: datos.titulo,
      mensaje: datos.mensaje,
      cliente: datos.cliente,
      aspecto: +(datos.foto.canvas.height / datos.foto.canvas.width).toFixed(4),
      creado: new Date().toLocaleDateString('sv-SE'),
    }),
  });
  return { codigo, url: urlDelMomento(codigo) };
}
