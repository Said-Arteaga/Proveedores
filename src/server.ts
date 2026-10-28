import app from "./app";
import { AppDataSource } from "./config/data-source";

const PORT = 3000;

async function iniciarServidor() {
    try {
        await AppDataSource.initialize();

        console.log("Conexión con MySQL exitosa");

        app.listen(PORT, () => {
            console.log(`Servidor funcionando en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("No se pudo iniciar el servidor:");
        console.error(error);
        process.exitCode = 1;
    }
}

iniciarServidor();
