import { iniciarCrud, dinero, fecha, nombreCatalogo } from './crud.js';

const proveedor = (registro, catalogos) => registro.proveedor?.nombre
    ? `${registro.proveedor.nombre} (#${registro.idProveedor})`
    : nombreCatalogo(catalogos, 'idProveedor', registro.idProveedor, item => item.nombre);

iniciarCrud({
    endpoint: '/api/compras',
    singular: 'compra',
    claves: ['idCompra'],
    campos: ['idProveedor', 'numFactura', 'fecha', 'total'],
    catalogos: [
        { campo: 'idProveedor', endpoint: '/api/proveedores', nombre: 'un proveedor', plural: 'proveedores', etiqueta: item => item.nombre }
    ],
    columnas: (registro, catalogos) => [registro.idCompra, registro.numFactura, proveedor(registro, catalogos),
        fecha(registro.fecha), dinero(registro.total ?? 0)],
    busquedaExtra: registro => [registro.fecha],
    descripcion: (registro, catalogos) => `${registro.numFactura} de ${proveedor(registro, catalogos)} (#${registro.idCompra})`,
    avisoEliminar: 'También se eliminarán las piezas compradas registradas en esta compra.',
    preparar: datos => ({ idProveedor: Number(datos.idProveedor), numFactura: datos.numFactura.trim(), fecha: datos.fecha, total: datos.total })
});
