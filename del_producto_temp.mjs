import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCZ2irwGhTw0HdTNYULS49Rl1sKoSBu68E",
  authDomain: "admin-ventas-691ef.firebaseapp.com",
  projectId: "admin-ventas-691ef",
  storageBucket: "admin-ventas-691ef.firebasestorage.app",
  messagingSenderId: "926185738525",
  appId: "1:926185738525:web:09e57cf1992b15a33751f4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const q = query(collection(db, 'productos'), where('emprendimiento', '==', 'Regalos'));
const snap = await getDocs(q);

const candidatos = snap.docs.filter(d => {
  const name = d.data().name || '';
  return name.toLowerCase().includes('momentos') || name.toLowerCase().includes('hotweel');
});

if (candidatos.length === 0) {
  console.log('No se encontró el producto.');
} else {
  for (const c of candidatos) {
    console.log(`Eliminando: "${c.data().name}" (id: ${c.id})`);
    await deleteDoc(doc(db, 'productos', c.id));
    console.log('✓ Eliminado');
  }
}
process.exit(0);
