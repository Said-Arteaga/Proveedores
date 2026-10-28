
import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { ProveedorPieza } from "../entities/ProveedorPieza";

const repositorio = () => AppDataSource.getRepository(ProveedorPieza);

export async function obtenerRelaciones(_req: Request, res: Response) {
    try {
        res.json(await repositorio().find({
            relations: { proveedor: true, pieza: true }
        }));
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar proveedores y piezas" });
    }
}

export async function obtenerRelacion(req: Request, res: Response) {
    try {
        const idProveedor = Number(req.params.idProveedor);
        const idPieza = Number(req.params.idPieza);

        if (![idProveedor, idPieza].every(id => Number.isInteger(id) && id > 0)) {
            res.status(400).json({ mensaje: "Los identificadores no son válidos" });
            return;
        }

        const relacion = await repositorio().findOne({
            where: { idProveedor, idPieza },
            relations: { proveedor: true, pieza: true }
        });

        if (!relacion) {
            res.status(404).json({ mensaje: "Relación no encontrada" });
            return;
        }

        res.json(relacion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar la relación" });
    }
}

export async function crearRelacion(req: Request, res: Response) {
    try {
        const idProveedor = Number(req.body.idProveedor);
        const idPieza = Number(req.body.idPieza);
        const precio = Number(req.body.precio);
        const fecha = req.body.fecha;

        if (![idProveedor, idPieza].every(id => Number.isInteger(id) && id > 0) ||
            !Number.isFinite(precio) || precio < 0 ||
            typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            res.status(400).json({ mensaje: "Revisa los identificadores, el precio y la fecha (AAAA-MM-DD)" });
            return;
        }

        const relacion = repositorio().create({
            idProveedor, idPieza, precio: precio.toFixed(2), fecha
        });

        res.status(201).json(await repositorio().save(relacion));
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "No se pudo crear la relación. Verifica que existan el proveedor y la pieza."
        });
    }
}

export async function actualizarRelacion(req: Request, res: Response) {
    try {
        const idProveedor = Number(req.params.idProveedor);
        const idPieza = Number(req.params.idPieza);

        if (![idProveedor, idPieza].every(id => Number.isInteger(id) && id > 0)) {
            res.status(400).json({ mensaje: "Los identificadores no son válidos" });
            return;
        }

        const repo = repositorio();
        const relacion = await repo.findOneBy({ idProveedor, idPieza });

        if (!relacion) {
            res.status(404).json({ mensaje: "Relación no encontrada" });
            return;
        }

        if (req.body.precio !== undefined) {
            const precio = Number(req.body.precio);
            if (!Number.isFinite(precio) || precio < 0) {
                res.status(400).json({ mensaje: "El precio debe ser un número igual o mayor que cero" });
                return;
            }
            relacion.precio = precio.toFixed(2);
        }

        if (req.body.fecha !== undefined) {
            if (typeof req.body.fecha !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(req.body.fecha)) {
                res.status(400).json({ mensaje: "La fecha debe tener formato AAAA-MM-DD" });
                return;
            }
            relacion.fecha = req.body.fecha;
        }

        res.json(await repo.save(relacion));
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al actualizar la relación" });
    }
}

export async function eliminarRelacion(req: Request, res: Response) {
    try {
        const idProveedor = Number(req.params.idProveedor);
        const idPieza = Number(req.params.idPieza);

        if (![idProveedor, idPieza].every(id => Number.isInteger(id) && id > 0)) {
            res.status(400).json({ mensaje: "Los identificadores no son válidos" });
            return;
        }

        const repo = repositorio();
        const relacion = await repo.findOneBy({ idProveedor, idPieza });

        if (!relacion) {
            res.status(404).json({ mensaje: "Relación no encontrada" });
            return;
        }

        await repo.remove(relacion);
        res.json({ mensaje: "Relación eliminada correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al eliminar la relación" });
    }
}
