// Almacenamiento de archivos de Firebase (fotos de productos).
// Va en su propio archivo para que solo lo descargue el admin, no la tienda.
import { getStorage } from "firebase/storage";
import { app } from "./firebase";

export const storage = getStorage(app);
