// ---------------------------------------------------------------------------
// Lee public/musica/ y reescribe src/musica.js con lo que encuentre.
//
// Para agregar una canción: copia el MP3 a public/musica/ y listo. El nombre
// del archivo es el título que verás en el admin (los guiones se convierten en
// espacios), así que nómbralos bonito: "pintando-flores.mp3".
//
//   npm run musica     -> actualiza la lista a mano
//   npm run dev/build  -> ya lo corren solos
// ---------------------------------------------------------------------------

import { readdirSync, writeFileSync } from 'node:fs';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const carpeta = join(raiz, 'public', 'musica');
const destino = join(raiz, 'src', 'musica.js');

const SONIDOS = ['.mp3', '.m4a', '.ogg', '.wav'];

const aId = (nombre) =>
  nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const aTitulo = (nombre) => {
  const limpio = nombre.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
};

let archivos = [];
try {
  archivos = readdirSync(carpeta).filter((f) => SONIDOS.includes(extname(f).toLowerCase()));
} catch {
  console.warn('[musica] no existe public/musica/ todavía; la lista queda vacía.');
}

archivos.sort((a, b) => a.localeCompare(b, 'es'));

const filas = archivos.map((archivo) => {
  const sinExtension = basename(archivo, extname(archivo));
  return `  { id: '${aId(sinExtension)}', titulo: ${JSON.stringify(aTitulo(sinExtension))}, archivo: '/musica/${archivo}' },`;
});

const contenido = `// Generado por scripts/musica.mjs — no lo edites a mano.
// Para agregar una canción, copia el MP3 a public/musica/ y vuelve a correr
// \`npm run musica\` (o simplemente \`npm run dev\`).

export const MUSICA = [
${filas.join('\n')}
];

export const cancionPorId = (id) => MUSICA.find((c) => c.id === id) || null;
`;

writeFileSync(destino, contenido, 'utf8');
console.log(`[musica] ${archivos.length} canción(es) en la lista.`);
