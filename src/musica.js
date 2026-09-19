// Generado por scripts/musica.mjs — no lo edites a mano.
// Para agregar una canción, copia el MP3 a public/musica/ y vuelve a correr
// `npm run musica` (o simplemente `npm run dev`).

export const MUSICA = [
  { id: 'con-flores-te-llevaste-mi-tristeza', titulo: "Con flores te llevaste mi tristeza", archivo: '/musica/con-flores-te-llevaste-mi-tristeza.mp3' },
  { id: 'floricienta', titulo: "Floricienta", archivo: '/musica/floricienta.mp3' },
  { id: 'pintando-flores', titulo: "Pintando flores", archivo: '/musica/pintando-flores.mp3' },
  { id: 'when-i-was-your-man', titulo: "When i was your man", archivo: '/musica/when-i-was-your-man.mp3' },
];

export const cancionPorId = (id) => MUSICA.find((c) => c.id === id) || null;
