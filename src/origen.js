// ---------------------------------------------------------------------------
// ¿De dónde llegó el visitante? (Instagram, Facebook, TikTok, Google...)
//
// Se calcula una sola vez al entrar a la web y se recuerda durante la visita.
// Para medir campañas, usa enlaces con ?utm_source=..., por ejemplo:
//   https://momentos365.com/?utm_source=instagram
//   https://momentos365.com/hotwheels?utm_source=tiktok
// ---------------------------------------------------------------------------

const CLAVE = 'm365_origen';

const desdeReferente = (ref) => {
  if (!ref) return 'directo';
  if (/instagram\./i.test(ref)) return 'instagram';
  if (/facebook\.|fb\.|messenger\./i.test(ref)) return 'facebook';
  if (/tiktok\./i.test(ref)) return 'tiktok';
  if (/google\./i.test(ref)) return 'google';
  if (/whatsapp\.|wa\.me/i.test(ref)) return 'whatsapp';
  try {
    if (new URL(ref).host === window.location.host) return 'directo';
  } catch { /* referente raro: se trata como otro sitio */ }
  return 'otro sitio';
};

export const detectarOrigen = () => {
  try {
    const guardado = sessionStorage.getItem(CLAVE);
    if (guardado) return guardado;
  } catch { /* navegador sin almacenamiento */ }

  const params = new URLSearchParams(window.location.search);
  const utm = params.get('utm_source') || params.get('ref') || '';
  const origen = (utm || desdeReferente(document.referrer)).toLowerCase().trim().slice(0, 40) || 'directo';

  try { sessionStorage.setItem(CLAVE, origen); } catch { /* sin almacenamiento */ }
  return origen;
};
