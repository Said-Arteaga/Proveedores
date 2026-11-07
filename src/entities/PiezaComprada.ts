
import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn
} from "typeorm";

import { Compra } from "./Compra";
import { ProveedorPieza } from "./ProveedorPieza";

@Entity({ name: "piezacomprada" })
export class PiezaComprada {
    @PrimaryColumn({ name: "IdCompra", type: "int" })
    idCompra!: number;

    @PrimaryColumn({ name: "IdPieza", type: "int" })
    idPieza!: number;

    @Column({ name: "IdProveedor", type: "int" })
    idProveedor!: number;

    @Column({ name: "Cantidad", type: "int" })
    cantidad!: number;

    @Column({ name: "SubTotal", type: "decimal", precision: 12, scale: 2 })
    subTotal!: string;

    @ManyToOne(() => Compra, (compra) => compra.piezasCompradas, {
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    })
    @JoinColumn({ name: "IdCompra", referencedColumnName: "idCompra" })
    compra!: Compra;

    @ManyToOne(
        () => ProveedorPieza,
        (proveedorPieza) => proveedorPieza.piezasCompradas,
        {
            onDelete: "RESTRICT",
            onUpdate: "CASCADE"
        }
    )
    @JoinColumn([
        { name: "IdProveedor", referencedColumnName: "idProveedor" },
        { name: "IdPieza", referencedColumnName: "idPieza" }
    ])
    proveedorPieza!: ProveedorPieza;
}
