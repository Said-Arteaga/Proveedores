// Double de almacenamiento: no se requiere ni se modifica una base MySQL real.
const tables = new Map();
const keys = { Proveedor: ['idProveedor'], Pieza: ['idPieza'], Compra: ['idCompra'],
    ProveedorPieza: ['idProveedor', 'idPieza'], PiezaComprada: ['idCompra', 'idPieza'] };

function repository(entity) {
    const name = entity.name;
    if (!tables.has(name)) tables.set(name, []);
    const rows = tables.get(name);
    const matches = (row, where) => Object.entries(where).every(([key, value]) => row[key] === value);
    const checkReferences = (row) => {
        if (name === 'Compra' && !tables.get('Proveedor')?.some(item => item.idProveedor === row.idProveedor)) {
            throw { code: 'ER_NO_REFERENCED_ROW_2' };
        }
        if (name === 'ProveedorPieza' || name === 'PiezaComprada') {
            const foreign = name === 'ProveedorPieza' ? ['Proveedor', 'idProveedor'] : ['Compra', 'idCompra'];
            if (!tables.get(foreign[0])?.some(item => item[foreign[1]] === row[foreign[1]]) ||
                !tables.get('Pieza')?.some(item => item.idPieza === row.idPieza)) {
                throw { code: 'ER_NO_REFERENCED_ROW_2' };
            }
        }
    };
    return {
        create: data => ({ ...data }),
        find: async () => structuredClone(rows),
        findOne: async ({ where }) => structuredClone(rows.find(row => matches(row, where)) ?? null),
        findOneBy: async where => structuredClone(rows.find(row => matches(row, where)) ?? null),
        insert: async data => {
            if (rows.some(row => keys[name].every(key => row[key] === data[key]))) {
                throw { code: 'ER_DUP_ENTRY' };
            }
            checkReferences(data);
            rows.push(structuredClone(data));
            return {};
        },
        save: async data => {
            checkReferences(data);
            const index = rows.findIndex(row => keys[name].every(key => row[key] === data[key]));
            if (index >= 0) rows[index] = structuredClone(data);
            else {
                if (keys[name].length === 1) {
                    const [key] = keys[name];
                    data[key] = Math.max(0, ...rows.map(row => row[key])) + 1;
                }
                rows.push(structuredClone(data));
            }
            return structuredClone(data);
        },
        remove: async data => {
            if (name === 'Proveedor' && tables.get('Compra')?.some(row => row.idProveedor === data.idProveedor)) {
                throw { code: 'ER_ROW_IS_REFERENCED_2' };
            }
            if (name === 'Pieza' && tables.get('PiezaComprada')?.some(row => row.idPieza === data.idPieza)) {
                throw { code: 'ER_ROW_IS_REFERENCED_2' };
            }
            const index = rows.findIndex(row => keys[name].every(key => row[key] === data[key]));
            rows.splice(index, 1);
        }
    };
}


module.exports = { tables, repository };
