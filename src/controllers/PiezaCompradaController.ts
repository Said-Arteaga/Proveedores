
import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { PiezaComprada } from "../entities/PiezaComprada";

import { enteroPositivo, importe, responderError } from "../utils/validacion";

const repositorio = () => AppDataSource.getRepository(PiezaComprada);

export async function obtenerPiezasCompradas(_req: Request, res: Response) {
    try {
        res.json(await repositorio().find({
            relations: { compra: true, pieza: true }
        }));
    } catch (error) {
        responderError(error, res, "Error al consultar piezas compradas");
    }
}

export async function obtenerPiezaComprada(req: Request, res: Response) {
    try {
        const idCompra = enteroPositivo(req.params.idCompra, "idCompra");
        const idPieza = enteroPositivo(req.params.idPieza, "idPieza");


        const registro = await repositorio().findOne({
            where: { idCompra, idPieza },
            relations: { compra: true, pieza: true }
        });

        if (!registro) {
            res.status(404).json({ mensaje: "Pieza comprada no encontrada" });
            return;
        }

        res.json(registro);
    } catch (error) {
        responderError(error, res, "Error al consultar pieza comprada");
    }
}

export async function crearPiezaComprada(req: Request, res: Response) {
    try {
        const datos = req.body ?? {};
        const registro = repositorio().create({
            idCompra: enteroPositivo(datos.idCompra, "idCompra"),
            idPieza: enteroPositivo(datos.idPieza, "idPieza"),
            cantidad: enteroPositivo(datos.cantidad, "La cantidad"),
            subTotal: importe(datos.subTotal, "El subtotal")
        });
        await repositorio().insert(registro);
        res.status(201).json(registro);
    } catch (error) {
        responderError(error, res, "No se pudo registrar la pieza. Verifica que existan la compra y la pieza.");
    }
}

export async function actualizarPiezaComprada(req: Request, res: Response) {
    try {
        const idCompra = enteroPositivo(req.params.idCompra, "idCompra");
        const idPieza = enteroPositivo(req.params.idPieza, "idPieza");


        const repo = repositorio();
        const registro = await repo.findOneBy({ idCompra, idPieza });

        if (!registro) {
            res.status(404).json({ mensaje: "Pieza comprada no encontrada" });
            return;
        }

        const datos = req.body ?? {};
        if (datos.cantidad !== undefined) registro.cantidad = enteroPositivo(datos.cantidad, "La cantidad");
        if (datos.subTotal !== undefined) registro.subTotal = importe(datos.subTotal, "El subtotal");

        res.json(await repo.save(registro));
    } catch (error) {
        responderError(error, res, "Error al actualizar pieza comprada");
    }
}

export async function eliminarPiezaComprada(req: Request, res: Response) {
    try {
        const idCompra = enteroPositivo(req.params.idCompra, "idCompra");
        const idPieza = enteroPositivo(req.params.idPieza, "idPieza");


        const repo = repositorio();
        const registro = await repo.findOneBy({ idCompra, idPieza });

        if (!registro) {
            res.status(404).json({ mensaje: "Pieza comprada no encontrada" });
            return;
        }

        await repo.remove(registro);
        res.json({ mensaje: "Pieza comprada eliminada correctamente" });
    } catch (error) {
        responderError(error, res, "Error al eliminar pieza comprada");
    }
}
