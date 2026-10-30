import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { ProveedorPieza } from "../entities/ProveedorPieza";
import { Proveedor } from "../entities/Proveedor";
import { Pieza } from "../entities/Pieza";

const repositorio = () => AppDataSource.getRepository(ProveedorPieza);
const proveedorRepositorio = () => AppDataSource.getRepository(Proveedor);
const piezaRepositorio = () => AppDataSource.getRepository(Pieza);

const esIdValido = (id: unknown): id is number =>
    typeof id === "number" &&
    Number.isInteger(id) &&
    id > 0;

const esObjetoValido = (body: unknown): body is Record<string, unknown> =>
    typeof body === "object" &&
    body !== null &&
    !Array.isArray(body);

const validarPrecio = (valor: unknown): string | null => {
    if (
        (typeof valor !== "number" && typeof valor !== "string") ||
        String(valor).trim() === ""
    ) {
        return null;
    }

    const precioTexto = String(valor).trim();

    if (!/^\d+(\.\d{1,2})?$/.test(precioTexto)) {
        return null;
    }

    const [parteEntera] = precioTexto.split(".");
    const enteroNormalizado = parteEntera.replace(/^0+/, "") || "0";

    if (
        enteroNormalizado.length > 10 ||
        (
            enteroNormalizado.length === 10 &&
            enteroNormalizado > "9999999999"
        )
    ) {
        return null;
    }

    const precio = Number(precioTexto);

    if (!Number.isFinite(precio) || precio < 0 || precio > 9999999999.99) {
        return null;
    }

    return precio.toFixed(2);
};

const validarFecha = (fecha: unknown): fecha is string => {
    if (
        typeof fecha !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
    ) {
        return false;
    }

    const [anio, mes, dia] = fecha.split("-").map(Number);

    const fechaReal = new Date(Date.UTC(anio, mes - 1, dia));

    return (
        fechaReal.getUTCFullYear() === anio &&
        fechaReal.getUTCMonth() === mes - 1 &&
        fechaReal.getUTCDate() === dia
    );
};

const errorClaveDuplicada = (error: any): boolean =>
    error?.code === "ER_DUP_ENTRY" ||
    error?.errno === 1062;

const errorClaveForanea = (error: any): boolean =>
    error?.code === "ER_NO_REFERENCED_ROW_2" ||
    error?.errno === 1452;

export async function obtenerRelaciones(_req: Request, res: Response) {
    try {
        const relaciones = await repositorio().find({
            relations: {
                proveedor: true,
                pieza: true
            }
        });

        res.json(relaciones);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al consultar proveedores y piezas"
        });
    }
}

export async function obtenerRelacion(req: Request, res: Response) {
    try {
        const idProveedor = Number(req.params.idProveedor);
        const idPieza = Number(req.params.idPieza);

        if (!esIdValido(idProveedor) || !esIdValido(idPieza)) {
            res.status(400).json({
                mensaje: "Los identificadores deben ser enteros positivos"
            });
            return;
        }

        const relacion = await repositorio().findOne({
            where: { idProveedor, idPieza },
            relations: {
                proveedor: true,
                pieza: true
            }
        });

        if (!relacion) {
            res.status(404).json({
                mensaje: "Relación no encontrada"
            });
            return;
        }

        res.json(relacion);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al consultar la relación"
        });
    }
}

export async function crearRelacion(req: Request, res: Response) {
    try {
        if (!esObjetoValido(req.body)) {
            res.status(400).json({
                mensaje: "El cuerpo de la solicitud debe ser un objeto JSON"
            });
            return;
        }

        const { idProveedor, idPieza, precio, fecha } = req.body;

        if (!esIdValido(idProveedor) || !esIdValido(idPieza)) {
            res.status(400).json({
                mensaje: "Los identificadores deben ser enteros positivos"
            });
            return;
        }

        const precioValidado = validarPrecio(precio);

        if (precioValidado === null) {
            res.status(400).json({
                mensaje: "El precio debe ser un número entre 0 y 9999999999.99, con máximo dos decimales"
            });
            return;
        }

        if (!validarFecha(fecha)) {
            res.status(400).json({
                mensaje: "La fecha debe ser válida y tener formato AAAA-MM-DD"
            });
            return;
        }

        const proveedor = await proveedorRepositorio().findOneBy({
            idProveedor
        });

        if (!proveedor) {
            res.status(400).json({
                mensaje: "El proveedor indicado no existe"
            });
            return;
        }

        const pieza = await piezaRepositorio().findOneBy({
            idPieza
        });

        if (!pieza) {
            res.status(400).json({
                mensaje: "La pieza indicada no existe"
            });
            return;
        }

        const relacionExistente = await repositorio().findOneBy({
            idProveedor,
            idPieza
        });

        if (relacionExistente) {
            res.status(409).json({
                mensaje: "Esta relación entre proveedor y pieza ya existe"
            });
            return;
        }

        const relacion = repositorio().create({
            idProveedor,
            idPieza,
            precio: precioValidado,
            fecha
        });

        res.status(201).json(await repositorio().save(relacion));
    } catch (error) {
        console.error(error);

        if (errorClaveDuplicada(error)) {
            res.status(409).json({
                mensaje: "Esta relación entre proveedor y pieza ya existe"
            });
            return;
        }

        if (errorClaveForanea(error)) {
            res.status(400).json({
                mensaje: "El proveedor o la pieza indicada no existe"
            });
            return;
        }

        res.status(500).json({
            mensaje: "No se pudo crear la relación"
        });
    }
}

export async function actualizarRelacion(req: Request, res: Response) {
    try {
        const idProveedor = Number(req.params.idProveedor);
        const idPieza = Number(req.params.idPieza);

        if (!esIdValido(idProveedor) || !esIdValido(idPieza)) {
            res.status(400).json({
                mensaje: "Los identificadores deben ser enteros positivos"
            });
            return;
        }

        if (!esObjetoValido(req.body)) {
            res.status(400).json({
                mensaje: "El cuerpo de la solicitud debe ser un objeto JSON"
            });
            return;
        }

        const repo = repositorio();

        const relacion = await repo.findOneBy({
            idProveedor,
            idPieza
        });

        if (!relacion) {
            res.status(404).json({
                mensaje: "Relación no encontrada"
            });
            return;
        }

        if (req.body.precio !== undefined) {
            const precioValidado = validarPrecio(req.body.precio);

            if (precioValidado === null) {
                res.status(400).json({
                    mensaje: "El precio debe ser un número entre 0 y 9999999999.99, con máximo dos decimales"
                });
                return;
            }

            relacion.precio = precioValidado;
        }

        if (req.body.fecha !== undefined) {
            if (!validarFecha(req.body.fecha)) {
                res.status(400).json({
                    mensaje: "La fecha debe ser válida y tener formato AAAA-MM-DD"
                });
                return;
            }

            relacion.fecha = req.body.fecha;
        }

        res.json(await repo.save(relacion));
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al actualizar la relación"
        });
    }
}

export async function eliminarRelacion(req: Request, res: Response) {
    try {
        const idProveedor = Number(req.params.idProveedor);
        const idPieza = Number(req.params.idPieza);

        if (!esIdValido(idProveedor) || !esIdValido(idPieza)) {
            res.status(400).json({
                mensaje: "Los identificadores deben ser enteros positivos"
            });
            return;
        }

        const repo = repositorio();

        const relacion = await repo.findOneBy({
            idProveedor,
            idPieza
        });

        if (!relacion) {
            res.status(404).json({
                mensaje: "Relación no encontrada"
            });
            return;
        }

        await repo.remove(relacion);

        res.json({
            mensaje: "Relación eliminada correctamente"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al eliminar la relación"
        });
    }
}
