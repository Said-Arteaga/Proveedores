
import { Router } from "express";
import {
    obtenerPiezasCompradas,
    obtenerPiezaComprada,
    crearPiezaComprada,
    actualizarPiezaComprada,
    eliminarPiezaComprada
} from "../controllers/PiezaCompradaController";

const router = Router();

router.get("/", obtenerPiezasCompradas);
router.get("/:idCompra/:idPieza", obtenerPiezaComprada);
router.post("/", crearPiezaComprada);
router.put("/:idCompra/:idPieza", actualizarPiezaComprada);
router.delete("/:idCompra/:idPieza", eliminarPiezaComprada);

export default router;
