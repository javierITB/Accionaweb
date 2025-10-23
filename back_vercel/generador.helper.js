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

// ELIMINAR LOS DICCIONARIOS HARDCODEADOS
// const rutEmpresas = { ... }; ← ELIMINADO
// const nombreEmpresa = { ... }; ← ELIMINADO

// Función para obtener empresa desde MongoDB
async function obtenerEmpresaDesdeBD(nombreEmpresa, db) {
    try {
        console.log("=== BUSCANDO EMPRESA EN BD ===");
        console.log("Nombre empresa buscado:", nombreEmpresa);
        
        if (!db || typeof db.collection !== 'function') {
            throw new Error("Base de datos no disponible");
        }

        // Buscar por nombre (case insensitive)
        const empresa = await db.collection('empresas').findOne({
            nombre: { $regex: new RegExp(nombreEmpresa, 'i') }
        });

        console.log("Empresa encontrada en BD:", empresa);

        if (empresa) {
            return {
                nombre: empresa.nombre,
                rut: empresa.rut
            };
        }

        // Si no se encuentra, buscar por palabras clave en el nombre
        const palabras = nombreEmpresa.toUpperCase().split(' ');
        for (const palabra of palabras) {
            if (palabra.length > 3) { // Solo buscar palabras significativas
                const empresaPorPalabra = await db.collection('empresas').findOne({
                    nombre: { $regex: new RegExp(palabra, 'i') }
                });

                if (empresaPorPalabra) {
                    console.log("Empresa encontrada por palabra clave:", empresaPorPalabra);
                    return {
                        nombre: empresaPorPalabra.nombre,
                        rut: empresaPorPalabra.rut
                    };
                }
            }
        }

        console.log("No se encontró empresa en BD");
        return null;

    } catch (error) {
        console.error('Error buscando empresa en BD:', error);
        return null;
    }
}

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

    // CONFIGURACIÓN DE VARIABLES
    const ciudad = "PROVIDENCIA";
    const hoy = formatearFechaEspanol(new Date().toISOString().split("T")[0]);
    const trabajador = datos.trabajador || "[NOMBRE DEL TRABAJADOR]";
    let empresaInput = datos.empresa || "[EMPRESA]";

    // OBTENER EMPRESA DESDE MONGODB
    let empresaInfo = await obtenerEmpresaDesdeBD(empresaInput, db);
    
    let empresa = empresaInfo ? empresaInfo.nombre : empresaInput.toUpperCase();
    let rut = empresaInfo ? empresaInfo.rut : "";

    console.log("=== INFORMACIÓN DE EMPRESA FINAL ===");
    console.log("Empresa:", empresa);
    console.log("RUT:", rut);

    // PREPARAR TODOS LOS PÁRRAFOS PRIMERO
    const children = [];

    children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
            new TextRun({
                text: "ANEXO DE MODIFICACIÓN Y ACTUALIZACIÓN DE CONTRATO INDIVIDUAL DE TRABAJO",
                bold: true,
                size: 28
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
            new TextRun({ text: `${empresa} `, bold: true }),
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

        const paragraphChildren = [
            new TextRun({ text: ordinal, bold: true }),
            new TextRun({ text: "\n" })
        ];

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
        { text: empresa, bold: true },
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
                            new Paragraph({ text: empresa, alignment: AlignmentType.CENTER })
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

    // CREAR DOCUMENTO
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: children
            }
        ]
    });

    const buffer = await Packer.toBuffer(doc);

    const IDdoc = `ANEXO_${trabajador.replace(/\s+/g, '_').toUpperCase()}_${Date.now()}`;

    console.log("=== INTENTANDO INSERTAR EN BD ===");
    console.log("IDdoc:", IDdoc);
    console.log("Buffer length:", buffer.length);

    await db.collection('docxs').insertOne({
        IDdoc: IDdoc,
        docxFile: buffer,
        responseId: responseId,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    console.log("✅ DOCX guardado en BD exitosamente");

    return {
        IDdoc: IDdoc,
        buffer: buffer,
    };
}

async function generarAnexoDesdeRespuesta(responses, responseId, db) {
    try {
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