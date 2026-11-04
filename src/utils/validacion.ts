import { Response } from "express";
import { Proveedor } from "../entities/Proveedor";

class ValidacionError extends Error {}

export function enteroPositivo(valor: unknown, campo: string): number {
    if ((typeof valor !== "number" && typeof valor !== "string") ||
        (typeof valor === "string" && !/^\d+$/.test(valor))) {
        throw new ValidacionError(`${campo} debe ser un entero mayor que cero`);
    }
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero <= 0 || numero > 2147483647) {
        throw new ValidacionError(`${campo} debe ser un entero entre 1 y 2147483647`);
    }
    return numero;
}

export function importe(valor: unknown, campo: string): string {
    if ((typeof valor !== "number" && typeof valor !== "string") ||
        !/^\d+(\.\d{1,2})?$/.test(String(valor)) ||
        !Number.isFinite(Number(valor)) || Number(valor) > 9999999999.99) {
        throw new ValidacionError(`${campo} debe estar entre 0 y 9999999999.99 y tener hasta dos decimales`);
    }
    return Number(valor).toFixed(2);
}

export function fechaCalendario(valor: unknown): string {
    if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor) ||
        valor < "1000-01-01" || Number.isNaN(Date.parse(`${valor}T00:00:00Z`)) ||
        new Date(`${valor}T00:00:00Z`).toISOString().slice(0, 10) !== valor) {
        throw new ValidacionError("La fecha debe ser válida y tener formato AAAA-MM-DD");
    }
    return valor;
}

export function datosProveedor(datos: Record<string, unknown>, nuevo = false): Partial<Proveedor> {
    const resultado: Partial<Proveedor> = {};
    const limites = { nombre: 120, contacto: 120, direccion: 255, telefono: 20,
        correo: 150, ciudad: 100, estado: 100 } as const;
    if (nuevo && datos.nombre === undefined) throw new ValidacionError("El nombre es obligatorio");
    for (const campo of Object.keys(limites) as (keyof typeof limites)[]) {
        const valor = datos[campo];
        if (valor === undefined) continue;
        if (campo !== "nombre" && (valor === null || valor === "")) {
            resultado[campo] = null;
            continue;
        }
        if (typeof valor !== "string" || valor.trim().length > limites[campo] ||
            (campo === "nombre" && !valor.trim())) {
            throw new ValidacionError(`${campo}: introduce texto de hasta ${limites[campo]} caracteres${campo === "nombre" ? " (obligatorio)" : ""}`);
        }
        if (campo === "correo" && valor.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())) {
            throw new ValidacionError("Introduce un correo válido");
        }
        Object.assign(resultado, { [campo]: valor.trim() || null });
    }
    for (const [campo, limite] of [["latitud", 90], ["longitud", 180]] as const) {
        const valor = datos[campo];
        if (valor === undefined) continue;
        if (valor === null || valor === "") { resultado[campo] = null; continue; }
        if ((typeof valor !== "number" && typeof valor !== "string") ||
            (typeof valor === "string" && !valor.trim()) ||
            !Number.isFinite(Number(valor)) || Math.abs(Number(valor)) > limite) {
            throw new ValidacionError(`${campo} debe estar entre -${limite} y ${limite}`);
        }
        resultado[campo] = Number(valor);
    }
    return resultado;
}

export function responderError(error: unknown, res: Response, mensaje: string): void {
    if (error instanceof ValidacionError) {
        res.status(400).json({ mensaje: error.message });
        return;
    }
    const fallo = error as { code?: string; driverError?: { code?: string } } | null;
    const codigo = fallo?.driverError?.code ?? fallo?.code;
    if (codigo === "ER_DUP_ENTRY") {
        res.status(409).json({ mensaje: "Este registro ya existe. Usa la opción Editar para modificarlo." });
    } else if (codigo === "ER_NO_REFERENCED_ROW_2") {
        res.status(400).json({ mensaje: "El proveedor, la compra o la pieza seleccionada ya no existe. Actualiza los catálogos." });
    } else if (codigo === "ER_ROW_IS_REFERENCED_2") {
        res.status(409).json({ mensaje: "No se puede eliminar el registro porque tiene compras asociadas." });
    } else {
        console.error(error);
        res.status(500).json({ mensaje });
    }
}
