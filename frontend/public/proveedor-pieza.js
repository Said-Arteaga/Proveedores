import { iniciarCrud, dinero, fecha, nombreCatalogo } from './crud.js';

const proveedor = (registro, catalogos) => registro.proveedor?.nombre
    ? `${registro.proveedor.nombre} (#${registro.idProveedor})`
    : nombreCatalogo(catalogos, 'idProveedor', registro.idProveedor, item => item.nombre);
const pieza = (registro, catalogos) => registro.pieza?.nombre
    ? `${registro.pieza.nombre} (#${registro.idPieza})`
    : nombreCatalogo(catalogos, 'idPieza', registro.idPieza, item => item.nombre);

iniciarCrud({
    endpoint: '/api/proveedor-pieza',
    singular: 'relación',
    claves: ['idProveedor', 'idPieza'],
    campos: ['idProveedor', 'idPieza', 'precio', 'fecha'],
    catalogos: [
        { campo: 'idProveedor', endpoint: '/api/proveedores', nombre: 'un proveedor', plural: 'proveedores', etiqueta: item => item.nombre },
        { campo: 'idPieza', endpoint: '/api/piezas', nombre: 'una pieza', plural: 'piezas', etiqueta: item => item.nombre }
    ],
    columnas: (registro, catalogos) => [proveedor(registro, catalogos), pieza(registro, catalogos), dinero(registro.precio ?? 0), fecha(registro.fecha)],
    busquedaExtra: registro => [registro.fecha],
    descripcion: (registro, catalogos) => `${proveedor(registro, catalogos)} / ${pieza(registro, catalogos)}`,
    preparar: datos => ({ idProveedor: Number(datos.idProveedor), idPieza: Number(datos.idPieza), precio: datos.precio, fecha: datos.fecha })
});
