
import { Router } from "express";
import {
    obtenerCompras,
    obtenerCompraPorId,
    crearCompra,
    actualizarCompra,
    eliminarCompra
} from "../controllers/CompraController";

const router = Router();

router.get("/", obtenerCompras);
router.get("/:id", obtenerCompraPorId);
router.post("/", crearCompra);
router.put("/:id", actualizarCompra);
router.delete("/:id", eliminarCompra);

export default router;
