
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany
} from "typeorm";

import { ProveedorPieza } from "./ProveedorPieza";
import { PiezaComprada } from "./PiezaComprada";

@Entity({ name: "Pieza" })
export class Pieza {
    @PrimaryGeneratedColumn({ name: "IdPieza" })
    idPieza!: number;

    @Column({ name: "Nombre", type: "varchar", length: 120 })
    nombre!: string;

    @Column({ name: "Color", type: "varchar", length: 50, nullable: true })
    color!: string | null;

    @Column({ name: "Material", type: "varchar", length: 100, nullable: true })
    material!: string | null;

    @Column({ name: "Dimensiones", type: "varchar", length: 120, nullable: true })
    dimensiones!: string | null;

    @Column({ name: "Descripcion", type: "text", nullable: true })
    descripcion!: string | null;

    @Column({ name: "Categorias", type: "varchar", length: 255, nullable: true })
    categorias!: string | null;

    @OneToMany(() => ProveedorPieza, (proveedorPieza) => proveedorPieza.pieza)
    proveedores!: ProveedorPieza[];

    @OneToMany(() => PiezaComprada, (piezaComprada) => piezaComprada.pieza)
    compras!: PiezaComprada[];
}
