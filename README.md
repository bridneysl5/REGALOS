# Momentos365 — Tienda de regalos

Tienda web de [momentos365.com](https://momentos365.com) con panel de administración.

- **Tienda:** catálogo por categorías y ocasiones, carrito y pedido por WhatsApp.
- **Momentos QR / RA:** álbumes digitales que se abren al escanear un código.
- **Panel `/admin`:** dashboard, productos, inventario, ventas, historial, pedidos web, usuarios.

**Tecnología:** React 19 + Vite + Tailwind CSS 4, Firebase (Firestore, Storage y Authentication), publicado en Netlify.

## Cómo trabajar

```bash
npm install
npm run dev      # servidor local
npm run build    # genera dist/ (lo mismo que hace Netlify)
npm run lint
```

## Estructura

| Ruta | Qué hay |
| --- | --- |
| `src/App.jsx` | La tienda (inicio, catálogo, carrito, paquetes) |
| `src/components/Footer.jsx` | Pie de página de la tienda |
| `src/whatsapp.js` | Botones de WhatsApp + registro en `pedidos_web` |
| `src/origen.js` | Detecta de dónde llegó el visitante (Instagram, TikTok, `?utm_source=`…) |
| `src/components/Admin.jsx` | Login y menú del panel |
| `src/components/admin/` | Cada sección del panel |
| `src/adminAuth.js` | Inicio de sesión con Firebase Authentication |
| `src/adminFirebase.js` | Lecturas y escrituras de usuarios, inventario, ventas y pedidos web |
| `firestore.rules`, `storage.rules` | Reglas de seguridad de Firebase |

## Acceso al panel (Firebase Authentication)

Cada persona entra con **su correo y su clave**. Las claves las guarda Firebase; no hay clave maestra en el código.
El rol de cada persona está en `usuarios_admin/{uid}` con `rol`: `owner`, `admin`, `ventas` o `inventario`.

### Primera vez (crear al dueño)

1. Firebase Console → **Authentication** → *Sign-in method* → activa **Correo electrónico/contraseña**.
2. Authentication → *Users* → **Add user**: tu correo y una clave. Copia el **UID** que aparece.
3. Firestore Database → colección `usuarios_admin` → **Agregar documento**:
   - ID del documento: el **UID** copiado
   - Campos: `nombre` (string), `email` (string), `rol` = `owner` (string), `activo` = `true` (boolean)
4. Entra a `/admin` con ese correo. Desde **Usuarios** creas al resto del equipo.
5. Los usuarios antiguos (nombre + clave) aparecen marcados como "sistema anterior": vuelve a crearlos con correo y elimina los antiguos.

### Publicar las reglas de seguridad

Firebase Console → Firestore Database → **Reglas** → pega `firestore.rules` → Publicar.
Firebase Console → Storage → **Reglas** → pega `storage.rules` → Publicar.
(O con la CLI: `firebase deploy --only firestore:rules,storage`).

> ⚠️ Este proyecto de Firebase también lo usa **admin-ventas**. Antes de publicar las reglas, esa app
> también debe iniciar sesión con Firebase Authentication; si no, dejará de poder leer y guardar.

## Medir de dónde llegan los clientes

- Cada clic en "Enviar pedido por WhatsApp", la burbuja de consulta o "Cotizar paquete" se guarda en
  `pedidos_web` y se ve en **Admin → Pedidos web** (cuántos escriben, de dónde, cuántos compran).
- En redes, comparte enlaces con `?utm_source=`: `https://momentos365.com/?utm_source=instagram`.
- Al registrar una venta, elige **¿Cómo llegó el cliente?** para ver las ventas por canal en el Dashboard.

## Notas

- `npm run build` también ejecuta `scripts/musica.mjs` y `scripts/seo.mjs` (lista de canciones y páginas para SEO).
- La campaña de inicio se cambia en `src/campana.js`.
