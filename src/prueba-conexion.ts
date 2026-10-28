import { AppDataSource } from "./config/data-source";

AppDataSource.initialize()
    .then(() => {
        console.log("¡Conexión con MySQL exitosa!");
        return AppDataSource.destroy();
    })
    .catch((error) => {
        console.error("Error al conectar con MySQL:");
        console.error(error);
        process.exitCode = 1;
    });
