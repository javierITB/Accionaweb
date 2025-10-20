const express = require("express");
const fs = require("fs");
const path = require("path");
const docx = require("docx");
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType } = docx;

// Función auxiliar para formatear fecha
function formatearFechaEspanol(fechaIso) {
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const d = new Date(fechaIso);
    return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

// Diccionario de ordinales
const ORDINALES = ["", "PRIMERO:", "SEGUNDO:", "TERCERO:", "CUARTO:", "QUINTO:", "SEXTO:", "SÉPTIMO:", "OCTAVO:", "NOVENO:", "DÉCIMO:"];

// Diccionarios de empresas
const rutEmpresas = {
    "AGUAS": "65.110.913-2",
    "CORDERO": "77.039.974-2",
    "MCC": "76.887.205-8",
    "YIREHPAL": "76.422.314-4",
    "AZOCAR": "76.084.474-8",
    "DINSIDE": "76.697.693-K",
    "FERDINAND": "77.577.628-5",
    "GREEN BUSINESS": "77.123.226-4",
    "GROW": "76.875.644-9",
    "AGUSTIN": "77.328.293-5",
    "SANTA MARIA": "76.397.289-5",
    "PLAN D": "76.155.283-K",
    "ODONTOLOGIA": "77.570.852-2",
    "YINET": "76.993.230-5",
    "RYS": "77.315.309-4",
    "EMBRY": "78.330.870-3",
    "SANDOVAL": "77.420.334-6",
    "SIENTEVITAL": "77.489.147-1",
    "SOCOTEC": "76.373.078-6",
    "SYNIXTOR": "76.696.743-4",
    "ALTO LOS ANDES": "77.680.543-2",
    "MVP": "76.974.777-K",
    "ICEGCLINIC": "77.126.237-6",
    "LSOFT": "76.815.534-8",
    "RANIA": "77.919.204-0",
    "PIDA": "77.851.576-8",
    "KAMI": "77.947.515-8",
    "BRUTAL": "77.975.744-7",
    "GREENACTION": "77.894.212-7",
    "AZUCCA": "77.933.997-1",
    "HOME": "77.292.823-8",
    "SANTA ELOISA": "78.144.149-K"
};

const nombreEmpresa = {
    "77.975.065-5": "F & M ODONTOLOGIC MEDICAL SPA",
    "77.947.515-8": "MINIMRKET KAMI 2024 SPA",
    "77.975.744-7": "BRUTAL STUDIO CHILE SPA",
    "77.397.128-5": "PRESTACIONES MÉDICAS CASTRO & SELMA LIMITADA",
    "77.933.997-1": "AZZUCA SPA",
    "78.055.137-2": "JANUSNET SPA",
    "78.083.288-6": "FLIPPKO SPA",
    "78.153.281-9": "GCU ATENCIONES SPA",
    "78.144.149-K": "SANTA ELOISA SPA",
    "77.924.401-6": "IMPORTADORA OUSTO COSMETIC CHILE SPA",
    "76.373.078-6": "SOCIEDAD COMERCIAL TECNOLOGICA LIMITADA",
    "76.778.293-4": "ACCIONA CENTRO DE NEGOCIOS SPA",
    "76.687.921-7": "JMCIA CONSTRUCCIONES SPA",
    "76.678.453-4": "BORDADOS AMG SPA",
    "76.867.785-9": "DH HILOS SPA",
    "76.887.205-8": "ARIDOS MCC SPA",
    "76.275.709-5": "SERVICIOS Y ASESORIAS DE ATENCION INTEGRAL LIMITAD",
    "76.974.777-K": "CORPORACIÓN MVP SPA",
    "78.330.870-3": "SERVICIO DE MANTENCION DE VEHICULOS EMBRY LIMITADA",
    "76.993.230-5": "PELUQUERÍA YINET DÍAZ E.I.R.L.",
    "76.493.699-K": "OPENZ EXPERIENCIA CONSULTORES SPA",
    "77.039.974-2": "SOCIEDAD ARIDOS CORDERO SPA",
    "76.875.644-9": "GROW GREEN CHILE SPA",
    "76.084.474-8": "COMERCIAL YIREHPAL LIMITADA",
    "76.926.747-6": "CENTRO CLINICO EDUCATIVO CRECE SPA",
    "77.032.053-4": "COMERCIALIZADORA Y DISTRIBUIDORA LOOK & GLOW SPA",
    "76.697.693-K": "DINSIDE SPA",
    "76.155.283-K": "INVERSIONES Y ASESORIAS PLAN D SPA",
    "76.084.487-K": "TRANSPORTE YIREHPAL LIMITADA",
    "77.123.226-4": "GREEN BUSINESS CHILE SPA",
    "76.743.599-1": "SOCIEDAD DE INVERSIONES COMERCIALIZADORA R Y V SPA",
    "77.292.823-8": "HOME STYLE SPA",
    "77.197.781-2": "DISTRIBUIDORA V Y R SPA",
    "77.413.001-2": "COMERCIALIZADORA JKA SPA",
    "76.397.289-5": "INVERSIONES SANTA MARIA SPA",
    "77.328.293-5": "INVERSIONES SAN AGUSTÍN SPA",
    "77.489.147-1": "SIENTE VITAL SPA",
    "77.515.709-7": "IRON WORLD SERVICES INGENIERIA SPA",
    "76.746.098-8": "COMERCIALIZADORA LD SPA",
    "77.570.852-2": "J & P MEDICAL SPA",
    "77.420.334-6": "SERVICIOS PROFESIONALES DE SALUD CAROLINA SANDOVAL SALINAS E.I.R.L.",
    "76.815.534-8": "LSOFT SERVICIOS INFORMÁTICOS SPA",
    "77.625.197-6": "GOLD GREEN SPA",
    "77.577.628-5": "FERDINAND CLAUSEN & ASOCIADOS SPA",
    "77.315.309-4": "RYS SEGURIDAD Y VIGILANCIA CHILE SPA",
    "77.680.543-2": "CLINICA DENTAL ALTO LOS ANDES SPA",
    "76.696.743-4": "SYNIXTOR CHILE SPA",
    "77.126.237-6": "ICEGCLINIC SPA",
    "77.851.576-8": "PIDA 2024 SPA",
    "77.894.212-7": "GREENACTIO ENVIRO SPA",
    "77.926.019-4": "COMERCIALIZADORA DYM",
    "77.919.204-0": "VENTA DE PRODUCTOS Y MINIMARKET RANIA ZEIDAN ABDUL E.I.R.L.",
    "77.879.121-8": "SERVICIOS DE MARKETING LABIFY SPA",
    "65.110.913-2": "AGUAS PARA SANIDAD"
};

// Función para mapear datos del formulario según las etiquetas exactas
function mapearDatosFormulario(responses) {
    console.log("=== CAMPOS DISPONIBLES EN RESPONSES ===");
    Object.keys(responses).forEach(key => {
        console.log(`"${key}":`, responses[key]);
    });

    // MAPEO CORREGIDO - usa los nombres EXACTOS de tu formulario
    const datosMapeados = {
        // EMPRESA - múltiples alternativas
        empresa: responses["Nombre de la Empresa solicitante:"] ||
            responses["Nombre del responsable de la empresa:"] ||
            "[EMPRESA NO ESPECIFICADA]",

        // TRABAJADOR
        trabajador: responses["Nombre del trabajador:"] || "[TRABAJADOR NO ESPECIFICADO]",
        rut_trabajador: responses["Rut del trabajador:"] || "",

        // FECHAS
        fecha_inicio: responses["Fecha de inicio de modificación:"] || "",
        fecha_contrato: responses["Fecha del contrato vigente:"] || "",
        termino_contrato: responses["FECHA DE TÉRMINO DEL CONTRATADO FIJO:"] || "",

        // TIPO DE CONTRATO Y CARGO
        tipo_contrato: Array.isArray(responses["Tipo de Anexo:"]) ?
            responses["Tipo de Anexo:"] :
            [responses["Tipo de Anexo:"]].filter(Boolean),
        nuevo_cargo: responses["NUEVO CARGO DEL TRABAJADOR"] || "",

        // REMUNERACIONES
        sueldo: responses["MONTO DEL NUEVO SUELDO:"] || "",
        colacion: responses["MONTO DE NUEVA ASIGNACIÓN DE COLACIÓN:"] || "",
        movilizacion: responses["MONTO DE NUEVA ASIGNACIÓN DE MOVILIZACIÓN:"] || "",

        // HORARIOS
        hora_ingreso: responses["HORA DE INGRESO DE JORNADA LABORAL:"] || "",
        hora_salida: responses["HORA DE SALIDA DE JORNADA LABORAL:"] || "",
        hora_ingreso_colacion: responses["HORA DE INGRESO COLACIÓN:"] || "",
        hora_salida_colacion: responses["HORA DE SALIDA COLACIÓN:"] || "",

        // BONOS
        bonos: responses["PERIODO:"] || "",
        nombre_bono: responses["NOMBRE DEL BONO:"] || "",
        monto: responses["MONTO DEL BONO:"] || "",
        condiciado: responses["CONDICIONADO:"] || "",

        // DOMICILIO Y CONTACTO
        local: responses["CAMBIO DE DOMICILIO LABORAL DEL TRABAJADOR:"] || "",
        nuevo_domicilio: responses["NUEVO DOMICILIO TRABAJADOR:"] || "",
        telefono: responses["NUEVO NÚMERO DE TELÉFONO TRABAJADOR:"] || "",
        correo: responses["NUEVO CORREO TRABAJADOR:"] || "",

        // TURNOS
        doble_turno: responses["DOBLE TURNO:"] || "",
        segundo_turno: responses["SEGUNDO TURNO:"] || "",
        primer_turno: responses["PRIMER TURNO:"] || "",
        un_solo_turno: responses["UN SOLO TURNO:"] || "",

        // COMPENSACIONES
        compensacion: Array.isArray(responses["DÍA DE COMPENSACIÓN"]) ?
            responses["DÍA DE COMPENSACIÓN"] :
            [responses["DÍA DE COMPENSACIÓN"]].filter(Boolean),
        desde: Array.isArray(responses["DESDE"]) ?
            responses["DESDE"] :
            [responses["DESDE"]].filter(Boolean),
        hasta: Array.isArray(responses["HASTA"]) ?
            responses["HASTA"] :
            [responses["HASTA"]].filter(Boolean)
    };

    console.log("=== DATOS MAPEADOS ===");
    console.log(JSON.stringify(datosMapeados, null, 2));

    return datosMapeados;
}

// Array de secciones condicionales en orden
function generarClausulasCondicionales(datos) {
    return [
        {
            condicion: () => datos.local && datos.local.trim() !== "",
            contenido: (agregarModificacion) => {
                agregarModificacion([
                    "Por mutuo acuerdo de las partes involucradas, desde el ",
                    { text: datos.fecha_inicio, bold: true },
                    " ejercerá funciones en local de ",
                    { text: datos.local, bold: true },
                    "."
                ]);
            }
        },
        {
            condicion: () => datos.nuevo_domicilio && datos.nuevo_domicilio.trim() !== "",
            contenido: (agregarModificacion) => {
                agregarModificacion([
                    "A contar del ",
                    { text: datos.fecha_inicio, bold: true },
                    ", su dirección particular es modificada a ",
                    { text: datos.nuevo_domicilio, bold: true },
                    "."
                ]);
            }
        },
        {
            condicion: () => datos.telefono && datos.telefono.trim() !== "",
            contenido: (agregarModificacion) => {
                agregarModificacion([
                    "Número telefónico de contacto actualizado a: ",
                    { text: datos.telefono, bold: true },
                    "."
                ]);
            }
        },
        {
            condicion: () => datos.sueldo && datos.sueldo.trim() !== "",
            contenido: (agregarModificacion) => {
                agregarModificacion([
                    "El empleador se compromete a pagar al trabajador una remuneración mensual de $",
                    { text: datos.sueldo, bold: true },
                    ", monto que ambas partes reconocen y aceptan como sueldo base."
                ]);
            }
        },
        {
            condicion: () => {
                const tipos = Array.isArray(datos.tipo_contrato)
                    ? datos.tipo_contrato
                    : [datos.tipo_contrato].filter(Boolean);
                return tipos.some(tipo => tipo && tipo.toUpperCase().includes("ANEXO INDEFINIDO"));
            },
            contenido: (agregarModificacion) => {
                agregarModificacion([
                    "Desde el ",
                    { text: datos.fecha_inicio, bold: true },
                    ", la duración del contrato se modifica a INDEFINIDO."
                ]);
            }
        },
        {
            condicion: () => {
                const tipos = Array.isArray(datos.tipo_contrato)
                    ? datos.tipo_contrato
                    : [datos.tipo_contrato].filter(Boolean);
                return tipos.some(tipo => tipo && tipo.toUpperCase().includes("RENOVACIÓN CONTRATO PLAZO FIJO"));
            },
            contenido: (agregarModificacion) => {
                agregarModificacion([
                    "Desde el ",
                    { text: datos.fecha_inicio, bold: true },
                    ", el contrato se renueva hasta el ",
                    { text: formatearFechaEspanol(datos.termino_contrato), bold: true },
                    "."
                ]);
            }
        },
        {
            condicion: () => datos.nuevo_cargo && datos.nuevo_cargo.trim() !== "",
            contenido: (agregarModificacion) => {
                agregarModificacion([
                    "Desde el ",
                    { text: datos.fecha_inicio, bold: true },
                    " el nuevo cargo es: ",
                    { text: datos.nuevo_cargo, bold: true },
                    "."
                ]);
            }
        },
        {
            condicion: () => datos.colacion && datos.colacion.trim() !== "",
            contenido: (agregarModificacion) => {
                agregarModificacion([
                    "El empleador pagará al trabajador una asignación mensual de colación equivalente a la suma de $",
                    { text: datos.colacion, bold: true },
                    ", destinada a cubrir gastos de alimentación derivados de la prestación de servicios. El pago de esta asignación será efectuado conjuntamente con las remuneraciones mensuales, sin que su otorgamiento se encuentre condicionado a la realización de tareas específicas o al cumplimiento de obligaciones distintas a las propias del contrato de trabajo."
                ]);
            }
        },
        {
            condicion: () => datos.movilizacion && datos.movilizacion.trim() !== "",
            contenido: (agregarModificacion) => {
                agregarModificacion([
                    "El empleador pagará al trabajador una asignación mensual de movilización equivalente a la suma de $",
                    { text: datos.movilizacion, bold: true },
                    ", destinada a cubrir gastos de alimentación derivados de la prestación de servicios. El pago de esta asignación será efectuado conjuntamente con las remuneraciones mensuales, sin que su otorgamiento se encuentre condicionado a la realización de tareas específicas o al cumplimiento de obligaciones distintas a las propias del contrato de trabajo."
                ]);
            }
        },
        {
            condicion: () => (datos.hora_ingreso && datos.hora_ingreso.trim() !== "") ||
                (datos.hora_salida && datos.hora_salida.trim() !== ""),
            contenido: (agregarModificacion) => {
                const textos = [
                    "A contar del ",
                    { text: datos.fecha_inicio, bold: true },
                    " Horario de trabajo modificado: Desde "
                ];

                if (datos.hora_ingreso) {
                    textos.push({ text: `las ${datos.hora_ingreso} hrs.`, bold: true });
                } else {
                    textos.push("horario actual");
                }

                textos.push(" hasta ");

                if (datos.hora_salida) {
                    textos.push({ text: `las ${datos.hora_salida} hrs.`, bold: true });
                } else {
                    textos.push("horario actual.");
                }

                agregarModificacion(textos);
            }
        },
        {
            condicion: () => datos.bonos && datos.bonos.trim() !== "",
            contenido: (agregarModificacion) => {
                const textos = [
                    "El empleador pagará al trabajador un bono ",
                    { text: datos.nombre_bono || "", bold: true },
                    " con temporalidad: ",
                    { text: datos.bonos, bold: true },
                    " con un valor de $",
                    { text: datos.monto || "", bold: true },
                    "."
                ];

                if (datos.condiciado) {
                    textos.push(` bajo la siguiente condición: ${datos.condiciado}`);
                }

                agregarModificacion(textos);
            }
        },
        {
            condicion: () => datos.doble_turno && datos.doble_turno.toUpperCase() === "SI",
            contenido: (agregarModificacion) => {
                const textos = [];

                if (datos.primer_turno) {
                    textos.push(
                        "Se define como día trabajado para el turno de la primera semana los días: ",
                        { text: datos.primer_turno, bold: true },
                        " en horario de ",
                        { text: datos.desde[0] || "", bold: true },
                        " a ",
                        { text: datos.hasta[0] || "", bold: true },
                        " mientras que se define el día de compensación para el turno de la primera semana el día ",
                        datos.compensacion[0] || "",
                        " En el horario de ",
                        datos.compensacion[1] || "",
                        "."
                    );
                }

                if (datos.segundo_turno) {
                    textos.push(
                        "Se define como día trabajado para el turno de la segunda semana los días: ",
                        { text: datos.segundo_turno, bold: true },
                        " en horario de ",
                        { text: datos.desde[1] || "", bold: true },
                        " a ",
                        { text: datos.hasta[1] || "", bold: true },
                        " mientras que se define el día de compensación para el turno de la segunda semana el día ",
                        datos.compensacion[2] || "",
                        " En el horario de ",
                        datos.compensacion[3] || "",
                        "."
                    );
                }

                if (textos.length > 0) {
                    agregarModificacion(textos);
                }
            }
        },
        {
            condicion: () => datos.un_solo_turno && datos.un_solo_turno.trim() !== "",
            contenido: (agregarModificacion) => {
                agregarModificacion([
                    "Se define como día trabajado para el turno de la primera semana los días: ",
                    { text: datos.un_solo_turno, bold: true },
                    " en horario de ",
                    { text: datos.desde[0] || "", bold: true },
                    " a ",
                    { text: datos.hasta[0] || "", bold: true },
                    " mientras que se define el día de compensación para el turno de la primera semana el día ",
                    datos.compensacion[0] || "",
                    " En el horario de ",
                    datos.compensacion[1] || "",
                    "."
                ]);
            }
        }
    ];
}

// Genera docx desde datos y lo guarda en MongoDB colección docxs
// Genera docx desde datos y lo guarda en MongoDB colección docxs
async function generarAnexo(datos, responseId, db) {
    // VERIFICACIÓN DE CONEXIÓN A BD
    console.log("=== VERIFICANDO CONEXIÓN BD EN generarAnexo ===");
    console.log("db disponible:", !!db);
    console.log("db tipo:", typeof db);

    if (!db) {
        throw new Error("Base de datos no inicializada.");
    }

    if (typeof db.collection !== 'function') {
        throw new Error("db.collection no es una función - conexión inválida");
    }

    // CONFIGURACIÓN DE VARIABLES (mantener igual)
    const ciudad = "PROVIDENCIA";
    const hoy = formatearFechaEspanol(new Date().toISOString().split("T")[0]);
    const trabajador = datos.trabajador || "[NOMBRE DEL TRABAJADOR]";
    let empresa = datos.empresa || "[EMPRESA]";

    let rut = "";
    for (const [palabraClave, rutEmpresa] of Object.entries(rutEmpresas)) {
        if (empresa.toUpperCase().includes(palabraClave) || palabraClave.includes(empresa.toUpperCase())) {
            rut = rutEmpresa;
            for (const [rutEmpresaKey, razonSocial] of Object.entries(nombreEmpresa)) {
                if (rut === rutEmpresaKey) {
                    empresa = razonSocial;
                    break;
                }
            }
            break;
        }
    }

    // PREPARAR TODOS LOS PÁRRAFOS PRIMERO
    const children = [];


    children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
            new TextRun({
                text: "ANEXO DE MODIFICACIÓN Y ACTUALIZACIÓN DE CONTRATO INDIVIDUAL DE TRABAJO",
                bold: true,
                size: 28 // o el tamaño que prefieras
            })
        ]
    }));

    children.push(new Paragraph({ text: "" }));
    children.push(new Paragraph({ text: "" }));
    children.push(new Paragraph({ text: "" }));
    children.push(new Paragraph({ text: "" }));

    // 1. ENCABEZADO
    children.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
            new TextRun(`En ${ciudad} a ${hoy}, entre `),
            new TextRun({ text: `${empresa.toUpperCase()} `, bold: true }),
            new TextRun("y Don(ña) "),
            new TextRun({ text: `${trabajador.toUpperCase()}`, bold: true }),
            new TextRun(`, se conviene modificar el Contrato de Trabajo vigente de fecha ${formatearFechaEspanol(datos.fecha_contrato)} y sus posteriores ANEXOS.`)
        ]
    }));

    children.push(new Paragraph({ text: "" }));
    children.push(new Paragraph({ text: "" }));


    // 2. TÍTULO "MODIFICACIÓN"
    children.push(new Paragraph({
        children: [new TextRun({ text: "MODIFICACIÓN", bold: true })]
    }));

    children.push(new Paragraph({ text: "" }));

    // 3. CLAUSULAS CONDICIONALES
    let modificacionNum = 1;
    function agregarModificacion(textos = []) {
        const ordinal = ORDINALES[modificacionNum] || `${modificacionNum}°`;
        modificacionNum++;

        const paragraphChildren = [new TextRun({ text: ordinal, bold: true })];

        textos.forEach(t => {
            if (typeof t === "string") {
                paragraphChildren.push(new TextRun(t));
            } else {
                paragraphChildren.push(new TextRun({ text: t.text, bold: t.bold || false }));
            }
        });

        children.push(new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: paragraphChildren
        }));
    }

    const clausulasCondicionales = generarClausulasCondicionales(datos);
    clausulasCondicionales.forEach(clausula => {
        if (clausula.condicion()) {
            clausula.contenido(agregarModificacion);
        }
    });

    children.push(new Paragraph({ text: "" }));

    // 4. CLAUSULAS FIJAS
    agregarModificacion([
        "Queda Expresamente convenido que las cláusulas existentes en el contrato de trabajo celebrado por las partes el día ",
        { text: formatearFechaEspanol(datos.fecha_contrato), bold: true },
        " y anexos posteriores, y que no hayan sido objeto de modificación o actualización por este documento, se mantienen plenamente vigentes en todo aquello que no sea contrario o incompatible con lo pactado en este anexo."
    ]);

    agregarModificacion([
        "En expresa conformidad con lo precedentemente estipulado las partes firman el presente anexo en dos ejemplares de idéntico tenor y fecha, declarando el trabajador haber recibido uno de ellos en este acto. El otro queda en los archivos de ",
        { text: empresa.toUpperCase(), bold: true },
        "."
    ]);

    children.push(new Paragraph({ text: "" }));
    children.push(new Paragraph({ text: "" }));
    children.push(new Paragraph({ text: "" }));
    children.push(new Paragraph({ text: "" }));

    // 5. TABLA DE FIRMAS
    children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({ text: "_____________________________", alignment: AlignmentType.CENTER }),
                            new Paragraph({ text: "Empleador / Representante Legal", alignment: AlignmentType.CENTER }),
                            new Paragraph({ text: `RUT: ${rut}`, alignment: AlignmentType.CENTER }),
                            new Paragraph({ text: empresa.toUpperCase(), alignment: AlignmentType.CENTER })
                        ]
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({ text: "_____________________________", alignment: AlignmentType.CENTER }),
                            new Paragraph({ text: "Trabajador", alignment: AlignmentType.CENTER }),
                            new Paragraph({ text: `RUT: ${datos.rut_trabajador}`, alignment: AlignmentType.CENTER }),
                            new Paragraph({ text: trabajador.toUpperCase(), alignment: AlignmentType.CENTER })
                        ]
                    })
                ]
            })
        ]
    }));

    // CREAR DOCUMENTO CON TODOS LOS ELEMENTOS (CORRECTO SEGÚN DOCUMENTACIÓN)
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: children // ← TODOS los elementos aquí
            }
        ]
    });

    // RESTANTE DEL CÓDIGO IGUAL (generar buffer y guardar en BD)
    const buffer = await Packer.toBuffer(doc);

    const IDdoc = `ANEXO_${trabajador.replace(/\s+/g, '_').toUpperCase()}_${Date.now()}`;

    console.log("=== INTENTANDO INSERTAR EN BD ===");
    console.log("IDdoc:", IDdoc);
    console.log("Buffer length:", buffer.length);

    await db.collection('docxs').insertOne({
        IDdoc: IDdoc,
        docxFile: buffer,
        estado: 'pendiente',
        responseId: responseId,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    console.log("✅ DOCX guardado en BD exitosamente");

    return {
        IDdoc: IDdoc,
        buffer: buffer,
        estado: 'pendiente'
    };
}

async function generarAnexoDesdeRespuesta(responses, responseId, db) {
    try {
        // LOG DE VERIFICACIÓN DE BD
        console.log("=== VERIFICANDO BD EN generarAnexoDesdeRespuesta ===");
        console.log("db recibida:", !!db);
        console.log("db tiene collection?:", db && typeof db.collection === 'function');

        const datos = mapearDatosFormulario(responses);
        const resultado = await generarAnexo(datos, responseId, db);
        return resultado;
    } catch (error) {
        console.error('Error en generarAnexoDesdeRespuesta:', error);
        throw error;
    }
}

module.exports = { generarAnexo, generarAnexoDesdeRespuesta };