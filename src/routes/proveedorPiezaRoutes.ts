
import { Router } from "express";
import {
    obtenerRelaciones,
    obtenerRelacion,
    crearRelacion,
    actualizarRelacion,
    eliminarRelacion
} from "../controllers/ProveedorPiezaController";

const router = Router();

router.get("/", obtenerRelaciones);
router.get("/:idProveedor/:idPieza", obtenerRelacion);
router.post("/", crearRelacion);
router.put("/:idProveedor/:idPieza", actualizarRelacion);
router.delete("/:idProveedor/:idPieza", eliminarRelacion);

export default router;
