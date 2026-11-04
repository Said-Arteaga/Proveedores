const form = document.querySelector("#form-proveedor");
const mensaje = document.querySelector("#mensaje-formulario");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    mensaje.textContent = "Guardando proveedor...";

    const proveedor = Object.fromEntries(new FormData(form).entries());

    for (const campo of ["contacto", "direccion", "telefono", "correo", "ciudad", "estado"]) {
        if (proveedor[campo] === "") {
            proveedor[campo] = null;
        }
    }

    for (const campo of ["latitud", "longitud"]) {
        proveedor[campo] = proveedor[campo] === "" ? null : Number(proveedor[campo]);
    }

    try {
        const respuesta = await fetch(form.action, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(proveedor)
        });
        const contentType = respuesta.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            throw new Error(
                "El servidor no respondió desde la API. Abre el formulario en " +
                "http://localhost:3000/frontend/proveedores.html y verifica que el backend esté iniciado."
            );
        }

        const resultado = await respuesta.json();
        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || "No se pudo guardar el proveedor.");
        }

        mensaje.textContent = `Proveedor "${resultado.nombre}" agregado correctamente.`;
        form.reset();
    } catch (error) {
        mensaje.textContent = error instanceof Error
            ? error.message
            : "No se pudo conectar con el servidor.";
    }
});
