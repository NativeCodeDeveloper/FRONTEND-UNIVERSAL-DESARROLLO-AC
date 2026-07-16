// Cálculo de "citas próximas" 100% frontend — no depende de un backend de notificaciones.
// Fuente: /reservaPacientes/seleccionarReservados (endpoint que ya existe y se usa en el calendario).

function hoyISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function horaAMinutos(horaStr) {
    const [h, m] = horaStr.split(":").map(Number);
    return h * 60 + m;
}

export function obtenerCitasProximas(reservas, anticipacionMin = 30) {
    if (!Array.isArray(reservas)) return [];

    const hoy = hoyISO();
    const ahora = new Date();
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
    const limite = minutosAhora + anticipacionMin;

    return reservas
        .filter((r) => {
            const fechaReserva = (r.fechaInicio || "").slice(0, 10);
            if (fechaReserva !== hoy) return false;
            if (!r.horaInicio) return false;
            const minutosCita = horaAMinutos(r.horaInicio);
            return minutosCita >= minutosAhora && minutosCita <= limite;
        })
        .map((r) => {
            const nombre = `${r.nombrePaciente ?? ""} ${r.apellidoPaciente ?? ""}`.trim();
            const profesional = r.nombreProfesional ?? "";
            const hora = (r.horaInicio ?? "").slice(0, 5);

            return {
                id: String(r.id_reserva ?? `${r.fechaInicio}${r.horaInicio}`),
                tipo: "recordatorio",
                titulo: "Cita próxima",
                descripcion: `${nombre || "Paciente"} con ${profesional || "profesional"} a las ${hora}`,
                creado_en: new Date().toISOString(),
            };
        });
}

// El SW ya se registra siempre en layout.jsx. Una vez que hay un SW controlando la
// página, muchos navegadores (Chrome/Android en especial) prohíben `new Notification()`
// y tiran "Illegal constructor" — hay que mostrarla vía ServiceWorkerRegistration.
export function mostrarNotificacionNavegador(titulo, opciones = {}) {
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready
            .then((reg) => reg.showNotification(titulo, opciones))
            .catch(() => {
                try { new Notification(titulo, opciones); } catch {}
            });
        return;
    }

    try { new Notification(titulo, opciones); } catch {}
}
