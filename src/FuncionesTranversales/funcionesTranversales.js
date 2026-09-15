export default function formatearFecha(fecha) {
    if (!fecha) {
        return null;
    }

    const valor = String(fecha).trim();
    const fechaCalendario = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (fechaCalendario) {
        const [, year, month, day] = fechaCalendario;
        return `${year}-${Number(month)}-${Number(day)}`;
    }

    const date = new Date(valor);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1);
    const day = String(date.getDate());
    return `${year}-${month}-${day}`;
}
