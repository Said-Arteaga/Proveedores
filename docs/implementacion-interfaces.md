# Interfaces de proveedores

Rama de trabajo: `feature/adrian`.

## Estructura revisada

- Backend: Express 5, TypeScript, TypeORM, mysql2 y dotenv. `src/app.ts` registra las cinco rutas API; `src/server.ts` inicia HTTP después de conectar con MySQL.
- Frontend: HTML, CSS y JavaScript nativos en `frontend/public`. Las imágenes se encuentran en `frontend/src_/assets`. No existe un framework ni un sistema de componentes.
- Diseño existente: Outfit, encabezado con `fondo_inicio.jpg`, iconos PNG, bordes redondeados y botones con degradado `#4a148c` / `#ab47bc`.
- Proveedores ya tiene un formulario de alta. Proveedor-Pieza y Pieza Comprada no tienen pantallas. Inicio incluye botones todavía sin navegación para estos dos módulos.
- API: `/api/proveedores`, `/api/proveedor-pieza`, `/api/pieza-comprada`; catálogos auxiliares `/api/piezas` y `/api/compras`.
- Identificadores: proveedor tiene ID autogenerado; las otras dos entidades tienen claves compuestas. Estas claves quedan bloqueadas durante la edición.
- El dump usa `proveedor`, `pieza`, `compras`, `proveedorpieza` y `piezacomprada` en minúsculas. No se cambiará su estructura ni se importará sobre una base existente.

## Diseño y alcance

Reutilizar el diseño existente y completar tres pantallas con formulario, listado, búsqueda local, recarga, edición, cancelación y eliminación confirmada. Mostrar nombres de proveedores/piezas y factura de compra en selectores, conservando sus IDs para la API. Mostrar estados de carga, catálogos vacíos y errores; bloquear envíos simultáneos. Mantener el diseño de inicio y añadir solamente los enlaces de estos módulos.

Servir las páginas en `/frontend/` y los recursos en `/assets/` desde Express, con llamadas a la API del mismo origen. Conservar la respuesta API de `/`. Compartir estilos y comportamiento CRUD sin añadir dependencias al frontend. Insertar textos de API mediante `textContent`.

Reutilizar los controladores y repositorios TypeORM. Añadir validaciones de campos, importes, fechas e IDs y respuestas 400/404/409 sin alterar los contratos existentes. Usar inserción para altas de claves compuestas para impedir sobrescrituras. No recalcular el total de Compra: ese campo conserva su comportamiento actual.

## Plan de ejecución y verificación

- [x] Añadir pruebas HTTP de rutas estáticas, CRUD, claves compuestas, duplicados, validaciones y restricciones con repositorios de prueba; ejecutarlas antes de implementar.
- [x] Servir frontend/recursos, añadir scripts npm y ejemplo de configuración MySQL.
- [x] Implementar validación acotada a los tres controladores y ajustar nombres de tablas al dump.
- [x] Completar las tres interfaces con estilos y utilidades compartidos, enlazando los módulos desde inicio.
- [x] Compilar y ejecutar pruebas; verificar las pantallas en navegador en escritorio y móvil, incluyendo errores, edición y borrado.
- [x] Revisar el diff y confirmar que permanece en `feature/adrian`.

## Entorno

No hay `.env` ni servicio en `localhost:3306`; Docker está instalado pero su daemon no está activo. Las pruebas con repositorios de prueba verifican HTTP y comportamiento, pero no sustituyen la comprobación de persistencia en MySQL. Documentar esta limitación si sigue sin estar disponible al terminar.

## Resultado de verificación

- `npm test`: compilación correcta y nueve pruebas HTTP aprobadas.
- Chrome con repositorios de prueba: CRUD de las tres pantallas; búsqueda, cancelación de edición/eliminación, duplicados, claves bloqueadas, proveedores con compras, contenido mostrado como texto, catálogos vacíos, recuperación de errores API/red y navegación. Sin errores JavaScript. Inspección visual a 1440 px y 390 px, con desplazamiento horizontal acotado a las tablas.
- Revisión de código independiente: sin hallazgos funcionales bloqueantes.
- `node dist/prueba-conexion.js`: conexión rechazada (`ECONNREFUSED`, localhost:3306). El usuario indicó que configurará `.env` e iniciará MySQL.
- Pendiente: `npm run test:mysql`. Se añadió esta prueba optativa con registros propios y limpieza para verificar SQL, relaciones y CRUD reales cuando esté disponible la conexión.
