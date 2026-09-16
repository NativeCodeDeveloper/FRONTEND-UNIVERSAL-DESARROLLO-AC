/**
 * fechas.js
 * Fechas "civiles": las que representan un dia del calendario (fecha de consulta,
 * nacimiento, vencimiento) y no un instante exacto.
 *
 * El backend las entrega como "2026-09-15T00:00:00.000Z". Interpretarlas con
 * `new Date(...)` y leer getDate() las corre un dia hacia atras en cualquier zona
 * con desfase negativo: en America/Santiago (UTC-3) esa cadena es el 14 a las
 * 21:00. Aqui se leen los componentes del texto, sin convertir zona.
 */

/** Partes {anio, mes, dia} de una fecha civil, o null si no se puede leer. */
export function partesFechaCivil(valor) {
  if (!valor) return null;

  const texto = String(valor);
  const coincidencia = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (coincidencia) {
    return {
      anio: Number(coincidencia[1]),
      mes: Number(coincidencia[2]),
      dia: Number(coincidencia[3]),
    };
  }

  // Valores sin forma ISO (Date, timestamp): se usan en hora local.
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;

  return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1, dia: fecha.getDate() };
}

/** "15-09-2026". Devuelve el texto alternativo si la fecha no es legible. */
export function formatearFechaCivil(valor, vacio = "-") {
  const p = partesFechaCivil(valor);
  if (!p) return vacio;

  return `${String(p.dia).padStart(2, "0")}-${String(p.mes).padStart(2, "0")}-${p.anio}`;
}

/** Clave ordenable "2026-09-15"; cadena vacia si no es legible. */
export function claveFechaCivil(valor) {
  const p = partesFechaCivil(valor);
  if (!p) return "";

  return `${p.anio}-${String(p.mes).padStart(2, "0")}-${String(p.dia).padStart(2, "0")}`;
}

/** "Septiembre de 2026" para los encabezados de la linea de tiempo. */
export function mesYAnioCivil(valor) {
  const p = partesFechaCivil(valor);
  if (!p) return "Sin fecha";

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  return `${meses[p.mes - 1]} de ${p.anio}`;
}
