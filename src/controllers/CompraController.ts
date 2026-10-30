import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Compra } from "../entities/Compra";
import { Proveedor } from "../entities/Proveedor";

class ErrorValidacion extends Error {}

const repositorio = () => AppDataSource.getRepository(Compra);

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

// Valida los identificadores.
function validarIdProveedor(valor: any): number {
    const id = Number(valor);

    if (
        valor === undefined ||
        valor === null ||
        valor === "" ||
        !Number.isInteger(id) ||
        id <= 0
    ) {
        throw new ErrorValidacion("El ID del proveedor no es válido.");
    }

    return id;
}

// Comprueba que el proveedor exista.
async function validarProveedor(idProveedor: number): Promise<void> {
    const proveedor = await AppDataSource
        .getRepository(Proveedor)
        .findOneBy({ idProveedor });

    if (!proveedor) {
        throw new ErrorValidacion("El proveedor indicado no existe.");
    }
}

// Valida el número de factura.
function validarNumFactura(valor: any): string {
    if (typeof valor !== "string" || !valor.trim()) {
        throw new ErrorValidacion(
            "El número de factura es obligatorio y debe ser texto."
        );
    }

    const numFactura = valor.trim();

    if (numFactura.length > 50) {
        throw new ErrorValidacion(
            "El número de factura no puede superar los 50 caracteres."
        );
    }

    return numFactura;
}

// Valida que la fecha tenga formato AAAA-MM-DD y sea real.
function validarFecha(valor: any): string {
    if (
        typeof valor !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(valor)
    ) {
        throw new ErrorValidacion(
            "La fecha debe tener formato AAAA-MM-DD."
        );
    }

    const fecha = new Date(`${valor}T00:00:00.000Z`);

    if (
        Number.isNaN(fecha.getTime()) ||
        fecha.toISOString().slice(0, 10) !== valor
    ) {
        throw new ErrorValidacion("La fecha indicada no es válida.");
    }

    return valor;
}

// Valida el total de la compra (DECIMAL 12,2).
function validarTotal(valor: any): string {
    if (
        (typeof valor !== "number" && typeof valor !== "string") ||
        String(valor).trim() === "" ||
        !/^\d+(?:\.\d{1,2})?$/.test(String(valor))
    ) {
        throw new ErrorValidacion(
            "El total debe ser un número igual o mayor que cero, con máximo dos decimales."
        );
    }

    const total = Number(valor);

    if (
        !Number.isFinite(total) ||
        total < 0 ||
        total > 9999999999.99
    ) {
        throw new ErrorValidacion(
            "El total está fuera del rango permitido."
        );
    }

    return total.toFixed(2);
}

// GET: consultar todas las compras.
export async function obtenerCompras(_req: Request, res: Response) {
    try {
        const compras = await repositorio().find({
            relations: {
                proveedor: true,
                piezasCompradas: true
            }
        });

        res.json(compras);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al consultar compras."
        });
    }
}

// GET: consultar una compra por su ID.
export async function obtenerCompraPorId(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({
                mensaje: "El ID de la compra no es válido."
            });
            return;
        }

        const compra = await repositorio().findOne({
            where: { idCompra: id },
            relations: {
                proveedor: true,
                piezasCompradas: true
            }
        });

        if (!compra) {
            res.status(404).json({
                mensaje: "Compra no encontrada."
            });
            return;
        }

        res.json(compra);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al consultar compra."
        });
    }
}

// POST: crear una compra.
export async function crearCompra(req: Request, res: Response) {
    try {
        validarCuerpo(req.body);

        const idProveedor = validarIdProveedor(req.body.idProveedor);
        const numFactura = validarNumFactura(req.body.numFactura);
        const fecha = validarFecha(req.body.fecha);
        const total = validarTotal(req.body.total);

        await validarProveedor(idProveedor);

        const compra = repositorio().create({
            idProveedor,
            numFactura,
            fecha,
            total
        });

        res.status(201).json(await repositorio().save(compra));
    } catch (error) {
        if (error instanceof ErrorValidacion) {
            res.status(400).json({ mensaje: error.message });
            return;
        }

        console.error(error);
        res.status(500).json({
            mensaje: "Error al crear la compra."
        });
    }
}

// PUT: actualizar una compra.
export async function actualizarCompra(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({
                mensaje: "El ID de la compra no es válido."
            });
            return;
        }

        validarCuerpo(req.body);

        const repo = repositorio();
        const compra = await repo.findOneBy({ idCompra: id });

        if (!compra) {
            res.status(404).json({
                mensaje: "Compra no encontrada."
            });
            return;
        }

        if (req.body.idProveedor !== undefined) {
            const idProveedor = validarIdProveedor(req.body.idProveedor);

            await validarProveedor(idProveedor);

            compra.idProveedor = idProveedor;
        }

        if (req.body.numFactura !== undefined) {
            compra.numFactura = validarNumFactura(req.body.numFactura);
        }

        if (req.body.fecha !== undefined) {
            compra.fecha = validarFecha(req.body.fecha);
        }

        if (req.body.total !== undefined) {
            compra.total = validarTotal(req.body.total);
        }

        res.json(await repo.save(compra));
    } catch (error) {
        if (error instanceof ErrorValidacion) {
            res.status(400).json({ mensaje: error.message });
            return;
        }

        console.error(error);
        res.status(500).json({
            mensaje: "Error al actualizar la compra."
        });
    }
}

// DELETE: eliminar una compra.
export async function eliminarCompra(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({
                mensaje: "El ID de la compra no es válido."
            });
            return;
        }

        const repo = repositorio();
        const compra = await repo.findOneBy({ idCompra: id });

        if (!compra) {
            res.status(404).json({
                mensaje: "Compra no encontrada."
            });
            return;
        }

        // Los detalles de la compra se eliminan mediante CASCADE.
        await repo.remove(compra);

        res.json({
            mensaje: "Compra eliminada correctamente."
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "Error al eliminar la compra."
        });
    }
}