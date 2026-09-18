// ---------------------------------------------------------------------------
// Campaña temporal: "Explorar Catálogo" lleva a Flores Amarillas
//
// Hasta la fecha de abajo, el botón principal del inicio abre directamente la
// ocasión Flores Amarillas (momentos365.com/flores-amarillas). Pasada esa
// fecha vuelve solo, sin tocar nada, al catálogo general.
//
// PARA CAMBIAR O TERMINAR LA CAMPAÑA: edita CAMPANA_FIN.
//   - Otra fecha: pon la nueva (ojo: el mes va con un número menos,
//     enero = 0, septiembre = 8).
//   - Terminarla ya: pon CAMPANA_ACTIVA = false.
// ---------------------------------------------------------------------------

export const CAMPANA_ACTIVA = true;

/** Ocasión a la que apunta la campaña (debe existir en routes.js). */
export const CAMPANA_OCASION = 'Flores Amarillas';

/** 21 de septiembre de 2026, 23:59:59 hora de Perú (UTC-5). */
export const CAMPANA_FIN = new Date('2026-09-21T23:59:59-05:00');

/** ¿La campaña sigue vigente ahora mismo? */
export const campanaVigente = () => CAMPANA_ACTIVA && Date.now() <= CAMPANA_FIN.getTime();
