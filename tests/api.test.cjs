const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const app = require('../dist/app').default;
const { AppDataSource } = require('../dist/config/data-source');

const { tables, repository } = require('./helpers/repositorio.cjs');
const originalRepository = AppDataSource.getRepository;
let server, base;

before(async () => {
    tables.set('Proveedor', [{ idProveedor: 1, nombre: 'Proveedor existente' }]);
    tables.set('Pieza', [{ idPieza: 1, nombre: 'Tornillo' }]);
    tables.set('Compra', [{ idCompra: 1, idProveedor: 1, numFactura: 'FAC-001' }]);
    AppDataSource.getRepository = repository;
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
    AppDataSource.getRepository = originalRepository;
    await new Promise(resolve => server.close(resolve));
});

async function request(path, method = 'GET', body) {
    const response = await fetch(base + path, {
        method, headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    return { status: response.status, body: await response.json() };
}

test('sirve las tres pantallas y sus recursos sin reemplazar la raíz API', async () => {
    assert.equal((await request('/')).body.mensaje, 'Backend de Proveedores funcionando');
    for (const path of ['/frontend/', '/frontend/proveedores.html', '/frontend/proveedor-pieza.html',
        '/frontend/pieza-comprada.html', '/frontend/proveedores.css', '/frontend/crud.js',
        '/assets/imagenes/proveedor.png']) {
        const response = await fetch(base + path);
        assert.equal(response.status, 200, path);
    }
});

test('proveedores: alta, listado, consulta, actualización y eliminación', async () => {
    const created = await request('/api/proveedores', 'POST', { nombre: '  Nuevo proveedor  ', ciudad: 'Pachuca' });
    assert.equal(created.status, 201);
    assert.equal(created.body.nombre, 'Nuevo proveedor');
    const path = `/api/proveedores/${created.body.idProveedor}`;
    assert.equal((await request(path)).body.ciudad, 'Pachuca');
    assert.ok((await request('/api/proveedores')).body.some(row => row.idProveedor === created.body.idProveedor));
    assert.equal((await request(path, 'PUT', { contacto: 'Ana' })).body.contacto, 'Ana');
    assert.equal((await request(path, 'DELETE')).status, 200);
    assert.equal((await request(path)).status, 404);
});

test('proveedores rechaza campos inválidos y comunica compras asociadas', async () => {
    for (const body of [{ nombre: ' ' }, { nombre: 'x'.repeat(121) }, { nombre: 'Test', correo: 'invalido' },
        { nombre: 'Test', latitud: 91 }, { nombre: 'Test', longitud: -181 }, { nombre: 'Test', contacto: {} }]) {
        assert.equal((await request('/api/proveedores', 'POST', body)).status, 400, JSON.stringify(body));
    }
    assert.equal((await request('/api/proveedores/1', 'DELETE')).status, 409);
});

for (const [endpoint, valid, change] of [
    ['/api/proveedor-pieza', { idProveedor: 1, idPieza: 1, precio: '15.50', fecha: '2026-11-03' }, { precio: '18.00' }],
    ['/api/pieza-comprada', { idCompra: 1, idPieza: 1, cantidad: 2, subTotal: '31.00' }, { cantidad: 3, subTotal: '46.50' }]
]) {
    test(`${endpoint}: CRUD con clave compuesta y rechazo de duplicados`, async () => {
        const path = `${endpoint}/1/1`;
        assert.equal((await request(endpoint, 'POST', valid)).status, 201);
        const duplicate = await request(endpoint, 'POST', { ...valid, ...change });
        assert.equal(duplicate.status, 409);
        const row = (await request(path)).body;
        for (const key of Object.keys(change)) assert.equal(row[key], valid[key]);
        assert.equal((await request(endpoint)).body.length, 1);
        assert.equal((await request(path, 'PUT', change)).status, 200);
        assert.equal((await request(path)).body[Object.keys(change)[0]], Object.values(change)[0]);
        assert.equal((await request(path, 'DELETE')).status, 200);
        assert.equal((await request(path)).status, 404);
    });
    test(`${endpoint}: rechaza claves inválidas y referencias inexistentes`, async () => {
        assert.equal((await request(`${endpoint}/0/1`)).status, 400);
        assert.equal((await request(endpoint, 'POST', { ...valid, idPieza: 999 })).status, 400);
    });
}

test('valida importes, fechas reales y cantidades antes de persistir', async () => {
    for (const precio of ['', null, true, -1, 'abc', '10000000000', '1.999']) {
        assert.equal((await request('/api/proveedor-pieza', 'POST', {
            idProveedor: 1, idPieza: 1, precio, fecha: '2026-11-03'
        })).status, 400, `precio ${JSON.stringify(precio)}`);
    }
    for (const fecha of ['2026-02-30', '2026-13-01', '2026-11-03T10:00:00Z']) {
        assert.equal((await request('/api/proveedor-pieza', 'POST', {
            idProveedor: 1, idPieza: 1, precio: '10.00', fecha
        })).status, 400);
    }
    for (const cantidad of [0, 1.5, null, true, 2147483648]) {
        assert.equal((await request('/api/pieza-comprada', 'POST', {
            idCompra: 1, idPieza: 1, cantidad, subTotal: '10.00'
        })).status, 400);
    }
});

test('los nombres de tablas coinciden con el dump MySQL en sistemas sensibles a mayúsculas', () => {
    const { getMetadataArgsStorage } = require('typeorm');
    const expected = { Proveedor: 'proveedor', Pieza: 'pieza', Compra: 'compras',
        ProveedorPieza: 'proveedorpieza', PiezaComprada: 'piezacomprada' };
    for (const table of getMetadataArgsStorage().tables) {
        assert.equal(table.name, expected[table.target.name]);
    }
});
