import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { PiezaComprada } from "../entities/PiezaComprada";
import { Compra } from "../entities/Compra";
import { Pieza } from "../entities/Pieza";

const repositorio = () => AppDataSource.getRepository(PiezaComprada);

function esIdValido(id: unknown): id is number {
    return typeof id === "number" &&
        Number.isInteger(id) &&
        id > 0;
}

function esObjetoValido(body: unknown): body is Record<string, unknown> {
    return body !== null &&
        typeof body === "object" &&
        !Array.isArray(body);
}

function validarCantidad(valor: unknown): number | null {
    if (
        (typeof valor !== "number" && typeof valor !== "string") ||
        (typeof valor === "string" && !/^\d+$/.test(valor))
    ) {
        return null;
    }

    const cantidad = Number(valor);

    if (
        !Number.isSafeInteger(cantidad) ||
        cantidad <= 0 ||
        cantidad > 2147483647
    ) {
        return null;
    }

    return cantidad;
}

function validarSubTotal(valor: unknown): string | null {
    if (
        (typeof valor !== "number" && typeof valor !== "string") ||
        !/^\d+(\.\d{1,2})?$/.test(String(valor))
    ) {
        return null;
    }

    const subTotal = Number(valor);

    if (
        !Number.isFinite(subTotal) ||
        subTotal < 0 ||
        subTotal > 9999999999.99
    ) {
        return null;
    }

    return subTotal.toFixed(2);
}

function esDuplicado(error: unknown): boolean {
    const e = error as { code?: string; errno?: number };

    return e.code === "ER_DUP_ENTRY" || e.errno === 1062;
}

function esErrorLlaveForanea(error: unknown): boolean {
    const e = error as { code?: string; errno?: number };

    return e.code === "ER_NO_REFERENCED_ROW_2" || e.errno === 1452;
}

export async function obtenerPiezasCompradas(
    _req: Request,
    res: Response
) {
    try {
        const registros = await repositorio().find({
            relations: { compra: true, pieza: true }
        });

        res.json(registros);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al consultar piezas compradas"
        });
    }
}

export async function obtenerPiezaComprada(
    req: Request,
    res: Response
) {
    try {
        const idCompra = Number(req.params.idCompra);
        const idPieza = Number(req.params.idPieza);

        if (!esIdValido(idCompra) || !esIdValido(idPieza)) {
            res.status(400).json({
                mensaje: "Los identificadores deben ser enteros positivos"
            });
            return;
        }

        const registro = await repositorio().findOne({
            where: { idCompra, idPieza },
            relations: { compra: true, pieza: true }
        });

        if (!registro) {
            res.status(404).json({
                mensaje: "Pieza comprada no encontrada"
            });
            return;
        }

        res.json(registro);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al consultar pieza comprada"
        });
    }
}

export async function crearPiezaComprada(
    req: Request,
    res: Response
) {
    try {
        if (!esObjetoValido(req.body)) {
            res.status(400).json({
                mensaje: "El cuerpo de la solicitud no es válido"
            });
            return;
        }

        const { idCompra, idPieza } = req.body;
        const cantidad = validarCantidad(req.body.cantidad);
        const subTotal = validarSubTotal(req.body.subTotal);

        if (!esIdValido(idCompra) || !esIdValido(idPieza)) {
            res.status(400).json({
                mensaje: "Los identificadores deben ser enteros positivos"
            });
            return;
        }

        if (cantidad === null) {
            res.status(400).json({
                mensaje: "La cantidad debe ser un entero positivo"
            });
            return;
        }

        if (subTotal === null) {
            res.status(400).json({
                mensaje: "El subtotal debe ser válido, no negativo y tener máximo dos decimales"
            });
            return;
        }

        const compraExiste = await AppDataSource
            .getRepository(Compra)
            .existsBy({ idCompra });

        if (!compraExiste) {
            res.status(400).json({
                mensaje: "La compra indicada no existe"
            });
            return;
        }

        const piezaExiste = await AppDataSource
            .getRepository(Pieza)
            .existsBy({ idPieza });

        if (!piezaExiste) {
            res.status(400).json({
                mensaje: "La pieza indicada no existe"
            });
            return;
        }

        const repo = repositorio();

        const existente = await repo.findOneBy({
            idCompra,
            idPieza
        });

        if (existente) {
            res.status(409).json({
                mensaje: "Esta pieza ya está registrada en la compra"
            });
            return;
        }

        const registro = repo.create({
            idCompra,
            idPieza,
            cantidad,
            subTotal
        });

        res.status(201).json(await repo.save(registro));
    } catch (error) {
        console.error(error);

        if (esDuplicado(error)) {
            res.status(409).json({
                mensaje: "Esta pieza ya está registrada en la compra"
            });
            return;
        }

        if (esErrorLlaveForanea(error)) {
            res.status(400).json({
                mensaje: "La compra o la pieza indicada no existe"
            });
            return;
        }

        res.status(500).json({
            mensaje: "Error al registrar la pieza comprada"
        });
    }
}

export async function actualizarPiezaComprada(
    req: Request,
    res: Response
) {
    try {
        const idCompra = Number(req.params.idCompra);
        const idPieza = Number(req.params.idPieza);

        if (!esIdValido(idCompra) || !esIdValido(idPieza)) {
            res.status(400).json({
                mensaje: "Los identificadores deben ser enteros positivos"
            });
            return;
        }

        if (!esObjetoValido(req.body)) {
            res.status(400).json({
                mensaje: "El cuerpo de la solicitud no es válido"
            });
            return;
        }

        const repo = repositorio();

        const registro = await repo.findOneBy({
            idCompra,
            idPieza
        });

        if (!registro) {
            res.status(404).json({
                mensaje: "Pieza comprada no encontrada"
            });
            return;
        }

        if (req.body.cantidad !== undefined) {
            const cantidad = validarCantidad(req.body.cantidad);

            if (cantidad === null) {
                res.status(400).json({
                    mensaje: "La cantidad debe ser un entero positivo"
                });
                return;
            }

            registro.cantidad = cantidad;
        }

        if (req.body.subTotal !== undefined) {
            const subTotal = validarSubTotal(req.body.subTotal);

            if (subTotal === null) {
                res.status(400).json({
                    mensaje: "El subtotal debe ser válido, no negativo y tener máximo dos decimales"
                });
                return;
            }

            registro.subTotal = subTotal;
        }

        res.json(await repo.save(registro));
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al actualizar pieza comprada"
        });
    }
}

export async function eliminarPiezaComprada(
    req: Request,
    res: Response
) {
    try {
        const idCompra = Number(req.params.idCompra);
        const idPieza = Number(req.params.idPieza);

        if (!esIdValido(idCompra) || !esIdValido(idPieza)) {
            res.status(400).json({
                mensaje: "Los identificadores deben ser enteros positivos"
            });
            return;
        }

        const repo = repositorio();

        const registro = await repo.findOneBy({
            idCompra,
            idPieza
        });

        if (!registro) {
            res.status(404).json({
                mensaje: "Pieza comprada no encontrada"
            });
            return;
        }

        await repo.remove(registro);

        res.json({
            mensaje: "Pieza comprada eliminada correctamente"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al eliminar pieza comprada"
        });
    }
}