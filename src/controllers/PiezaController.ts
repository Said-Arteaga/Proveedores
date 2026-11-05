
import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Pieza } from "../entities/Pieza";
import { datosPieza, enteroPositivo, responderError } from "../utils/validacion";

const repositorio = () => AppDataSource.getRepository(Pieza);

export async function obtenerPiezas(_req: Request, res: Response) {
    try {
        res.json(await repositorio().find());
    } catch (error) {
        responderError(error, res, "Error al consultar piezas");
    }
}

export async function obtenerPiezaPorId(req: Request, res: Response) {
    try {
        const id = enteroPositivo(req.params.id, "ID");

        const pieza = await repositorio().findOneBy({ idPieza: id });
        if (!pieza) {
            res.status(404).json({ mensaje: "Pieza no encontrada" });
            return;
        }

        res.json(pieza);
    } catch (error) {
        responderError(error, res, "Error al consultar pieza");
    }
}

export async function crearPieza(req: Request, res: Response) {
    try {
        const pieza = repositorio().create(datosPieza(req.body ?? {}, true));

        res.status(201).json(await repositorio().save(pieza));
    } catch (error) {
        responderError(error, res, "Error al crear pieza");
    }
}

export async function actualizarPieza(req: Request, res: Response) {
    try {
        const id = enteroPositivo(req.params.id, "ID");

        const repo = repositorio();
        const pieza = await repo.findOneBy({ idPieza: id });

        if (!pieza) {
            res.status(404).json({ mensaje: "Pieza no encontrada" });
            return;
        }

        Object.assign(pieza, datosPieza(req.body ?? {}));
        res.json(await repo.save(pieza));
    } catch (error) {
        responderError(error, res, "Error al actualizar pieza");
    }
}

export async function eliminarPieza(req: Request, res: Response) {
    try {
        const id = enteroPositivo(req.params.id, "ID");

        const repo = repositorio();
        const pieza = await repo.findOneBy({ idPieza: id });

        if (!pieza) {
            res.status(404).json({ mensaje: "Pieza no encontrada" });
            return;
        }

        await repo.remove(pieza);
        res.json({ mensaje: "Pieza eliminada correctamente" });
    } catch (error) {
        responderError(error, res, "No se pudo eliminar la pieza.");
    }
}
