import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Esta configuración es pública por diseño (va en todas las webs con Firebase).
// La seguridad real está en las reglas: ver firestore.rules y storage.rules.
export const firebaseConfig = {
  apiKey: "AIzaSyCZ2irwGhTw0HdTNYULS49Rl1sKoSBu68E",
  authDomain: "admin-ventas-691ef.firebaseapp.com",
  projectId: "admin-ventas-691ef",
  storageBucket: "admin-ventas-691ef.firebasestorage.app",
  messagingSenderId: "926185738525",
  appId: "1:926185738525:web:09e57cf1992b15a33751f4"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
