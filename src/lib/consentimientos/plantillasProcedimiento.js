/* Consentimiento informado por procedimiento (Ley 20.584, art. 14).
 *
 * Estructura exigida por la ley y por el diseño de la plataforma:
 *   - PLANTILLA BASE: texto común (identificación, declaraciones, revocabilidad,
 *     datos personales, firma).
 *   - ANEXO por procedimiento: en qué consiste, riesgos frecuentes y poco
 *     frecuentes, alternativas, contraindicaciones, consecuencias de no
 *     realizarlo y cuidados posteriores. Un consentimiento que no nombra el
 *     procedimiento y sus riesgos no cumple el art. 14.
 *   - VARIABLES de la clínica, el profesional y el paciente.
 *
 * Versionado: el documento firmado guarda el TEXTO RENDERIZADO completo (snapshot)
 * y el código, versión y SHA-256 de cada plantilla usada. Si un texto cambia, se
 * sube la versión aquí y en el backend (tabla documento_plantilla); lo ya
 * firmado conserva lo que el paciente leyó ese día.
 *
 * Revisión: redactado con la legislación vigente a octubre de 2026 y con
 * información clínica general de cada procedimiento. El director técnico de
 * cada centro debe revisarlo y adaptarlo a su práctica antes de usarlo, y el
 * profesional debe agregar en "Observaciones del caso" los riesgos propios del
 * paciente. Formato del cuerpo: igual que textosLegales.js ("## " subtítulo,
 * "- " ítem).
 */

import { ANEXOS_AVANZADOS } from "./plantillasAvanzadas.js";

export const PLANTILLA_BASE = {
  codigo: "consentimiento_base",
  version: 2,
  titulo: "Consentimiento informado",
  cuerpo: `Yo, {{paciente.nombre}}, {{paciente.documento}}{{paciente.representacion}}, declaro que {{profesional.nombre}}{{profesional.rut}}, {{profesional.profesion}}{{profesional.registro}}, de {{empresa.nombre}}, me ha informado en forma clara, comprensible y suficiente sobre el procedimiento {{procedimiento.nombre}}, cuya información se detalla en este documento.

## Declaraciones del paciente
Declaro que:
- Se me explicó en qué consiste el procedimiento, su objetivo y los beneficios que razonablemente se pueden esperar.
- Se me informaron sus riesgos frecuentes y poco frecuentes, las alternativas disponibles y las consecuencias de no realizarlo, conforme al artículo 14 de la Ley N° 20.584.
- Tuve la oportunidad de hacer preguntas y todas fueron respondidas de forma satisfactoria.
- Informé de manera veraz mis antecedentes de salud, alergias, medicamentos que uso, embarazo o lactancia y tratamientos previos. Entiendo que ocultar información puede aumentar los riesgos.
- Comprendo que la respuesta a la atención puede variar entre personas y que no se me ha garantizado un resultado determinado.
- Entiendo que cualquier intervención adicional relevante requiere una explicación y una decisión informada, salvo las medidas urgentes que permita la ley para proteger mi salud.

## Revocación
Sé que puedo rechazar o revocar este consentimiento antes o durante la atención, comunicar que deseo detenerla y recibir información sobre las consecuencias clínicas de mi decisión. Ello no implica perder mi derecho a recibir atención posterior.

## Protección de datos personales
Los datos de este documento y de mi ficha clínica son datos sensibles y serán tratados con reserva para mi atención y las obligaciones legales aplicables, conforme a la Ley N° 19.628 sobre Protección de la Vida Privada y a la Ley N° 20.584. Puedo consultar sobre el tratamiento de mis datos escribiendo a {{empresa.correo}}.

## Autorización
Por lo anterior, en forma libre, voluntaria e informada, autorizo la realización del procedimiento indicado.`,
};

/* ── Anexos ─────────────────────────────────────────────────────────────── */

const ODONTOLOGIA = "Odontología";
const ARMONIZACION = "Armonización facial";

export const ANEXOS_PROCEDIMIENTO = [
  // ── Armonización facial ──────────────────────────────────────────────────
  {
    codigo: "anexo_toxina_botulinica",
    grupo: ARMONIZACION,
    version: 1,
    nombre: "Aplicación de toxina botulínica",
    cuerpo: `## En qué consiste
Inyección de toxina botulínica tipo A en músculos específicos de la cara, con agujas finas, para relajar su contracción y suavizar las arrugas de expresión (frente, entrecejo, patas de gallo u otras zonas indicadas). El efecto aparece entre 3 y 14 días después y dura en promedio entre 3 y 6 meses.

## Riesgos frecuentes
- Dolor leve, enrojecimiento, hinchazón o hematoma en los puntos de inyección.
- Dolor de cabeza transitorio.
- Asimetría leve que puede requerir un ajuste.

## Riesgos poco frecuentes
- Caída transitoria del párpado o de la ceja (ptosis), que se resuelve en semanas.
- Sensación de pesadez en la frente, visión doble o sequedad ocular.
- Reacción alérgica.
- Resultado menor al esperado o ausencia de respuesta.

## Alternativas
Rellenos con ácido hialurónico, tratamientos de superficie de la piel (peeling, láser) o no realizar el tratamiento.

## Contraindicaciones
Embarazo y lactancia, enfermedades neuromusculares (miastenia gravis, síndrome de Eaton-Lambert), infección activa en la zona y alergia a la toxina o a la albúmina.

## Si no se realiza
Las arrugas de expresión siguen su evolución natural. No hay consecuencias para la salud.

## Cuidados posteriores
No acostarse ni masajear la zona durante 4 horas, evitar ejercicio intenso, calor y alcohol por 24 horas, y asistir al control indicado.`,
  },
  {
    codigo: "anexo_acido_hialuronico",
    grupo: ARMONIZACION,
    version: 1,
    nombre: "Relleno con ácido hialurónico",
    cuerpo: `## En qué consiste
Inyección de ácido hialurónico, sustancia reabsorbible, en zonas como labios, surcos, pómulos, mentón, mandíbula u ojeras, para dar volumen, contorno o hidratación. El efecto es inmediato y dura en promedio entre 6 y 18 meses según la zona y el producto.

## Riesgos frecuentes
- Hinchazón, enrojecimiento, dolor y hematomas por varios días.
- Pequeños nódulos o irregularidades palpables, que suelen mejorar con masaje o con el tiempo.
- Asimetría.

## Riesgos poco frecuentes
- Infección o reacción inflamatoria tardía.
- Reactivación de herpes labial.
- Coloración azulada bajo la piel (efecto Tyndall).
- Oclusión vascular: el producto puede comprimir u obstruir un vaso sanguíneo y producir daño de la piel (necrosis) y, de forma excepcional, alteraciones de la visión. Es una urgencia: si nota dolor intenso, palidez o manchas en la piel, o cambios en la visión, debe avisar de inmediato. El ácido hialurónico puede disolverse con hialuronidasa.

## Alternativas
Bioestimuladores de colágeno, injerto de grasa, cirugía o no realizar el tratamiento.

## Contraindicaciones
Embarazo y lactancia, infección activa en la zona, enfermedades autoinmunes no controladas, tendencia a cicatrización anómala y alergia conocida al producto o a la lidocaína.

## Si no se realiza
Se mantiene la condición actual. No hay consecuencias para la salud.

## Cuidados posteriores
Frío local las primeras horas, evitar maquillaje por 12 horas, y calor intenso, sauna y ejercicio por 48 horas. No masajear salvo indicación.`,
  },
  {
    codigo: "anexo_bioestimuladores",
    grupo: ARMONIZACION,
    version: 1,
    nombre: "Bioestimuladores de colágeno",
    cuerpo: `## En qué consiste
Inyección de sustancias como hidroxiapatita de calcio o ácido poli-L-láctico que estimulan la producción de colágeno propio, para mejorar firmeza, flacidez y calidad de la piel. El resultado es progresivo, se aprecia entre 1 y 3 meses y puede requerir varias sesiones.

## Riesgos frecuentes
- Hinchazón, enrojecimiento, dolor y hematomas transitorios.
- Sensibilidad en la zona por algunos días.

## Riesgos poco frecuentes
- Nódulos o granulomas palpables o visibles, que pueden aparecer meses después y requerir tratamiento.
- Infección.
- Oclusión vascular con daño de la piel; de forma excepcional, alteraciones visuales. A diferencia del ácido hialurónico, estos productos no se pueden disolver.
- Resultado menor al esperado.

## Alternativas
Rellenos con ácido hialurónico, tecnologías de radiofrecuencia o ultrasonido, cirugía o no realizar el tratamiento.

## Contraindicaciones
Embarazo y lactancia, infección activa, enfermedades autoinmunes no controladas y antecedente de cicatrización anómala.

## Si no se realiza
La piel sigue su envejecimiento natural. No hay consecuencias para la salud.

## Cuidados posteriores
Masaje según la indicación del profesional (en el caso del ácido poli-L-láctico, habitualmente 5 minutos, 5 veces al día, por 5 días) y evitar calor intenso por 48 horas.`,
  },
  {
    codigo: "anexo_hilos_tensores",
    grupo: ARMONIZACION,
    version: 1,
    nombre: "Hilos tensores reabsorbibles",
    cuerpo: `## En qué consiste
Inserción bajo la piel, con cánula o aguja, de hilos reabsorbibles (polidioxanona u otros) para reposicionar tejidos y estimular colágeno en zonas con flacidez. Los hilos se reabsorben en meses y el efecto puede durar entre 6 y 18 meses.

## Riesgos frecuentes
- Hinchazón, hematomas y dolor por varios días.
- Irregularidades u hoyuelos en la piel, que suelen corregirse solos.
- Molestia al abrir la boca o al gesticular durante los primeros días.

## Riesgos poco frecuentes
- Infección, que puede requerir antibióticos o retirar el hilo.
- Asomo o palpación del hilo bajo la piel.
- Asimetría o resultado menor al esperado.
- Lesión de nervios o glándulas, generalmente transitoria.

## Alternativas
Bioestimuladores, rellenos, tecnologías de tensado no invasivas, cirugía o no realizar el tratamiento.

## Contraindicaciones
Embarazo y lactancia, infección activa, trastornos de coagulación, enfermedades autoinmunes no controladas y tendencia a cicatrización anómala.

## Si no se realiza
La flacidez sigue su evolución natural. No hay consecuencias para la salud.

## Cuidados posteriores
Evitar gesticulación exagerada, masajes faciales, tratamientos dentales prolongados y ejercicio intenso por 2 a 3 semanas. Dormir boca arriba la primera semana.`,
  },
  {
    codigo: "anexo_skinbooster_mesoterapia",
    grupo: ARMONIZACION,
    version: 1,
    nombre: "Skinbooster y mesoterapia facial",
    cuerpo: `## En qué consiste
Microinyecciones superficiales de ácido hialurónico no reticulado, vitaminas, aminoácidos u otros activos para mejorar hidratación, luminosidad y textura de la piel. Habitualmente requiere varias sesiones.

## Riesgos frecuentes
- Pequeñas pápulas en los puntos de inyección por 24 a 72 horas.
- Enrojecimiento, hinchazón y hematomas leves.

## Riesgos poco frecuentes
- Infección.
- Reacción alérgica.
- Reactivación de herpes.
- Nódulos persistentes.

## Alternativas
Tratamientos tópicos, peeling, láser o no realizar el tratamiento.

## Contraindicaciones
Embarazo y lactancia, infección o herpes activo en la zona y alergia a los componentes.

## Si no se realiza
No hay consecuencias para la salud.

## Cuidados posteriores
No maquillarse por 12 horas y evitar sol directo, sauna y ejercicio intenso por 48 horas. Usar protector solar.`,
  },
  {
    codigo: "anexo_peeling_quimico",
    grupo: ARMONIZACION,
    version: 1,
    nombre: "Peeling químico",
    cuerpo: `## En qué consiste
Aplicación de uno o más agentes químicos sobre la piel para producir una exfoliación controlada, con el fin de mejorar manchas, textura, acné o fotoenvejecimiento. Según su profundidad puede producir descamación por varios días.

## Riesgos frecuentes
- Ardor y enrojecimiento durante y después de la aplicación.
- Descamación y sensibilidad por varios días.

## Riesgos poco frecuentes
- Manchas oscuras (hiperpigmentación) o claras (hipopigmentación), más probables en fototipos altos o con exposición solar.
- Infección o reactivación de herpes.
- Cicatrices, de forma excepcional.

## Alternativas
Tratamientos tópicos, láser, microdermoabrasión o no realizar el tratamiento.

## Contraindicaciones
Embarazo y lactancia, uso reciente de isotretinoína, herpes o heridas activas en la zona y exposición solar intensa reciente o prevista.

## Si no se realiza
No hay consecuencias para la salud.

## Cuidados posteriores
No arrancar la piel que se descama, hidratar según indicación y usar protector solar de amplio espectro de forma estricta.`,
  },
  {
    codigo: "anexo_lipolisis_inyectable",
    grupo: ARMONIZACION,
    version: 1,
    nombre: "Lipólisis inyectable (papada u otras zonas)",
    cuerpo: `## En qué consiste
Inyección de sustancias lipolíticas, como el ácido deoxicólico, en depósitos localizados de grasa (por ejemplo, la papada) para reducir su volumen. Suele requerir entre 2 y 4 sesiones separadas por algunas semanas.

## Riesgos frecuentes
- Hinchazón marcada, enrojecimiento, dolor y endurecimiento de la zona por varios días.
- Hematomas y adormecimiento transitorio.

## Riesgos poco frecuentes
- Lesión transitoria del nervio que mueve la comisura de la boca (sonrisa asimétrica).
- Dificultad para tragar, transitoria.
- Úlcera o daño de la piel, alopecia en la zona y nódulos.

## Alternativas
Cambios de estilo de vida, tecnologías no invasivas de reducción de grasa, liposucción o no realizar el tratamiento.

## Contraindicaciones
Embarazo y lactancia, infección activa en la zona, trastornos de deglución y bocio o patología tiroidea en estudio.

## Si no se realiza
No hay consecuencias para la salud.

## Cuidados posteriores
Frío local, analgesia según indicación y control para evaluar una nueva sesión.`,
  },

  // ── Odontología ──────────────────────────────────────────────────────────
  {
    codigo: "anexo_exodoncia",
    grupo: ODONTOLOGIA,
    version: 2,
    nombre: "Extracción dental (exodoncia)",
    cuerpo: `## En qué consiste
Retiro de una o más piezas dentarias bajo anestesia local. Puede requerir separar la pieza, retirar hueso o suturar. Incluye la extracción de terceros molares (muelas del juicio) cuando corresponda.

## Riesgos frecuentes
- Dolor, inflamación y hematoma por algunos días.
- Sangrado leve las primeras horas.
- Dificultad transitoria para abrir la boca.

## Riesgos poco frecuentes
- Alveolitis (infección o inflamación del alvéolo) con dolor intenso entre el 2° y 4° día.
- Infección.
- Alteración de la sensibilidad del labio, mentón o lengua por cercanía a nervios, generalmente transitoria y excepcionalmente permanente.
- Fractura de raíz o de la pieza, que puede dejar un fragmento.
- Comunicación con el seno maxilar en piezas superiores.
- Daño a piezas vecinas o restauraciones.
- Reacción al anestésico local, palpitaciones transitorias, hematoma o alteración prolongada de la sensibilidad.

## Alternativas
Según el caso: endodoncia, tratamiento periodontal, restauración, controles periódicos o no realizar el tratamiento.

## Si no se realiza
Pueden persistir o aumentar el dolor, la infección y el daño a piezas vecinas o al hueso.

## Cuidados posteriores
Morder la gasa 30 minutos, no escupir ni enjuagar con fuerza ni usar bombilla por 24 horas, no fumar, frío local, dieta blanda y tomar la medicación indicada.`,
  },
  {
    codigo: "anexo_endodoncia",
    grupo: ODONTOLOGIA,
    version: 2,
    nombre: "Tratamiento de conducto (endodoncia)",
    cuerpo: `## En qué consiste
Retiro de la pulpa (nervio) dañada o infectada del interior del diente, limpieza y desinfección de los conductos y su sellado, bajo anestesia local. Puede requerir una o más sesiones y, después, una restauración definitiva o corona.

## Riesgos frecuentes
- Molestia o dolor al masticar por algunos días.
- Sensibilidad de la zona.

## Riesgos poco frecuentes
- Reagudización de la infección o inflamación.
- Fractura de un instrumento dentro del conducto o perforación de la raíz.
- Imposibilidad de tratar conductos muy curvos o calcificados.
- Fractura del diente, más probable si no se restaura a tiempo.
- Fracaso del tratamiento, que puede requerir retratamiento, cirugía o extracción.
- Reacción al anestésico local, palpitaciones transitorias, hematoma o alteración prolongada de la sensibilidad.

## Alternativas
Extracción de la pieza (y luego su reemplazo con implante, puente o prótesis) o no realizar el tratamiento.

## Si no se realiza
La infección puede avanzar, producir dolor, abscesos y pérdida del diente.

## Cuidados posteriores
No masticar con la pieza hasta su restauración definitiva, tomar la medicación indicada y asistir a la restauración final.`,
  },
  {
    codigo: "anexo_implante_dental",
    grupo: ODONTOLOGIA,
    version: 2,
    nombre: "Implante dental",
    cuerpo: `## En qué consiste
Colocación quirúrgica, bajo anestesia local, de un tornillo de titanio u otro material biocompatible en el hueso maxilar o mandibular para reemplazar la raíz de un diente perdido. Tras un período de integración (habitualmente de 3 a 6 meses) se instala la corona o prótesis. Puede requerir injerto de hueso o elevación del seno maxilar.

## Riesgos frecuentes
- Dolor, inflamación y hematoma por algunos días.
- Sangrado leve.

## Riesgos poco frecuentes
- Falta de integración del implante con el hueso, con necesidad de retirarlo.
- Infección (periimplantitis), más probable en fumadores, diabéticos o con higiene deficiente.
- Alteración de la sensibilidad del labio o mentón por cercanía al nervio.
- Comunicación con el seno maxilar o con la cavidad nasal.
- Fractura del implante o de sus componentes a largo plazo.
- Reacción al anestésico local, palpitaciones transitorias, hematoma o alteración prolongada de la sensibilidad.

## Alternativas
Puente fijo, prótesis removible o no reemplazar la pieza.

## Contraindicaciones
Enfermedades no controladas (diabetes, inmunosupresión), tratamiento con bifosfonatos o radioterapia en la zona, consumo intenso de tabaco y embarazo, según evaluación.

## Si no se realiza
Puede haber desplazamiento de piezas vecinas, pérdida de hueso y dificultades para masticar.

## Cuidados posteriores
Dieta blanda, no fumar, higiene cuidadosa, medicación indicada y controles periódicos de por vida.`,
  },
  {
    codigo: "anexo_blanqueamiento",
    grupo: ODONTOLOGIA,
    version: 1,
    nombre: "Blanqueamiento dental",
    cuerpo: `## En qué consiste
Aplicación de agentes aclaradores (peróxido de hidrógeno o de carbamida) sobre los dientes, en clínica, en casa con cubetas o combinado, para aclarar su color. El resultado varía según cada persona y no es permanente.

## Riesgos frecuentes
- Sensibilidad dental durante el tratamiento y algunos días después.
- Irritación transitoria de las encías.

## Riesgos poco frecuentes
- Resultado desigual o menor al esperado.
- Las restauraciones, coronas o carillas no cambian de color y pueden requerir reemplazo para armonizar.

## Alternativas
Limpieza y pulido, carillas o coronas, o no realizar el tratamiento.

## Contraindicaciones
Embarazo y lactancia, caries o enfermedad de encías sin tratar, sensibilidad dental severa y menores de edad, según evaluación.

## Si no se realiza
No hay consecuencias para la salud.

## Cuidados posteriores
Evitar alimentos y bebidas con colorantes (café, té, vino tinto) y tabaco durante el tratamiento y 48 horas después. Usar pasta desensibilizante si se indica.`,
  },
  {
    codigo: "anexo_ortodoncia",
    grupo: ODONTOLOGIA,
    version: 1,
    nombre: "Tratamiento de ortodoncia",
    cuerpo: `## En qué consiste
Corrección de la posición de los dientes y de la mordida mediante aparatos fijos (brackets) o removibles (alineadores), durante un período que habitualmente va de 12 a 36 meses, seguido de una etapa de contención con retenedores.

## Riesgos frecuentes
- Molestias o dolor leve tras cada activación.
- Úlceras o roces en la mucosa.
- Acumulación de placa y mayor riesgo de caries o inflamación de encías si la higiene es deficiente.

## Riesgos poco frecuentes
- Manchas blancas en el esmalte (descalcificación).
- Reabsorción de las raíces.
- Molestias en la articulación temporomandibular.
- Recidiva (los dientes vuelven a moverse) si no se usan los retenedores.
- Duración mayor a la estimada si no se cumplen las indicaciones o los controles.

## Alternativas
Tratamientos restauradores o protésicos, cirugía ortognática en casos indicados o no realizar el tratamiento.

## Si no se realiza
Puede mantenerse o agravarse la mala posición dentaria, con dificultad de higiene, desgaste o problemas de mordida.

## Cuidados posteriores
Higiene rigurosa, evitar alimentos duros o pegajosos, asistir a todos los controles y usar los retenedores según indicación.`,
  },
  {
    codigo: "anexo_periodoncia",
    grupo: ODONTOLOGIA,
    version: 2,
    nombre: "Tratamiento periodontal (destartraje y pulido radicular)",
    cuerpo: `## En qué consiste
Retiro del sarro y la placa bacteriana sobre y bajo la encía, y alisado de las raíces, generalmente bajo anestesia local y en una o más sesiones, para tratar la enfermedad de las encías.

## Riesgos frecuentes
- Sensibilidad dental al frío o al calor por algunas semanas.
- Sangrado y molestia leve de encías.
- Retracción de las encías al desinflamarse, con dientes que se ven más largos o espacios entre ellos.

## Riesgos poco frecuentes
- Movilidad dentaria transitoria.
- Necesidad de cirugía periodontal si la enfermedad no se controla.
- Reacción al anestésico local, palpitaciones transitorias, hematoma o alteración prolongada de la sensibilidad.

## Alternativas
Cirugía periodontal en casos avanzados o no realizar el tratamiento.

## Si no se realiza
La enfermedad periodontal puede avanzar, con pérdida de hueso, movilidad y pérdida de dientes.

## Cuidados posteriores
Higiene diaria con cepillo y elementos interdentales, enjuagues indicados y controles de mantención periódicos.`,
  },
  {
    codigo: "anexo_rehabilitacion_protesis",
    grupo: ODONTOLOGIA,
    version: 1,
    nombre: "Rehabilitación con coronas o prótesis",
    cuerpo: `## En qué consiste
Reemplazo o restauración de dientes mediante coronas, puentes, incrustaciones o prótesis removibles. Puede requerir desgastar dientes, tomar impresiones y usar provisorios durante el tratamiento.

## Riesgos frecuentes
- Sensibilidad dental tras el tallado.
- Período de adaptación a la prótesis, con molestias o roces.

## Riesgos poco frecuentes
- Inflamación de la pulpa que obligue a una endodoncia.
- Descementación, fractura o desgaste de la corona o la prótesis.
- Diferencias de color con los dientes naturales.

## Alternativas
Restauraciones directas, implantes, otro tipo de prótesis o no realizar el tratamiento.

## Si no se realiza
Puede haber fractura o pérdida de dientes debilitados, desplazamiento de piezas y dificultad para masticar.

## Cuidados posteriores
Higiene cuidadosa, evitar morder objetos duros y controles periódicos.`,
  },
  ...ANEXOS_AVANZADOS,
];

export const GRUPOS_PROCEDIMIENTO = [
  ARMONIZACION,
  ODONTOLOGIA,
  "Kinesiología",
  "Psicología",
  "Terapia ocupacional",
  "Estética facial",
  "Depilación",
];

export function anexoPorCodigo(codigo) {
  return ANEXOS_PROCEDIMIENTO.find((a) => a.codigo === codigo) || null;
}

/**
 * Texto completo del consentimiento (base + anexo + observaciones), ya interpolado.
 * Es exactamente lo que se imprime y lo que se guarda como snapshot.
 */
export function renderizarConsentimiento({ anexo, empresa = {}, profesional = {}, paciente = {}, observaciones = "" }) {
  const representacion = paciente.representante?.nombre
    ? `, representado/a por ${paciente.representante.nombre}${paciente.representante.documento ? `, ${paciente.representante.documento}` : ""}, en su calidad de representante legal`
    : "";
  const valores = {
    "paciente.nombre": paciente.nombre || "el/la paciente",
    "paciente.documento": paciente.documento || "",
    "paciente.representacion": representacion,
    "profesional.nombre": profesional.nombre || "el profesional tratante",
    "profesional.rut": profesional.rut ? `, RUT ${profesional.rut}` : "",
    "profesional.profesion": profesional.especialidad || "profesional de la salud",
    "profesional.registro": profesional.registroSis ? `, Reg. Superintendencia de Salud N° ${profesional.registroSis}` : "",
    "empresa.nombre": empresa.empresaNombre || "el centro de salud",
    "empresa.correo": empresa.contactoEmail || "el correo de contacto del centro",
    "procedimiento.nombre": anexo?.nombre || "",
  };
  const interpolar = (texto) => String(texto ?? "").replace(/\{\{\s*([a-z]+\.[a-z]+)\s*\}\}/g, (_, clave) => valores[clave] ?? "");

  // Orden del documento: primero se informa y después se declara y autoriza.
  //   declaración inicial → información del procedimiento (anexo, con sus
  //   subtítulos en "### ") → observaciones del caso → resto de la base.
  const base = interpolar(PLANTILLA_BASE.cuerpo);
  const corte = base.indexOf("\n\n## ");
  const introduccion = corte >= 0 ? base.slice(0, corte) : base;
  const restoBase = corte >= 0 ? base.slice(corte + 2) : "";
  const textoAnexo = anexo
    ? `## Información del procedimiento: ${anexo.nombre}\n\n${interpolar(anexo.cuerpo).replace(/^## /gm, "### ")}`
    : "";
  const textoObservaciones = observaciones.trim()
    ? `## Observaciones del caso\n${observaciones.trim()}`
    : "";
  return [introduccion, textoAnexo, textoObservaciones, restoBase].filter(Boolean).join("\n\n");
}
