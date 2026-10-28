
import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Compra } from "../entities/Compra";

const repositorio = () => AppDataSource.getRepository(Compra);

export async function obtenerCompras(_req: Request, res: Response) {
    try {
        res.json(await repositorio().find({
            relations: { proveedor: true, piezasCompradas: true }
        }));
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar compras" });
    }
}

export async function obtenerCompraPorId(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ mensaje: "ID no válido" });
            return;
        }

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
        console.error(error);
        res.status(500).json({ mensaje: "Error al consultar compra" });
    }
}

export async function crearCompra(req: Request, res: Response) {
    try {
        const idProveedor = Number(req.body.idProveedor);
        const { numFactura, fecha } = req.body;
        const total = Number(req.body.total);

        if (!Number.isInteger(idProveedor) || idProveedor <= 0 ||
            typeof numFactura !== "string" || !numFactura.trim() ||
            typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
            !Number.isFinite(total) || total < 0) {
            res.status(400).json({
                mensaje: "Revisa idProveedor, numFactura, fecha (AAAA-MM-DD) y total"
            });
            return;
        }

        const compra = repositorio().create({
            idProveedor,
            numFactura: numFactura.trim(),
            fecha,
            total: total.toFixed(2)
        });

        res.status(201).json(await repositorio().save(compra));
    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensaje: "No se pudo crear la compra. Verifica que exista el proveedor."
        });
    }
}

export async function actualizarCompra(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ mensaje: "ID no válido" });
            return;
        }

        const repo = repositorio();
        const compra = await repo.findOneBy({ idCompra: id });

        if (!compra) {
            res.status(404).json({ mensaje: "Compra no encontrada" });
            return;
        }

        if (req.body.idProveedor !== undefined) {
            const idProveedor = Number(req.body.idProveedor);
            if (!Number.isInteger(idProveedor) || idProveedor <= 0) {
                res.status(400).json({ mensaje: "idProveedor no válido" });
                return;
            }
            compra.idProveedor = idProveedor;
        }

        if (req.body.numFactura !== undefined) {
            if (typeof req.body.numFactura !== "string" || !req.body.numFactura.trim()) {
                res.status(400).json({ mensaje: "El número de factura es obligatorio" });
                return;
            }
            compra.numFactura = req.body.numFactura.trim();
        }

        if (req.body.fecha !== undefined) {
            if (typeof req.body.fecha !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(req.body.fecha)) {
                res.status(400).json({ mensaje: "La fecha debe tener formato AAAA-MM-DD" });
                return;
            }
            compra.fecha = req.body.fecha;
        }

        if (req.body.total !== undefined) {
            const total = Number(req.body.total);
            if (!Number.isFinite(total) || total < 0) {
                res.status(400).json({ mensaje: "El total debe ser igual o mayor que cero" });
                return;
            }
            compra.total = total.toFixed(2);
        }

        res.json(await repo.save(compra));
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al actualizar compra. Verifica el proveedor." });
    }
}

export async function eliminarCompra(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            res.status(400).json({ mensaje: "ID no válido" });
            return;
        }

        const repo = repositorio();
        const compra = await repo.findOneBy({ idCompra: id });

        if (!compra) {
            res.status(404).json({ mensaje: "Compra no encontrada" });
            return;
        }

        await repo.remove(compra);
        res.json({ mensaje: "Compra eliminada correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al eliminar compra" });
    }
}
