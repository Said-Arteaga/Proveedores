
import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Pieza } from "../entities/Pieza";

const repositorio = () => AppDataSource.getRepository(Pieza);

export async function obtenerPiezas(_req: Request, res: Response) {
    try {
        res.json(await repositorio().find());
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar piezas" });
    }
}

export async function obtenerPiezaPorId(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ mensaje: "ID no válido" });
            return;
        }

        const pieza = await repositorio().findOneBy({ idPieza: id });
        if (!pieza) {
            res.status(404).json({ mensaje: "Pieza no encontrada" });
            return;
        }

        res.json(pieza);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar pieza" });
    }
}

export async function crearPieza(req: Request, res: Response) {
    try {
        const { nombre, color, material, dimensiones, descripcion, categorias } = req.body;

        if (typeof nombre !== "string" || !nombre.trim()) {
            res.status(400).json({ mensaje: "El nombre es obligatorio" });
            return;
        }

        const pieza = repositorio().create({
            nombre: nombre.trim(),
            color,
            material,
            dimensiones,
            descripcion,
            categorias
        });

        res.status(201).json(await repositorio().save(pieza));
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al crear pieza" });
    }
}

export async function actualizarPieza(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ mensaje: "ID no válido" });
            return;
        }

        const repo = repositorio();
        const pieza = await repo.findOneBy({ idPieza: id });

        if (!pieza) {
            res.status(404).json({ mensaje: "Pieza no encontrada" });
            return;
        }

        const campos = ["nombre", "color", "material", "dimensiones", "descripcion", "categorias"] as const;

        for (const campo of campos) {
            if (req.body[campo] !== undefined) {
                Object.assign(pieza, { [campo]: req.body[campo] });
            }
        }

        if (typeof pieza.nombre !== "string" || !pieza.nombre.trim()) {
            res.status(400).json({ mensaje: "El nombre es obligatorio" });
            return;
        }

        pieza.nombre = pieza.nombre.trim();
        res.json(await repo.save(pieza));
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al actualizar pieza" });
    }
}

export async function eliminarPieza(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ mensaje: "ID no válido" });
            return;
        }

        const repo = repositorio();
        const pieza = await repo.findOneBy({ idPieza: id });

        if (!pieza) {
            res.status(404).json({ mensaje: "Pieza no encontrada" });
            return;
        }

        await repo.remove(pieza);
        res.json({ mensaje: "Pieza eliminada correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "No se pudo eliminar la pieza. Puede tener compras o proveedores asociados."
        });
    }
}
