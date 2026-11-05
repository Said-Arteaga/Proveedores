
import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Compra } from "../entities/Compra";
import { datosCompra, enteroPositivo, responderError } from "../utils/validacion";

const repositorio = () => AppDataSource.getRepository(Compra);

export async function obtenerCompras(_req: Request, res: Response) {
    try {
        res.json(await repositorio().find({
            relations: { proveedor: true, piezasCompradas: true }
        }));
    } catch (error) {
        responderError(error, res, "Error al consultar compras");
    }
}

export async function obtenerCompraPorId(req: Request, res: Response) {
    try {
        const id = enteroPositivo(req.params.id, "ID");

        const compra = await repositorio().findOne({
            where: { idCompra: id },
            relations: { proveedor: true, piezasCompradas: true }
        });

        if (!compra) {
            res.status(404).json({ mensaje: "Compra no encontrada" });
            return;
        }

        res.json(compra);
    } catch (error) {
        responderError(error, res, "Error al consultar compra");
    }
}

export async function crearCompra(req: Request, res: Response) {
    try {
        const compra = repositorio().create(datosCompra(req.body ?? {}, true));

        res.status(201).json(await repositorio().save(compra));
    } catch (error) {
        responderError(error, res, "No se pudo crear la compra.");
    }
}

export async function actualizarCompra(req: Request, res: Response) {
    try {
        const id = enteroPositivo(req.params.id, "ID");

        const repo = repositorio();
        const compra = await repo.findOneBy({ idCompra: id });

        if (!compra) {
            res.status(404).json({ mensaje: "Compra no encontrada" });
            return;
        }

        Object.assign(compra, datosCompra(req.body ?? {}));
        res.json(await repo.save(compra));
    } catch (error) {
        responderError(error, res, "Error al actualizar compra.");
    }
}

export async function eliminarCompra(req: Request, res: Response) {
    try {
        const id = enteroPositivo(req.params.id, "ID");

        const repo = repositorio();
        const compra = await repo.findOneBy({ idCompra: id });

        if (!compra) {
            res.status(404).json({ mensaje: "Compra no encontrada" });
            return;
        }

        await repo.remove(compra);
        res.json({ mensaje: "Compra eliminada correctamente" });
    } catch (error) {
        responderError(error, res, "Error al eliminar compra");
    }
}
