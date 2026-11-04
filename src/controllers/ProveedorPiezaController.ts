
import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { ProveedorPieza } from "../entities/ProveedorPieza";

import { enteroPositivo, importe, fechaCalendario, responderError } from "../utils/validacion";

const repositorio = () => AppDataSource.getRepository(ProveedorPieza);

export async function obtenerRelaciones(_req: Request, res: Response) {
    try {
        res.json(await repositorio().find({
            relations: { proveedor: true, pieza: true }
        }));
    } catch (error) {
        responderError(error, res, "Error al consultar proveedores y piezas");
    }
}

export async function obtenerRelacion(req: Request, res: Response) {
    try {
        const idProveedor = enteroPositivo(req.params.idProveedor, "idProveedor");
        const idPieza = enteroPositivo(req.params.idPieza, "idPieza");


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
        responderError(error, res, "Error al consultar la relación");
    }
}

export async function crearRelacion(req: Request, res: Response) {
    try {
        const datos = req.body ?? {};
        const relacion = repositorio().create({
            idProveedor: enteroPositivo(datos.idProveedor, "idProveedor"),
            idPieza: enteroPositivo(datos.idPieza, "idPieza"),
            precio: importe(datos.precio, "El precio"),
            fecha: fechaCalendario(datos.fecha)
        });
        await repositorio().insert(relacion);
        res.status(201).json(relacion);
    } catch (error) {
        responderError(error, res, "No se pudo crear la relación. Verifica que existan el proveedor y la pieza.");
    }
}

export async function actualizarRelacion(req: Request, res: Response) {
    try {
        const idProveedor = enteroPositivo(req.params.idProveedor, "idProveedor");
        const idPieza = enteroPositivo(req.params.idPieza, "idPieza");


        const repo = repositorio();
        const relacion = await repo.findOneBy({ idProveedor, idPieza });

        if (!relacion) {
            res.status(404).json({ mensaje: "Relación no encontrada" });
            return;
        }

        const datos = req.body ?? {};
        if (datos.precio !== undefined) relacion.precio = importe(datos.precio, "El precio");
        if (datos.fecha !== undefined) relacion.fecha = fechaCalendario(datos.fecha);

        res.json(await repo.save(relacion));
    } catch (error) {
        responderError(error, res, "Error al actualizar la relación");
    }
}

export async function eliminarRelacion(req: Request, res: Response) {
    try {
        const idProveedor = enteroPositivo(req.params.idProveedor, "idProveedor");
        const idPieza = enteroPositivo(req.params.idPieza, "idPieza");


        const repo = repositorio();
        const relacion = await repo.findOneBy({ idProveedor, idPieza });

        if (!relacion) {
            res.status(404).json({ mensaje: "Relación no encontrada" });
            return;
        }

        await repo.remove(relacion);
        res.json({ mensaje: "Relación eliminada correctamente" });
    } catch (error) {
        responderError(error, res, "Error al eliminar la relación");
    }
}
