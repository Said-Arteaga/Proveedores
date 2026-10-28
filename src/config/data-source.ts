import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import { Proveedor } from "../entities/Proveedor";
import { Pieza } from "../entities/Pieza";
import { ProveedorPieza } from "../entities/ProveedorPieza";
import { Compra } from "../entities/Compra";
import { PiezaComprada } from "../entities/PiezaComprada";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || "proveedores_db",
    entities: [Proveedor, Pieza, ProveedorPieza, Compra, PiezaComprada],
    synchronize: false,
    logging: true
});
