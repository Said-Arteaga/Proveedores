// Prueba optativa contra el MySQL configurado en .env. Crea sus propios registros
// y los elimina al terminar; no importa el dump ni modifica registros existentes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const app = require('../dist/app').default;
const { AppDataSource } = require('../dist/config/data-source');
const { Proveedor } = require('../dist/entities/Proveedor');
const { Pieza } = require('../dist/entities/Pieza');
const { Compra } = require('../dist/entities/Compra');
const { ProveedorPieza } = require('../dist/entities/ProveedorPieza');
const { PiezaComprada } = require('../dist/entities/PiezaComprada');

test('CRUD HTTP de las tres entidades con persistencia en MySQL', async t => {
    await AppDataSource.initialize();
    let server, idProveedor, idPieza, idCompra;
    t.after(async () => {
        try {
            if (idCompra && idPieza) await AppDataSource.getRepository(PiezaComprada).delete({ idCompra, idPieza });
            if (idProveedor && idPieza) await AppDataSource.getRepository(ProveedorPieza).delete({ idProveedor, idPieza });
            if (idCompra) await AppDataSource.getRepository(Compra).delete(idCompra);
            if (idPieza) await AppDataSource.getRepository(Pieza).delete(idPieza);
            if (idProveedor) await AppDataSource.getRepository(Proveedor).delete(idProveedor);
        } finally {
            if (server) await new Promise(resolve => server.close(resolve));
            await AppDataSource.destroy();
        }
    });
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    const tag = `QA-${randomUUID()}`;
    async function request(path, method = 'GET', body) {
        const response = await fetch(base + path, {
            method, headers: { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body)
        });
        return { status: response.status, body: await response.json() };
    }
    const created = await request('/api/proveedores', 'POST', { nombre: tag, ciudad: 'Pachuca', latitud: 20.1 });
    assert.equal(created.status, 201);
    idProveedor = created.body.idProveedor;
    const supplier = `/api/proveedores/${idProveedor}`;
    assert.equal((await request(supplier)).body.nombre, tag);
    assert.equal((await request(supplier, 'PUT', { contacto: 'Contacto QA' })).status, 200);
    assert.equal((await request(supplier)).body.contacto, 'Contacto QA');

    const piece = await AppDataSource.getRepository(Pieza).save({ nombre: tag });
    idPieza = piece.idPieza;
    const purchase = await AppDataSource.getRepository(Compra).save({ idProveedor, numFactura: tag, fecha: '2026-11-03', total: '31.00' });
    idCompra = purchase.idCompra;
    for (const [endpoint, ids, values, changes] of [
        ['/api/proveedor-pieza', { idProveedor, idPieza }, { precio: '15.50', fecha: '2026-11-03' }, { precio: '16.25' }],
        ['/api/pieza-comprada', { idCompra, idPieza }, { cantidad: 2, subTotal: '31.00' }, { cantidad: 3, subTotal: '46.50' }]
    ]) {
        assert.equal((await request(endpoint, 'POST', { ...ids, ...values })).status, 201);
        assert.equal((await request(endpoint, 'POST', { ...ids, ...values })).status, 409);
        const path = `${endpoint}/${Object.values(ids).join('/')}`;
        const read = await request(path);
        assert.equal(read.status, 200);
        assert.equal(read.body.pieza.nombre, tag);
        assert.equal((await request(endpoint)).body.some(row => Object.entries(ids).every(([key, value]) => row[key] === value)), true);
        assert.equal((await request(path, 'PUT', changes)).status, 200);
        const updated = (await request(path)).body;
        for (const [key, value] of Object.entries(changes)) assert.equal(updated[key], value);
        assert.equal((await request(path, 'DELETE')).status, 200);
        assert.equal((await request(path)).status, 404);
    }
    assert.equal((await request(supplier, 'DELETE')).status, 409);
    await AppDataSource.getRepository(Compra).delete(idCompra);
    idCompra = undefined;
    assert.equal((await request(supplier, 'DELETE')).status, 200);
    assert.equal((await request(supplier)).status, 404);
});
