
import { Router } from "express";
import {
    obtenerPiezas,
    obtenerPiezaPorId,
    crearPieza,
    actualizarPieza,
    eliminarPieza
} from "../controllers/PiezaController";

const router = Router();

router.get("/", obtenerPiezas);
router.get("/:id", obtenerPiezaPorId);
router.post("/", crearPieza);
router.put("/:id", actualizarPieza);
router.delete("/:id", eliminarPieza);

export default router;
