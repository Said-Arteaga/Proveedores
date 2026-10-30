import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn
} from "typeorm";

import { Proveedor } from "./Proveedor";
import { PiezaComprada } from "./PiezaComprada";

@Entity({ name: "Compras" })
export class Compra {
    @PrimaryGeneratedColumn({ name: "IdCompra" })
    idCompra!: number;

    @Column({ name: "IdProveedor", type: "int" })
    idProveedor!: number;

    @Column({ name: "NumFactura", type: "varchar", length: 50 })
    numFactura!: string;

    @Column({ name: "Fecha", type: "date" })
    fecha!: string;

    @Column({ name: "Total", type: "decimal", precision: 12, scale: 2 })
    total!: string;

    @ManyToOne(() => Proveedor, (proveedor) => proveedor.compras, {
        onDelete: "RESTRICT",
        onUpdate: "CASCADE"
    })
    @JoinColumn({ name: "IdProveedor", referencedColumnName: "idProveedor" })
    proveedor!: Proveedor;

    @OneToMany(() => PiezaComprada, (piezaComprada) => piezaComprada.compra)
    piezasCompradas!: PiezaComprada[];
}