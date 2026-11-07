
import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";

import { PiezaComprada } from "../entities/PiezaComprada";
import { Compra } from "../entities/Compra";
import { ProveedorPieza } from "../entities/ProveedorPieza";

import {
    enteroPositivo,
    importe,
    responderError
} from "../utils/validacion";

const repositorio = () =>
    AppDataSource.getRepository(PiezaComprada);

const compraRepository = () =>
    AppDataSource.getRepository(Compra);

const proveedorPiezaRepository = () =>
    AppDataSource.getRepository(ProveedorPieza);


// GET: Obtener todos los detalles de compra
export async function obtenerPiezasCompradas(
    _req: Request,
    res: Response
) {
    try {
        const registros = await repositorio().find({
            relations: {
                compra: true,
                proveedorPieza: {
                    proveedor: true,
                    pieza: true
                }
            }
        });

        res.json(registros);
    } catch (error) {
        responderError(
            error,
            res,
            "Error al consultar piezas compradas"
        );
    }
}


// GET: Obtener un detalle de compra
export async function obtenerPiezaComprada(
    req: Request,
    res: Response
) {
    try {
        const idCompra = enteroPositivo(
            req.params.idCompra,
            "idCompra"
        );

        const idPieza = enteroPositivo(
            req.params.idPieza,
            "idPieza"
        );

        const registro = await repositorio().findOne({
            where: { idCompra, idPieza },
            relations: {
                compra: true,
                proveedorPieza: {
                    proveedor: true,
                    pieza: true
                }
            }
        });

        if (!registro) {
            res.status(404).json({
                mensaje: "Pieza comprada no encontrada"
            });
            return;
        }

        res.json(registro);
    } catch (error) {
        responderError(
            error,
            res,
            "Error al consultar pieza comprada"
        );
    }
}


// POST: Registrar una pieza comprada
export async function crearPiezaComprada(
    req: Request,
    res: Response
) {
    try {
        const datos = req.body ?? {};

        const idCompra = enteroPositivo(
            datos.idCompra,
            "idCompra"
        );

        const idPieza = enteroPositivo(
            datos.idPieza,
            "idPieza"
        );

        const cantidad = enteroPositivo(
            datos.cantidad,
            "La cantidad"
        );

        const subTotal = importe(
            datos.subTotal,
            "El subtotal"
        );

        // Comprobar que exista la compra
        const compra = await compraRepository().findOneBy({
            idCompra
        });

        if (!compra) {
            res.status(404).json({
                mensaje: "La compra indicada no existe"
            });
            return;
        }

        const idProveedor = compra.idProveedor;

        // Comprobar que exista la relación proveedor-pieza
        const proveedorPieza =
            await proveedorPiezaRepository().findOneBy({
                idProveedor,
                idPieza
            });

        if (!proveedorPieza) {
            res.status(404).json({
                mensaje: "El proveedor no ofrece la pieza indicada"
            });
            return;
        }

        const registro = repositorio().create({
            idCompra,
            idPieza,
            idProveedor,
            cantidad,
            subTotal
        });

        await repositorio().insert(registro);

        res.status(201).json(registro);

    } catch (error) {
        responderError(
            error,
            res,
            "No se pudo registrar la pieza comprada"
        );
    }
}


// PUT: Actualizar un detalle de compra
export async function actualizarPiezaComprada(
    req: Request,
    res: Response
) {
    try {
        const idCompra = enteroPositivo(
            req.params.idCompra,
            "idCompra"
        );

        const idPieza = enteroPositivo(
            req.params.idPieza,
            "idPieza"
        );

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

        const datos = req.body ?? {};

        if (datos.cantidad !== undefined) {
            registro.cantidad = enteroPositivo(
                datos.cantidad,
                "La cantidad"
            );
        }

        if (datos.subTotal !== undefined) {
            registro.subTotal = importe(
                datos.subTotal,
                "El subtotal"
            );
        }

        res.json(await repo.save(registro));

    } catch (error) {
        responderError(
            error,
            res,
            "Error al actualizar pieza comprada"
        );
    }
}


// DELETE: Eliminar un detalle de compra
export async function eliminarPiezaComprada(
    req: Request,
    res: Response
) {
    try {
        const idCompra = enteroPositivo(
            req.params.idCompra,
            "idCompra"
        );

        const idPieza = enteroPositivo(
            req.params.idPieza,
            "idPieza"
        );

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
        responderError(
            error,
            res,
            "Error al eliminar pieza comprada"
        );
    }
}
