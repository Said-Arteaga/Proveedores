// Comportamiento compartido para las tres pantallas; la API es del mismo origen.
export async function pedirJSON(url, opciones = {}) {
    let respuesta;
    try {
        respuesta = await fetch(url, {
            ...opciones,
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(15000)
        });
    } catch (error) {
        throw new Error(error.name === 'TimeoutError'
            ? 'El servidor tardó demasiado en responder. Intenta de nuevo.'
            : 'No se pudo conectar con el servidor. Comprueba que esté iniciado e intenta de nuevo.');
    }
    if (!(respuesta.headers.get('content-type') || '').includes('application/json')) {
        throw new Error('La API no respondió con JSON. Abre las interfaces desde el servidor en /frontend/.');
    }
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo completar la operación.');
    return datos;
}

export const dinero = valor => new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
}).format(Number(valor));
export const fecha = valor => valor ? String(valor).slice(0, 10).split('-').reverse().join('/') : '—';
export const nombreCatalogo = (catalogos, campo, id, etiqueta) => {
    const item = (catalogos[campo] || []).find(item => String(item[campo]) === String(id));
    return item ? `${etiqueta(item)} (#${id})` : `#${id}`;
};
const normalizar = valor => String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function iniciarCrud(config) {
    const form = document.querySelector('.crud-form');
    const campo = nombre => form.elements.namedItem(nombre);
    const mensaje = document.querySelector('#mensaje-formulario');
    const catalogoMensaje = document.querySelector('#catalogo-mensaje');
    const estadoLista = document.querySelector('#estado-lista');
    const tabla = document.querySelector('#lista-registros');
    const buscar = document.querySelector('#buscar');
    const contador = document.querySelector('#contador');
    const guardar = document.querySelector('#guardar');
    const guardarTexto = document.querySelector('#guardar-texto');
    const cancelar = document.querySelector('#cancelar');
    const recargar = document.querySelector('#recargar');
    const titulo = document.querySelector('#titulo-formulario');
    let registros = [], catalogos = {}, editando = null;
    let ocupado = false, cargando = false, catalogosListos = false, falloListado = false;

    function aviso(elemento, texto = '', tipo = '') {
        elemento.textContent = texto;
        elemento.className = `aviso ${tipo}`;
    }
    function ruta(registro) {
        return `${config.endpoint}/${config.claves.map(clave => encodeURIComponent(registro[clave])).join('/')}`;
    }
    function controles() {
        form.querySelector('fieldset').disabled = ocupado || cargando;
        for (const clave of config.claves) {
            if (campo(clave)) campo(clave).disabled = editando !== null;
        }
        guardar.disabled = ocupado || cargando || !catalogosListos;
        guardarTexto.textContent = ocupado ? 'Guardando…' : editando ? 'Guardar cambios' : 'Agregar';
        cancelar.disabled = ocupado || cargando;
        recargar.disabled = ocupado || cargando;
        cancelar.hidden = !editando;
        titulo.textContent = `${editando ? 'Editar' : 'Agregar'} ${config.singular}`;
        form.setAttribute('aria-busy', String(ocupado || cargando));
        for (const boton of tabla.querySelectorAll('button')) boton.disabled = ocupado || cargando;
    }
    function limpiar() {
        editando = null;
        form.reset();
        for (const input of form.querySelectorAll('input')) input.setCustomValidity('');
        controles();
    }
    function renderizar() {
        tabla.replaceChildren();
        const consulta = normalizar(buscar.value.trim());
        let visibles = 0;
        registros.forEach((registro, indice) => {
            const columnas = config.columnas(registro, catalogos);
            const texto = [...columnas, ...config.claves.map(clave => registro[clave]),
                ...(config.busquedaExtra?.(registro) || [])].join(' ');
            if (!normalizar(texto).includes(consulta)) return;
            visibles++;
            const fila = document.createElement('tr');
            for (const valor of columnas) {
                const celda = document.createElement('td');
                celda.textContent = valor === null || valor === undefined || valor === '' ? '—' : String(valor);
                fila.append(celda);
            }
            const acciones = document.createElement('td');
            const grupo = document.createElement('div');
            grupo.className = 'acciones-fila';
            for (const [accion, texto] of [['editar', 'Editar'], ['eliminar', 'Eliminar']]) {
                const boton = document.createElement('button');
                boton.type = 'button';
                boton.textContent = texto;
                boton.className = accion === 'eliminar' ? 'eliminar' : 'secundario';
                boton.dataset.accion = accion;
                boton.dataset.indice = String(indice);
                boton.setAttribute('aria-label', `${texto} ${config.descripcion(registro, catalogos)}`);
                boton.disabled = ocupado || cargando;
                grupo.append(boton);
            }
            acciones.append(grupo);
            fila.append(acciones);
            tabla.append(fila);
        });
        contador.textContent = `${visibles} de ${registros.length} registros`;
        if (!visibles) {
            const fila = document.createElement('tr');
            const celda = document.createElement('td');
            celda.colSpan = tabla.closest('table').querySelectorAll('thead th').length;
            celda.textContent = cargando ? 'Cargando registros…' : falloListado ? 'No fue posible cargar los registros.' :
                consulta ? 'No hay coincidencias para esta búsqueda.' : 'Todavía no hay registros.';
            fila.append(celda);
            tabla.append(fila);
        }
    }
    function llenarCatalogo(definicion, opciones) {
        const select = campo(definicion.campo);
        const anterior = select.value;
        select.replaceChildren(new Option(`Selecciona ${definicion.nombre}`, ''));
        for (const item of opciones) {
            select.add(new Option(`${definicion.etiqueta(item)} (#${item[definicion.campo]})`, String(item[definicion.campo])));
        }
        if (editando && anterior && !opciones.some(item => String(item[definicion.campo]) === anterior)) {
            select.add(new Option(`#${anterior} (ya no disponible)`, anterior));
        }
        select.value = anterior;
    }
    async function cargar() {
        cargando = true;
        controles();
        aviso(estadoLista, 'Cargando registros…');
        const definiciones = config.catalogos || [];
        const resultados = await Promise.allSettled([
            pedirJSON(config.endpoint), ...definiciones.map(definicion => pedirJSON(definicion.endpoint))
        ]);
        const [lista, ...opciones] = resultados;
        falloListado = lista.status === 'rejected' || !Array.isArray(lista.value);
        if (!falloListado) {
            registros = lista.value;
            aviso(estadoLista);
        } else {
            registros = [];
            aviso(estadoLista, lista.reason?.message || 'No se pudieron cargar los registros.', 'error');
        }
        const errores = [];
        opciones.forEach((resultado, indice) => {
            const definicion = definiciones[indice];
            if (resultado.status === 'fulfilled' && Array.isArray(resultado.value)) {
                catalogos[definicion.campo] = resultado.value;
                llenarCatalogo(definicion, resultado.value);
                if (!resultado.value.length) errores.push(`No hay ${definicion.plural}. Regístralos antes de agregar ${config.singular}.`);
            } else {
                catalogos[definicion.campo] = [];
                llenarCatalogo(definicion, []);
                errores.push(`No se pudo cargar ${definicion.plural}: ${resultado.reason?.message || 'respuesta inválida'}`);
            }
        });
        catalogosListos = errores.length === 0;
        aviso(catalogoMensaje, errores.join(' '), errores.length ? 'error' : '');
        cargando = false;
        renderizar();
        controles();
    }
    function editar(registro) {
        editando = { ...registro };
        form.reset();
        for (const nombre of config.campos) {
            const input = campo(nombre);
            const valor = registro[nombre] ?? '';
            if (input.tagName === 'SELECT' && valor !== '' && !Array.from(input.options).some(option => option.value === String(valor))) {
                input.add(new Option(`#${valor}`, String(valor)));
            }
            input.value = String(valor);
            input.setCustomValidity('');
        }
        aviso(mensaje);
        controles();
        const primero = form.querySelector('input:not(:disabled), select:not(:disabled)');
        primero?.focus();
        titulo.scrollIntoView({ block: 'nearest' });
    }
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (ocupado || cargando || !catalogosListos) return;
        for (const input of form.querySelectorAll('input[required][type="text"]')) {
            input.setCustomValidity(input.value.trim() ? '' : 'Este campo es obligatorio.');
        }
        if (!form.reportValidity()) return;
        const datos = Object.fromEntries(config.campos.map(nombre => [nombre, campo(nombre).value]));
        const payload = config.preparar(datos);
        const actualizando = editando !== null;
        if (actualizando) for (const clave of config.claves) delete payload[clave];
        ocupado = true;
        controles();
        aviso(mensaje, 'Guardando registro…');
        try {
            await pedirJSON(actualizando ? ruta(editando) : config.endpoint, {
                method: actualizando ? 'PUT' : 'POST', body: JSON.stringify(payload)
            });
            limpiar();
            aviso(mensaje, actualizando ? 'Registro actualizado correctamente.' : 'Registro agregado correctamente.', 'exito');
            await cargar();
        } catch (error) {
            aviso(mensaje, error.message || 'No se pudo conectar con el servidor.', 'error');
        } finally {
            ocupado = false;
            controles();
        }
    });
    form.addEventListener('input', event => event.target.setCustomValidity?.(''));
    tabla.addEventListener('click', async event => {
        const boton = event.target.closest('button[data-accion]');
        if (!boton || ocupado || cargando) return;
        const registro = registros[Number(boton.dataset.indice)];
        if (!registro) return;
        if (boton.dataset.accion === 'editar') { editar(registro); return; }
        if (!window.confirm(`¿Eliminar ${config.descripcion(registro, catalogos)}?${config.avisoEliminar ? '\n' + config.avisoEliminar : ''}`)) return;
        ocupado = true;
        controles();
        aviso(mensaje, 'Eliminando registro…');
        try {
            await pedirJSON(ruta(registro), { method: 'DELETE' });
            if (editando && ruta(editando) === ruta(registro)) limpiar();
            aviso(mensaje, 'Registro eliminado correctamente.', 'exito');
            await cargar();
        } catch (error) {
            aviso(mensaje, error.message || 'No se pudo eliminar el registro.', 'error');
        } finally {
            ocupado = false;
            controles();
        }
    });
    cancelar.addEventListener('click', () => { limpiar(); aviso(mensaje); campo(config.campos[0]).focus(); });
    buscar.addEventListener('input', renderizar);
    recargar.addEventListener('click', () => { if (!ocupado && !cargando) cargar(); });
    cargar();
}
