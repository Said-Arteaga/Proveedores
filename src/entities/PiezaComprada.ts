
import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn
} from "typeorm";

import { Compra } from "./Compra";
import { Pieza } from "./Pieza";

@Entity({ name: "PiezaComprada" })
export class PiezaComprada {
    @PrimaryColumn({ name: "IdCompra", type: "int" })
    idCompra!: number;

    @PrimaryColumn({ name: "IdPieza", type: "int" })
    idPieza!: number;

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

    @ManyToOne(() => Pieza, (pieza) => pieza.compras, {
        onDelete: "RESTRICT",
        onUpdate: "CASCADE"
    })
    @JoinColumn({ name: "IdPieza", referencedColumnName: "idPieza" })
    pieza!: Pieza;
}
