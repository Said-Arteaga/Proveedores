import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany
} from "typeorm";

import { Compra } from "./Compra";
import { ProveedorPieza } from "./ProveedorPieza";

@Entity({ name: "Proveedor" })
export class Proveedor {
    @PrimaryGeneratedColumn({ name: "IdProveedor" })
    idProveedor!: number;

    @Column({ name: "Nombre", type: "varchar", length: 120 })
    nombre!: string;

    @Column({ name: "Contacto", type: "varchar", length: 120, nullable: true })
    contacto!: string | null;

    @Column({ name: "Direccion", type: "varchar", length: 255, nullable: true })
    direccion!: string | null;

    @Column({ name: "Telefono", type: "varchar", length: 20, nullable: true })
    telefono!: string | null;

    @Column({ name: "Correo", type: "varchar", length: 150, nullable: true })
    correo!: string | null;

    @Column({ name: "Latitud", type: "decimal", precision: 10, scale: 7, nullable: true })
    latitud!: number | null;

    @Column({ name: "Longitud", type: "decimal", precision: 10, scale: 7, nullable: true })
    longitud!: number | null;

    @Column({ name: "Ciudad", type: "varchar", length: 100, nullable: true })
    ciudad!: string | null;

    @Column({ name: "Estado", type: "varchar", length: 100, nullable: true })
    estado!: string | null;

    @OneToMany(() => Compra, (compra) => compra.proveedor)
    compras!: Compra[];

    @OneToMany(() => ProveedorPieza, (proveedorPieza) => proveedorPieza.proveedor)
    piezasOfrecidas!: ProveedorPieza[];
}