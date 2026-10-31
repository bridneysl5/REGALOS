import { useEffect, useState } from 'react';

// Canales por los que llega una venta. Se usan en Ventas, Historial y Dashboard.
export const ORIGENES = [
  { value: 'whatsapp',    label: 'WhatsApp' },
  { value: 'instagram',   label: 'Instagram' },
  { value: 'facebook',    label: 'Facebook' },
  { value: 'tiktok',      label: 'TikTok' },
  { value: 'web',         label: 'Página web' },
  { value: 'tienda',      label: 'Tienda / en persona' },
  { value: 'recomendado', label: 'Recomendación' },
  { value: 'otro',        label: 'Otro' },
];

export const etiquetaOrigen = (valor) =>
  ORIGENES.find((o) => o.value === valor)?.label || (valor ? String(valor) : 'Sin dato');

/** Hora actual que se renueva cada minuto (para filtros de "hoy", "últimos 7 días"...). */
export const useAhora = () => {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, []);
  return ahora;
};
