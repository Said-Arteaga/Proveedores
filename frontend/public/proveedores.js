import { iniciarCrud } from './crud.js';

iniciarCrud({
    endpoint: '/api/proveedores',
    singular: 'proveedor',
    claves: ['idProveedor'],
    campos: ['nombre', 'contacto', 'direccion', 'telefono', 'correo', 'latitud', 'longitud', 'ciudad', 'estado'],
    columnas: proveedor => [proveedor.idProveedor, proveedor.nombre, proveedor.contacto,
        proveedor.telefono, proveedor.correo, [proveedor.ciudad, proveedor.estado].filter(Boolean).join(', ')],
    busquedaExtra: proveedor => [proveedor.direccion, proveedor.latitud, proveedor.longitud],
    descripcion: proveedor => `${proveedor.nombre} (#${proveedor.idProveedor})`,
    avisoEliminar: 'También se eliminarán sus relaciones con piezas. Los proveedores con compras asociadas no pueden eliminarse.',
    preparar: datos => {
        const resultado = {};
        for (const [campo, valor] of Object.entries(datos)) {
            resultado[campo] = valor.trim() || null;
        }
        resultado.nombre = datos.nombre.trim();
        for (const campo of ['latitud', 'longitud']) {
            resultado[campo] = datos[campo] === '' ? null : Number(datos[campo]);
        }
        return resultado;
    }
});
