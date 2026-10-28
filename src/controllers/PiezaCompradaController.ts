
import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { PiezaComprada } from "../entities/PiezaComprada";

const repositorio = () => AppDataSource.getRepository(PiezaComprada);

export async function obtenerPiezasCompradas(_req: Request, res: Response) {
    try {
        res.json(await repositorio().find({
            relations: { compra: true, pieza: true }
        }));
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar piezas compradas" });
    }
}

export async function obtenerPiezaComprada(req: Request, res: Response) {
    try {
        const idCompra = Number(req.params.idCompra);
        const idPieza = Number(req.params.idPieza);

        if (![idCompra, idPieza].every(id => Number.isInteger(id) && id > 0)) {
            res.status(400).json({ mensaje: "Los identificadores no son válidos" });
            return;
        }

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
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar pieza comprada" });
    }
}

export async function crearPiezaComprada(req: Request, res: Response) {
    try {
        const idCompra = Number(req.body.idCompra);
        const idPieza = Number(req.body.idPieza);
        const cantidad = Number(req.body.cantidad);
        const subTotal = Number(req.body.subTotal);

        if (![idCompra, idPieza].every(id => Number.isInteger(id) && id > 0) ||
            !Number.isInteger(cantidad) || cantidad <= 0 ||
            !Number.isFinite(subTotal) || subTotal < 0) {
            res.status(400).json({
                mensaje: "Revisa los IDs, la cantidad (mayor que cero) y el subtotal"
            });
            return;
        }

        const registro = repositorio().create({
            idCompra,
            idPieza,
            cantidad,
            subTotal: subTotal.toFixed(2)
        });

        res.status(201).json(await repositorio().save(registro));
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "No se pudo registrar la pieza. Verifica que existan la compra y la pieza."
        });
    }
}

export async function actualizarPiezaComprada(req: Request, res: Response) {
    try {
        const idCompra = Number(req.params.idCompra);
        const idPieza = Number(req.params.idPieza);

        if (![idCompra, idPieza].every(id => Number.isInteger(id) && id > 0)) {
            res.status(400).json({ mensaje: "Los identificadores no son válidos" });
            return;
        }

        const repo = repositorio();
        const registro = await repo.findOneBy({ idCompra, idPieza });

        if (!registro) {
            res.status(404).json({ mensaje: "Pieza comprada no encontrada" });
            return;
        }

        if (req.body.cantidad !== undefined) {
            const cantidad = Number(req.body.cantidad);
            if (!Number.isInteger(cantidad) || cantidad <= 0) {
                res.status(400).json({ mensaje: "La cantidad debe ser un entero mayor que cero" });
                return;
            }
            registro.cantidad = cantidad;
        }

        if (req.body.subTotal !== undefined) {
            const subTotal = Number(req.body.subTotal);
            if (!Number.isFinite(subTotal) || subTotal < 0) {
                res.status(400).json({ mensaje: "El subtotal debe ser igual o mayor que cero" });
                return;
            }
            registro.subTotal = subTotal.toFixed(2);
        }

        res.json(await repo.save(registro));
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al actualizar pieza comprada" });
    }
}

export async function eliminarPiezaComprada(req: Request, res: Response) {
    try {
        const idCompra = Number(req.params.idCompra);
        const idPieza = Number(req.params.idPieza);

        if (![idCompra, idPieza].every(id => Number.isInteger(id) && id > 0)) {
            res.status(400).json({ mensaje: "Los identificadores no son válidos" });
            return;
        }

        const repo = repositorio();
        const registro = await repo.findOneBy({ idCompra, idPieza });

        if (!registro) {
            res.status(404).json({ mensaje: "Pieza comprada no encontrada" });
            return;
        }

        await repo.remove(registro);
        res.json({ mensaje: "Pieza comprada eliminada correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al eliminar pieza comprada" });
    }
}
