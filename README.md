# Sistema de Proveedores

Backend Express/TypeScript con TypeORM y MySQL. Frontend HTML, CSS y JavaScript sin framework. Las interfaces reutilizan el diseño e imágenes originales del proyecto.

## Iniciar

1. Instalar las dependencias con `npm ci`.
2. Copiar `.env.example` a `.env` y configurar el host, puerto, usuario, contraseña y nombre de la base MySQL. El dump compartido corresponde a `proveedores`; TypeORM tiene `synchronize: false`, por lo que la base y sus tablas deben existir previamente.
3. Encender MySQL y comprobar la conexión con `npm run db:check`.
4. Ejecutar `npm run dev` y abrir [el inicio](http://localhost:3000/frontend/).

Para ejecutar el código compilado: `npm run build` y después `npm start`.

## Interfaces

| Interfaz | Página | API |
| --- | --- | --- |
| Proveedores | `/frontend/proveedores.html` | `/api/proveedores` |
| Proveedor - Pieza | `/frontend/proveedor-pieza.html` | `/api/proveedor-pieza` |
| Pieza Comprada | `/frontend/pieza-comprada.html` | `/api/pieza-comprada` |

Las tres permiten agregar, listar, buscar, editar y eliminar. Los formularios de relaciones cargan opciones desde `/api/proveedores`, `/api/piezas` y `/api/compras`; necesitan catálogos existentes. Las claves compuestas quedan bloqueadas en edición. La búsqueda se realiza sobre el listado cargado, sin modificar la base.

Express sirve las páginas y las imágenes bajo `/frontend/` y `/assets/`. Se deben abrir desde el servidor, que utiliza el mismo origen que la API. La ruta `/` conserva su respuesta JSON original.

Las relaciones duplicadas devuelven 409; las referencias inexistentes y campos inválidos devuelven 400. MySQL impide borrar proveedores con compras asociadas. Al borrar un proveedor sin compras, sus relaciones Proveedor-Pieza se eliminan por la regla CASCADE existente. El subtotal de una pieza comprada se captura explícitamente; el total de Compra mantiene su comportamiento original.

## Verificación

- `npm test`: compila y prueba las rutas HTTP y el CRUD con repositorios en memoria, incluyendo duplicados, restricciones, fechas, cantidades e importes. No necesita MySQL y no verifica persistencia real.
- `npm run db:check`: prueba la conexión MySQL definida en `.env`.
- `npm run test:mysql`: ejecuta el CRUD real mediante HTTP y TypeORM contra MySQL. Crea registros identificados con el prefijo `QA-`, comprueba las relaciones y elimina sus registros al terminar. Requiere la base con las cinco tablas del dump y permisos de lectura/escritura.

La revisión de estructura y las decisiones de implementación están en [docs/implementacion-interfaces.md](docs/implementacion-interfaces.md).
