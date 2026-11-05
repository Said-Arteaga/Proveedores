import { iniciarCrud } from './crud.js';

iniciarCrud({
    endpoint: '/api/piezas',
    singular: 'pieza',
    claves: ['idPieza'],
    campos: ['nombre', 'color', 'material', 'dimensiones', 'categorias', 'descripcion'],
    columnas: pieza => [pieza.idPieza, pieza.nombre, pieza.color, pieza.material,
        pieza.dimensiones, pieza.categorias, pieza.descripcion],
    descripcion: pieza => `${pieza.nombre} (#${pieza.idPieza})`,
    avisoEliminar: 'También se eliminarán sus relaciones con proveedores. Las piezas con compras asociadas no pueden eliminarse.',
    preparar: datos => {
        const resultado = {};
        for (const [campo, valor] of Object.entries(datos)) {
            resultado[campo] = valor.trim() || null;
        }
        resultado.nombre = datos.nombre.trim();
        return resultado;
    }
});
