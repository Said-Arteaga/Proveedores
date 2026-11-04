import { iniciarCrud, dinero, nombreCatalogo } from './crud.js';

const compra = (registro, catalogos) => registro.compra?.numFactura
    ? `${registro.compra.numFactura} (#${registro.idCompra})`
    : nombreCatalogo(catalogos, 'idCompra', registro.idCompra, item => item.numFactura);
const pieza = (registro, catalogos) => registro.pieza?.nombre
    ? `${registro.pieza.nombre} (#${registro.idPieza})`
    : nombreCatalogo(catalogos, 'idPieza', registro.idPieza, item => item.nombre);

iniciarCrud({
    endpoint: '/api/pieza-comprada',
    singular: 'pieza comprada',
    claves: ['idCompra', 'idPieza'],
    campos: ['idCompra', 'idPieza', 'cantidad', 'subTotal'],
    catalogos: [
        { campo: 'idCompra', endpoint: '/api/compras', nombre: 'una compra', plural: 'compras',
            etiqueta: item => `${item.numFactura}${item.proveedor?.nombre ? ' · ' + item.proveedor.nombre : ''}` },
        { campo: 'idPieza', endpoint: '/api/piezas', nombre: 'una pieza', plural: 'piezas', etiqueta: item => item.nombre }
    ],
    columnas: (registro, catalogos) => [compra(registro, catalogos), pieza(registro, catalogos), registro.cantidad, dinero(registro.subTotal ?? 0)],
    descripcion: (registro, catalogos) => `${compra(registro, catalogos)} / ${pieza(registro, catalogos)}`,
    preparar: datos => ({ idCompra: Number(datos.idCompra), idPieza: Number(datos.idPieza), cantidad: Number(datos.cantidad), subTotal: datos.subTotal })
});
