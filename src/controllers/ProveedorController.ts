
import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Proveedor } from "../entities/Proveedor";
import { datosProveedor, enteroPositivo, responderError } from "../utils/validacion";

const proveedorRepository = () =>
    AppDataSource.getRepository(Proveedor);

export async function obtenerProveedores(_req: Request, res: Response) {
    try {
        const proveedores = await proveedorRepository().find();
        res.json(proveedores);
    } catch (error) {
        responderError(error, res, "Error al consultar proveedores");
    }
}

export async function obtenerProveedorPorId(req: Request, res: Response) {
    try {
        const id = enteroPositivo(req.params.id, "ID");


        const proveedor = await proveedorRepository().findOneBy({
            idProveedor: id
        });

        if (!proveedor) {
            res.status(404).json({ mensaje: "Proveedor no encontrado" });
            return;
        }

        res.json(proveedor);
    } catch (error) {
        responderError(error, res, "Error al consultar el proveedor");
    }
}

export async function crearProveedor(req: Request, res: Response) {
    try {
        const nuevoProveedor = proveedorRepository().create(datosProveedor(req.body ?? {}, true));

        const proveedorGuardado =
            await proveedorRepository().save(nuevoProveedor);

        res.status(201).json(proveedorGuardado);
    } catch (error) {
        responderError(error, res, "Error al crear el proveedor");
    }
}

export async function actualizarProveedor(req: Request, res: Response) {
    try {
        const id = enteroPositivo(req.params.id, "ID");


        const repositorio = proveedorRepository();
        const proveedor = await repositorio.findOneBy({
            idProveedor: id
        });

        if (!proveedor) {
            res.status(404).json({ mensaje: "Proveedor no encontrado" });
            return;
        }

        Object.assign(proveedor, datosProveedor(req.body ?? {}));

        const proveedorActualizado = await repositorio.save(proveedor);
        res.json(proveedorActualizado);
    } catch (error) {
        responderError(error, res, "Error al actualizar el proveedor");
    }
}

export async function eliminarProveedor(req: Request, res: Response) {
    try {
        const id = enteroPositivo(req.params.id, "ID");


        const repositorio = proveedorRepository();
        const proveedor = await repositorio.findOneBy({
            idProveedor: id
        });

        if (!proveedor) {
            res.status(404).json({ mensaje: "Proveedor no encontrado" });
            return;
        }

        await repositorio.remove(proveedor);

        res.json({ mensaje: "Proveedor eliminado correctamente" });
    } catch (error) {
        responderError(error, res, "No se pudo eliminar el proveedor. Puede tener compras asociadas.");
    }
}
