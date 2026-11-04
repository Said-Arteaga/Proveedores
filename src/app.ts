
import express from "express";
import path from "node:path";

import proveedorRoutes from "./routes/proveedorRoutes";
import piezaRoutes from "./routes/piezaRoutes";
import proveedorPiezaRoutes from "./routes/proveedorPiezaRoutes";
import compraRoutes from "./routes/compraRoutes";
import piezaCompradaRoutes from "./routes/piezaCompradaRoutes";

const app = express();

app.use(express.json());
app.use("/frontend", express.static(path.resolve(__dirname, "../frontend/public")));
app.use("/assets", express.static(path.resolve(__dirname, "../frontend/src_/assets")));

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

export default app;
