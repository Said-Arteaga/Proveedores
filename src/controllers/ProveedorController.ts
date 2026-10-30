import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Proveedor } from "../entities/Proveedor";
import { Compra } from "../entities/Compra";

class ErrorValidacion extends Error {}

const proveedorRepository = () =>
    AppDataSource.getRepository(Proveedor);

// Comprueba que el cuerpo recibido sea un objeto.
function cuerpoValido(body: any): boolean {
    return body !== null &&
        typeof body === "object" &&
        !Array.isArray(body);
}

// Valida campos de texto opcionales.
function validarTexto(
    valor: any,
    campo: string,
    longitudMaxima: number
): string | null | undefined {
    if (valor === undefined) return undefined;
    if (valor === null || valor === "") return null;

    if (typeof valor !== "string") {
        throw new ErrorValidacion(`${campo} debe ser un texto.`);
    }

    const texto = valor.trim();

    if (texto === "") return null;

    if (texto.length > longitudMaxima) {
        throw new ErrorValidacion(
            `${campo} no puede superar los ${longitudMaxima} caracteres.`
        );
    }

    return texto;
}

// Valida el correo electrónico.
function validarCorreo(valor: any): string | null | undefined {
    const correo = validarTexto(valor, "El correo", 150);

    if (correo === undefined || correo === null) {
        return correo;
    }

    const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formatoCorreo.test(correo)) {
        throw new ErrorValidacion("El correo electrónico no tiene un formato válido.");
    }

    return correo;
}

// Valida latitud y longitud.
function validarCoordenada(
    valor: any,
    campo: string,
    minimo: number,
    maximo: number
): number | null | undefined {
    if (valor === undefined) return undefined;
    if (valor === null || valor === "") return null;

    if (typeof valor !== "number" || !Number.isFinite(valor)) {
        throw new ErrorValidacion(`${campo} debe ser un número válido.`);
    }

    if (valor < minimo || valor > maximo) {
        throw new ErrorValidacion(
            `${campo} debe estar entre ${minimo} y ${maximo}.`
        );
    }

    const textoValor = valor.toString().toLowerCase();
    const [mantisa, exponenteTexto] = textoValor.split("e");

    const decimalesMantisa = (mantisa.split(".")[1] || "").length;
    const exponente = Number(exponenteTexto || 0);

    const cantidadDecimales = Math.max(0, decimalesMantisa - exponente);

    if (cantidadDecimales > 7) {
        throw new ErrorValidacion(
            `${campo} no puede tener más de 7 decimales.`
        );
    }

    return valor;
}

// Comprueba que el cuerpo tenga una estructura válida.
function validarCuerpo(body: any): string | null {
    if (!cuerpoValido(body)) {
        return "El cuerpo de la solicitud debe ser un objeto válido.";
    }

    return null;
}

export async function obtenerProveedores(
    _req: Request,
    res: Response
) {
    try {
        const proveedores = await proveedorRepository().find();
        res.json(proveedores);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al consultar proveedores."
        });
    }
}

export async function obtenerProveedorPorId(
    req: Request,
    res: Response
) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({
                mensaje: "El ID del proveedor no es válido."
            });
            return;
        }

        const proveedor = await proveedorRepository().findOneBy({
            idProveedor: id
        });

        if (!proveedor) {
            res.status(404).json({
                mensaje: "Proveedor no encontrado."
            });
            return;
        }

        res.json(proveedor);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al consultar el proveedor."
        });
    }
}

export async function crearProveedor(
    req: Request,
    res: Response
) {
    try {
        const errorCuerpo = validarCuerpo(req.body);

        if (errorCuerpo) {
            res.status(400).json({ mensaje: errorCuerpo });
            return;
        }

        const {
            nombre,
            contacto,
            direccion,
            telefono,
            correo,
            latitud,
            longitud,
            ciudad,
            estado
        } = req.body;

        // Nombre obligatorio.
        if (typeof nombre !== "string" || !nombre.trim()) {
            res.status(400).json({
                mensaje: "El nombre del proveedor es obligatorio."
            });
            return;
        }

        if (nombre.trim().length > 120) {
            res.status(400).json({
                mensaje: "El nombre no puede superar los 120 caracteres."
            });
            return;
        }

        // Validación de los demás campos.
        const nuevoProveedor = proveedorRepository().create({
            nombre: nombre.trim(),
            contacto: validarTexto(contacto, "El contacto", 120) ?? null,
            direccion: validarTexto(direccion, "La dirección", 255) ?? null,
            telefono: validarTexto(telefono, "El teléfono", 20) ?? null,
            correo: validarCorreo(correo) ?? null,
            latitud: validarCoordenada(latitud, "La latitud", -90, 90) ?? null,
            longitud: validarCoordenada(longitud, "La longitud", -180, 180) ?? null,
            ciudad: validarTexto(ciudad, "La ciudad", 100) ?? null,
            estado: validarTexto(estado, "El estado", 100) ?? null
        });

        const proveedorGuardado =
            await proveedorRepository().save(nuevoProveedor);

        res.status(201).json(proveedorGuardado);

    } catch (error) {
        if (error instanceof ErrorValidacion) {
            res.status(400).json({ mensaje: error.message });
            return;
        }

        console.error(error);
        res.status(500).json({
            mensaje: "Error interno al crear el proveedor."
        });
    }
}

export async function actualizarProveedor(
    req: Request,
    res: Response
) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({
                mensaje: "El ID del proveedor no es válido."
            });
            return;
        }

        const errorCuerpo = validarCuerpo(req.body);

        if (errorCuerpo) {
            res.status(400).json({ mensaje: errorCuerpo });
            return;
        }

        const repositorio = proveedorRepository();

        const proveedor = await repositorio.findOneBy({
            idProveedor: id
        });

        if (!proveedor) {
            res.status(404).json({
                mensaje: "Proveedor no encontrado."
            });
            return;
        }

        const body = req.body;

        // Solo se modifican los campos enviados.
        if (body.nombre !== undefined) {
            if (typeof body.nombre !== "string" || !body.nombre.trim()) {
                res.status(400).json({
                    mensaje: "El nombre del proveedor es obligatorio."
                });
                return;
            }

            if (body.nombre.trim().length > 120) {
                res.status(400).json({
                    mensaje: "El nombre no puede superar los 120 caracteres."
                });
                return;
            }

            proveedor.nombre = body.nombre.trim();
        }

        if (body.contacto !== undefined) {
            proveedor.contacto =
                validarTexto(body.contacto, "El contacto", 120) ?? null;
        }

        if (body.direccion !== undefined) {
            proveedor.direccion =
                validarTexto(body.direccion, "La dirección", 255) ?? null;
        }

        if (body.telefono !== undefined) {
            proveedor.telefono =
                validarTexto(body.telefono, "El teléfono", 20) ?? null;
        }

        if (body.correo !== undefined) {
            proveedor.correo = validarCorreo(body.correo) ?? null;
        }

        if (body.latitud !== undefined) {
            proveedor.latitud =
                validarCoordenada(body.latitud, "La latitud", -90, 90) ?? null;
        }

        if (body.longitud !== undefined) {
            proveedor.longitud =
                validarCoordenada(body.longitud, "La longitud", -180, 180) ?? null;
        }

        if (body.ciudad !== undefined) {
            proveedor.ciudad =
                validarTexto(body.ciudad, "La ciudad", 100) ?? null;
        }

        if (body.estado !== undefined) {
            proveedor.estado =
                validarTexto(body.estado, "El estado", 100) ?? null;
        }

        const proveedorActualizado = await repositorio.save(proveedor);

        res.json(proveedorActualizado);

    } catch (error) {
        if (error instanceof ErrorValidacion) {
            res.status(400).json({ mensaje: error.message });
            return;
        }

        console.error(error);
        res.status(500).json({
            mensaje: "Error interno al actualizar el proveedor."
        });
    }
}

export async function eliminarProveedor(
    req: Request,
    res: Response
) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({
                mensaje: "El ID del proveedor no es válido."
            });
            return;
        }

        const repositorio = proveedorRepository();

        const proveedor = await repositorio.findOneBy({
            idProveedor: id
        });

        if (!proveedor) {
            res.status(404).json({
                mensaje: "Proveedor no encontrado."
            });
            return;
        }

        // Comprobar si el proveedor tiene compras asociadas.
        const cantidadCompras = await AppDataSource
        .getRepository(Compra)
        .count({
            where: { idProveedor: id }
        });

        if (cantidadCompras > 0) {
            res.status(409).json({
                mensaje: "No se puede eliminar el proveedor porque tiene compras asociadas."
            });
            return;
        }

        await repositorio.remove(proveedor);

        res.json({
            mensaje: "Proveedor eliminado correctamente."
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error interno al eliminar el proveedor."
        });
    }
}