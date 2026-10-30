import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Pieza } from "../entities/Pieza";
import { PiezaComprada } from "../entities/PiezaComprada";

class ErrorValidacion extends Error {}

const repositorio = () => AppDataSource.getRepository(Pieza);

// Comprueba que el cuerpo recibido sea un objeto JSON válido.
function validarCuerpo(body: any): void {
    if (
        body === null ||
        typeof body !== "object" ||
        Array.isArray(body)
    ) {
        throw new ErrorValidacion("El cuerpo de la solicitud no es válido.");
    }
}

// Valida los campos de texto y sus longitudes.
function validarTexto(
    valor: any,
    campo: string,
    longitudMaxima?: number
): string | null | undefined {

    if (valor === undefined) return undefined;

    if (valor === null || valor === "") return null;

    if (typeof valor !== "string") {
        throw new ErrorValidacion(`${campo} debe ser texto.`);
    }

    const texto = valor.trim();

    if (texto === "") return null;

    if (
        longitudMaxima !== undefined &&
        texto.length > longitudMaxima
    ) {
        throw new ErrorValidacion(
            `${campo} no puede superar los ${longitudMaxima} caracteres.`
        );
    }

    return texto;
}

// Valida el nombre obligatorio.
function validarNombre(valor: any): string {
    const nombre = validarTexto(valor, "El nombre", 120);

    if (nombre === undefined || nombre === null) {
        throw new ErrorValidacion("El nombre de la pieza es obligatorio.");
    }

    return nombre;
}

// GET: consultar todas las piezas.
export async function obtenerPiezas(_req: Request, res: Response) {
    try {
        res.json(await repositorio().find());
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar piezas." });
    }
}

// GET: consultar una pieza por su ID.
export async function obtenerPiezaPorId(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ mensaje: "El ID de la pieza no es válido." });
            return;
        }

        const pieza = await repositorio().findOneBy({ idPieza: id });

        if (!pieza) {
            res.status(404).json({ mensaje: "Pieza no encontrada." });
            return;
        }

        res.json(pieza);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar pieza." });
    }
}

// POST: crear una pieza.
export async function crearPieza(req: Request, res: Response) {
    try {
        validarCuerpo(req.body);

        const nombre = validarNombre(req.body.nombre);
        const color = validarTexto(req.body.color, "El color", 50);
        const material = validarTexto(req.body.material, "El material", 100);
        const dimensiones = validarTexto(
            req.body.dimensiones,
            "Las dimensiones",
            120
        );
        const descripcion = validarTexto(req.body.descripcion, "La descripción");
        const categorias = validarTexto(
            req.body.categorias,
            "Las categorías",
            255
        );

        const pieza = repositorio().create({
            nombre,
            color: color ?? null,
            material: material ?? null,
            dimensiones: dimensiones ?? null,
            descripcion: descripcion ?? null,
            categorias: categorias ?? null
        });

        res.status(201).json(await repositorio().save(pieza));
    } catch (error) {
        if (error instanceof ErrorValidacion) {
            res.status(400).json({ mensaje: error.message });
            return;
        }

        console.error(error);
        res.status(500).json({ mensaje: "Error al crear pieza." });
    }
}

// PUT: actualizar una pieza.
export async function actualizarPieza(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ mensaje: "El ID de la pieza no es válido." });
            return;
        }

        validarCuerpo(req.body);

        const repo = repositorio();
        const pieza = await repo.findOneBy({ idPieza: id });

        if (!pieza) {
            res.status(404).json({ mensaje: "Pieza no encontrada." });
            return;
        }

        // Solo modifica los campos que fueron enviados.
        if (req.body.nombre !== undefined) {
            pieza.nombre = validarNombre(req.body.nombre);
        }

        if (req.body.color !== undefined) {
            pieza.color = validarTexto(req.body.color, "El color", 50) ?? null;
        }

        if (req.body.material !== undefined) {
            pieza.material = validarTexto(
                req.body.material,
                "El material",
                100
            ) ?? null;
        }

        if (req.body.dimensiones !== undefined) {
            pieza.dimensiones = validarTexto(
                req.body.dimensiones,
                "Las dimensiones",
                120
            ) ?? null;
        }

        if (req.body.descripcion !== undefined) {
            pieza.descripcion = validarTexto(
                req.body.descripcion,
                "La descripción"
            ) ?? null;
        }

        if (req.body.categorias !== undefined) {
            pieza.categorias = validarTexto(
                req.body.categorias,
                "Las categorías",
                255
            ) ?? null;
        }

        res.json(await repo.save(pieza));
    } catch (error) {
        if (error instanceof ErrorValidacion) {
            res.status(400).json({ mensaje: error.message });
            return;
        }

        console.error(error);
        res.status(500).json({ mensaje: "Error al actualizar pieza." });
    }
}

// DELETE: eliminar una pieza.
export async function eliminarPieza(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ mensaje: "El ID de la pieza no es válido." });
            return;
        }

        const repo = repositorio();
        const pieza = await repo.findOneBy({ idPieza: id });

        if (!pieza) {
            res.status(404).json({ mensaje: "Pieza no encontrada." });
            return;
        }

        // Una pieza utilizada en compras no puede eliminarse.
        const cantidadCompras = await AppDataSource
            .getRepository(PiezaComprada)
            .count({ where: { idPieza: id } });

        if (cantidadCompras > 0) {
            res.status(409).json({
                mensaje: "No se puede eliminar la pieza porque aparece en compras registradas."
            });
            return;
        }

        // Las relaciones con proveedores se eliminan mediante CASCADE.
        await repo.remove(pieza);

        res.json({ mensaje: "Pieza eliminada correctamente." });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "No se pudo eliminar la pieza."
        });
    }
}