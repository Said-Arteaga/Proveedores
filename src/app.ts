
import express from "express";
import { resolve } from "node:path";

import proveedorRoutes from "./routes/proveedorRoutes";
import piezaRoutes from "./routes/piezaRoutes";
import proveedorPiezaRoutes from "./routes/proveedorPiezaRoutes";
import compraRoutes from "./routes/compraRoutes";
import piezaCompradaRoutes from "./routes/piezaCompradaRoutes";

const app = express();

app.use(express.json());
app.use(
    "/assets",
    express.static(resolve(__dirname, "../frontend/src_/assets"))
);
app.use(
    "/frontend",
    express.static(resolve(__dirname, "../frontend/public"))
);

app.get("/", (_req, res) => {
    res.json({
        mensaje: "Backend de Proveedores funcionando"
    });
});

app.use("/api/proveedores", proveedorRoutes);
app.use("/api/piezas", piezaRoutes);
app.use("/api/proveedor-pieza", proveedorPiezaRoutes);
app.use("/api/compras", compraRoutes);
app.use("/api/pieza-comprada", piezaCompradaRoutes);

app.use("/api", (_req, res) => {
    res.status(404).json({ mensaje: "Ruta de API no encontrada" });
});

export default app;
