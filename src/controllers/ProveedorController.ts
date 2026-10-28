
import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Proveedor } from "../entities/Proveedor";

const proveedorRepository = () =>
    AppDataSource.getRepository(Proveedor);

export async function obtenerProveedores(_req: Request, res: Response) {
    try {
        const proveedores = await proveedorRepository().find();
        res.json(proveedores);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar proveedores" });
    }
}

export async function obtenerProveedorPorId(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ mensaje: "El ID no es válido" });
            return;
        }

        const proveedor = await proveedorRepository().findOneBy({
            idProveedor: id
        });

        if (!proveedor) {
            res.status(404).json({ mensaje: "Proveedor no encontrado" });
            return;
        }

        res.json(proveedor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar el proveedor" });
    }
}

export async function crearProveedor(req: Request, res: Response) {
    try {
        const {
            nombre,
            contacto,
            direccion,
            telefono,
            correo,
            latitud,
            longitud,
            ciudad,
            estado
        } = req.body;

        if (typeof nombre !== "string" || !nombre.trim()) {
            res.status(400).json({ mensaje: "El nombre es obligatorio" });
            return;
        }

        const nuevoProveedor = proveedorRepository().create({
            nombre: nombre.trim(),
            contacto,
            direccion,
            telefono,
            correo,
            latitud,
            longitud,
            ciudad,
            estado
        });

        const proveedorGuardado =
            await proveedorRepository().save(nuevoProveedor);

        res.status(201).json(proveedorGuardado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al crear el proveedor" });
    }
}

export async function actualizarProveedor(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ mensaje: "El ID no es válido" });
            return;
        }

        const repositorio = proveedorRepository();
        const proveedor = await repositorio.findOneBy({
            idProveedor: id
        });

        if (!proveedor) {
            res.status(404).json({ mensaje: "Proveedor no encontrado" });
            return;
        }

        const camposPermitidos = [
            "nombre",
            "contacto",
            "direccion",
            "telefono",
            "correo",
            "latitud",
            "longitud",
            "ciudad",
            "estado"
        ] as const;

        for (const campo of camposPermitidos) {
            if (req.body[campo] !== undefined) {
                Object.assign(proveedor, { [campo]: req.body[campo] });
            }
        }

        if (typeof proveedor.nombre !== "string" || !proveedor.nombre.trim()) {
            res.status(400).json({ mensaje: "El nombre es obligatorio" });
            return;
        }

        proveedor.nombre = proveedor.nombre.trim();

        const proveedorActualizado = await repositorio.save(proveedor);
        res.json(proveedorActualizado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al actualizar el proveedor" });
    }
}

export async function eliminarProveedor(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ mensaje: "El ID no es válido" });
            return;
        }

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
        console.error(error);
        res.status(500).json({
            mensaje: "No se pudo eliminar el proveedor. Puede tener compras asociadas."
        });
    }
}
