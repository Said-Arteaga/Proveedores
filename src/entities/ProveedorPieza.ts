import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn
} from "typeorm";

import { Proveedor } from "./Proveedor";
import { Pieza } from "./Pieza";

@Entity({ name: "ProveedorPieza" })
export class ProveedorPieza {
    @PrimaryColumn({ name: "IdProveedor", type: "int" })
    idProveedor!: number;

    @PrimaryColumn({ name: "IdPieza", type: "int" })
    idPieza!: number;

    @Column({ name: "Precio", type: "decimal", precision: 12, scale: 2 })
    precio!: string;

    @Column({ name: "Fecha", type: "date" })
    fecha!: string;

    @ManyToOne(() => Proveedor, (proveedor) => proveedor.piezasOfrecidas, {
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    })
    @JoinColumn({ name: "IdProveedor", referencedColumnName: "idProveedor" })
    proveedor!: Proveedor;

    @ManyToOne(() => Pieza, (pieza) => pieza.proveedores, {
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    })
    @JoinColumn({ name: "IdPieza", referencedColumnName: "idPieza" })
    pieza!: Pieza;
}