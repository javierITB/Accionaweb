const express = require("express");
const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType } = require("docx");

const router = express.Router();

const basePath = process.cwd();
const recursosPath = path.join(basePath, "recursos");
const logosPath = path.join(recursosPath, "Logos");
const outputPath = path.join(basePath, "output");

if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });

const logosEmpresas = {
    "ACCIONA CENTRO DE NEGOCIOS SPA": path.join(logosPath, "ACCIONA.png"),
    "AGUAS PARA SANIDAD": path.join(logosPath, "AGUAS PARA SANIDAD.png"),
    "CLINICA DENTAL ALTO LOS ANDES SPA": path.join(logosPath, "ALTO LOS ANDES.png"),
    "AZZUCA SPA": path.join(logosPath, "AZZUCA.png"),
    "BRUTAL STUDIO CHILE SPA": path.join(logosPath, "BRUTAL.png"),
    "CAPTURA": path.join(logosPath, "Captura.png"),
    "DINSIDE SPA": path.join(logosPath, "dinside.png"),
    "SERVICIO DE MANTENCION DE VEHICULOS EMBRY LIMITADA": path.join(logosPath, "EMBRY.png"),
    "GROW GREEN CHILE SPA": path.join(logosPath, "GROW GREEN.png"),
    "HOME STYLE SPA": path.join(logosPath, "HOME.png"),
    "ICEGCLINIC SPA": path.join(logosPath, "ICEGCLINIC.png"),
    "MINIMRKET KAMI 2024 SPA": path.join(logosPath, "kami-Photoroom.png"),
    "LA DEHESA": path.join(logosPath, "LA DEHESA.png"),
    "COMERCIAL YIREHPAL LIMITADA": path.join(logosPath, "yirehpal.png"),
    "LSOFT SERVICIOS INFORMÁTICOS SPA": path.join(logosPath, "LSOFT.png"),
    "PIDA 2024 SPA": path.join(logosPath, "PIDA.png"),
    "RYS SEGURIDAD Y VIGILANCIA CHILE SPA": path.join(logosPath, "RYS.png"),
    "INVERSIONES SAN AGUSTÍN SPA": path.join(logosPath, "SAN AGUSTIN.png"),
    "INVERSIONES SANTA MARIA SPA": path.join(logosPath, "SANTA MARIA.png"),
    "SIENTE VITAL SPA": path.join(logosPath, "SienteVital.png"),
    "SOCIEDAD COMERCIAL TECNOLOGICA LIMITADA": path.join(logosPath, "SOCOTEC.png"),
    "SYNIXTOR CHILE SPA": path.join(logosPath, "SYNIXTOR.png")
};

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

const ORDINALES = {
    0: "", 1: "PRIMERO:\n", 2: "SEGUNDO:\n", 3: "TERCERO:\n", 4: "CUARTO:\n", 5: "QUINTO:\n",
    6: "SEXTO:\n", 7: "SÉPTIMO:\n", 8: "OCTAVO:\n", 9: "NOVENO:\n", 10: "DÉCIMO:\n",
    11: "DÉCIMO PRIMERO:\n", 12: "DÉCIMO SEGUNDO:\n", 13: "DÉCIMO TERCERO:\n",
    14: "DÉCIMO CUARTO:\n", 15: "DÉCIMO QUINTO:\n", 16: "DÉCIMO SEXTO:\n"
};

function formatearFechaEspanol(fechaIso) {
    const meses = {
        1: "enero", 2: "febrero", 3: "marzo", 4: "abril", 5: "mayo", 6: "junio",
        7: "julio", 8: "agosto", 9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre"
    };
    if (!fechaIso) return "[FECHA NO ESPECIFICADA]";
    try {
        const [year, month, day] = fechaIso.split('-');
        return `${parseInt(day)} de ${meses[parseInt(month)]} de ${year}`;
    } catch (error) {
        return "[FECHA NO VÁLIDA]";
    }
}

function buscarInfoEmpresa(empresaNombre) {
    let rut = null;
    let empresaFinal = empresaNombre;
    for (const [palabraClave, rutEmpresa] of Object.entries(rutEmpresas)) {
        if (empresaNombre.toUpperCase().includes(palabraClave.toUpperCase()) ||
            palabraClave.toUpperCase().includes(empresaNombre.toUpperCase())) {
            if (empresaNombre.length < palabraClave.length) empresaFinal = palabraClave;
            rut = rutEmpresa;
            break;
        }
    }
    if (rut && nombreEmpresa[rut]) empresaFinal = nombreEmpresa[rut];
    let logoPath = null;
    for (const [razonSocial, archivoLogo] of Object.entries(logosEmpresas)) {
        if (razonSocial.toUpperCase().includes(empresaFinal.toUpperCase())) {
            logoPath = archivoLogo;
            break;
        }
    }
    return { rut, empresaFinal, logoPath };
}

async function generarAnexo(datos) {
    // CORRECCIÓN: Crear el documento con la estructura correcta para docx 9.5.1
    const doc = new Document({
        sections: [{
            properties: {},
            children: []
        }]
    });

    const hoy = new Date().toISOString().split('T')[0];
    const ciudad = "PROVIDENCIA";
    const trabajador = datos['Nombre del trabajador:'] || "[NOMBRE DEL TRABAJADOR]";
    let empresa = datos['Nombre de la Empresa solicitante:'] || "[EMPRESA]";
    const fechaInicio = datos['Fecha de inicio de modificaciones:'] || hoy;
    const fechaInicioFormateada = formatearFechaEspanol(fechaInicio);
    const infoEmpresa = buscarInfoEmpresa(empresa);
    if (infoEmpresa.empresaFinal) empresa = infoEmpresa.empresaFinal;

    // Agregar contenido a la primera sección
    const seccion = doc.Sections[0];
    
    // Título
    seccion.addChildElement(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
            new TextRun({ 
                text: "ANEXO DE MODIFICACIÓN Y ACTUALIZACIÓN\nDE CONTRATO INDIVIDUAL DE TRABAJO", 
                bold: true, 
                size: 24 
            })
        ]
    }));

    seccion.addChildElement(new Paragraph({ text: "" }));

    // Introducción
    seccion.addChildElement(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
            new TextRun(`En ${ciudad} a ${formatearFechaEspanol(hoy)}, entre `),
            new TextRun({ text: `${empresa.toUpperCase()} `, bold: true }),
            new TextRun("y Don(ña) "),
            new TextRun({ text: `${trabajador.toUpperCase()}`, bold: true }),
            new TextRun(`, se conviene modificar el Contrato de Trabajo vigente de fecha ${formatearFechaEspanol(datos['Fecha del contrato vigente:'])} y sus posteriores ANEXOS.`)
        ]
    }));

    // Subtítulo MODIFICACIÓN
    seccion.addChildElement(new Paragraph({
        children: [
            new TextRun({ text: "\nMODIFICACIÓN", bold: true, size: 22 })
        ]
    }));

    let modificacionNum = 1;

    function agregarModificacion(textos) {
        const ordinal = ORDINALES[modificacionNum] || `${modificacionNum}°:\n`;
        modificacionNum++;
        const children = [new TextRun({ text: ordinal, bold: true })];
        
        textos.forEach(texto => {
            if (typeof texto === 'string') {
                children.push(new TextRun(texto));
            } else {
                children.push(new TextRun(texto));
            }
        });
        
        seccion.addChildElement(new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: children
        }));
    }

    // Agregar modificaciones según los datos recibidos
    if (datos['CAMBIO DE DOMICILIO LABORAL DEL TRABAJADOR:']) {
        agregarModificacion([
            "Por mutuo acuerdo de las partes involucradas, desde el ",
            { text: fechaInicioFormateada + " ", bold: true },
            "ejercerá funciones en local de ",
            { text: datos['CAMBIO DE DOMICILIO LABORAL DEL TRABAJADOR:'] + ".", bold: true }
        ]);
    }

    if (datos['NUEVO DOMICILIO TRABAJADOR:']) {
        agregarModificacion([
            "A contar del ",
            { text: fechaInicioFormateada, bold: true },
            " 2024, su dirección particular es modificada a ",
            { text: datos['NUEVO DOMICILIO TRABAJADOR:'] + ".", bold: true }
        ]);
    }

    if (datos['NUEVO NÚMERO DE TELÉFONO TRABAJADOR:']) {
        agregarModificacion([
            "Número telefónico de contacto actualizado a: ",
            { text: datos['NUEVO NÚMERO DE TELÉFONO TRABAJADOR:'] + ".", bold: true }
        ]);
    }

    if (datos['MONTO DEL NUEVO SUELDO:']) {
        agregarModificacion([
            "El empleador se compromete a pagar al trabajador una remuneración mensual de $",
            { text: datos['MONTO DEL NUEVO SUELDO:'] + ",", bold: true },
            " monto que ambas partes reconocen y aceptan como sueldo base."
        ]);
    }

    if (datos['Tipo de Anexo:']) {
        const tipo = Array.isArray(datos['Tipo de Anexo:']) ? datos['Tipo de Anexo:'].join(' ') : datos['Tipo de Anexo:'];
        if (tipo.includes("ANEXO INDEFINIDO")) {
            agregarModificacion([
                "Desde el ", { text: fechaInicioFormateada, bold: true }, ", la duración del contrato se modifica a INDEFINIDO."
            ]);
        }
        if (tipo.includes("RENOVACIÓN CONTRATO PLAZO FIJO") && datos['FECHA DE TÉRMINO DEL CONTRATADO FIJO:']) {
            agregarModificacion([
                "Desde el ", { text: fechaInicioFormateada, bold: true }, ", el contrato se renueva hasta el ",
                { text: formatearFechaEspanol(datos['FECHA DE TÉRMINO DEL CONTRATADO FIJO:']) + ".", bold: true }
            ]);
        }
    }

    if (datos['NUEVO CARGO DEL TRABAJADOR']) {
        agregarModificacion([
            "Desde el ", { text: fechaInicioFormateada, bold: true }, " el nuevo cargo es: ",
            { text: datos['NUEVO CARGO DEL TRABAJADOR'] + ".", bold: true }
        ]);
    }

    if (datos['MONTO DE NUEVA ASIGNACIÓN DE COLACIÓN:']) {
        agregarModificacion([
            "El empleador pagará al trabajador una asignación mensual de colación equivalente a la suma de ",
            { text: "$" + datos['MONTO DE NUEVA ASIGNACIÓN DE COLACIÓN:'], bold: true },
            ", destinada a cubrir gastos de alimentación derivados de la prestación de servicios. El pago de esta asignación será efectuado conjuntamente con las remuneraciones mensuales, sin que su otorgamiento se encuentre condicionado a la realización de tareas específicas o al cumplimiento de obligaciones distintas a las propias del contrato de trabajo.\n"
        ]);
    }

    if (datos['MONTO DE NUEVA ASIGNACIÓN DE MOVILIZACIÓN:']) {
        agregarModificacion([
            "El empleador pagará al trabajador una asignación mensual de movilización equivalente a la suma de ",
            { text: "$" + datos['MONTO DE NUEVA ASIGNACIÓN DE MOVILIZACIÓN:'], bold: true },
            ", destinada a cubrir gastos de alimentación derivados de la prestación de servicios. El pago de esta asignación será efectuado conjuntamente con las remuneraciones mensuales, sin que su otorgamiento se encuentre condicionado a la realización de tareas específicas o al cumplimiento de obligaciones distintas a las propias del contrato de trabajo.\n"
        ]);
    }

    if (datos['HORA DE INGRESO DE JORNADA LABORAL:'] || datos['HORA DE SALIDA DE JORNADA LABORAL:']) {
        agregarModificacion([
            "A contar del ", { text: fechaInicioFormateada + " ", bold: true }, "Horario de trabajo modificado: Desde ",
            { text: datos['HORA DE INGRESO DE JORNADA LABORAL:'] ? "las " + datos['HORA DE INGRESO DE JORNADA LABORAL:'] + " hrs." : " horario actual", bold: true },
            " hasta ",
            { text: datos['HORA DE SALIDA DE JORNADA LABORAL:'] ? "las " + datos['HORA DE SALIDA DE JORNADA LABORAL:'] + " hrs." : "horario actual.", bold: true }
        ]);
    }

    if (datos['HORA DE INGRESO COLACIÓN:'] || datos['HORA DE SALIDA COLACIÓN:']) {
        agregarModificacion([
            "A contar del ", { text: fechaInicioFormateada + " ", bold: true }, "Horario de colación modificado Desde ",
            { text: datos['HORA DE INGRESO COLACIÓN:'] ? datos['HORA DE INGRESO COLACIÓN:'] + " hrs." : "horario ingreso colacion actual", bold: true },
            " hasta ",
            { text: datos['HORA DE SALIDA COLACIÓN:'] ? datos['HORA DE SALIDA COLACIÓN:'] + "." : "horario salida colacion actual.", bold: true }
        ]);
    }

    if (datos['NOMBRE DEL BONO:'] && datos['MONTO DEL BONO:']) {
        const textoBono = [
            "El empleador pagará al trabajador un bono ", { text: datos['NOMBRE DEL BONO:'], bold: true },
            " con temporalidad: ", { text: datos['PERIODO:'] || "[NO ESPECIFICADO]", bold: true },
            " con un valor de ", { text: "$" + datos['MONTO DEL BONO:'] + ".", bold: true }
        ];
        if (datos['CONDICIONADO:']) textoBono.push(" bajo la siguiente condicion: " + datos['CONDICIONADO:']);
        agregarModificacion(textoBono);
    }

    if (datos['NUEVO DOMICILIO TRABAJADOR:']) {
        agregarModificacion([
            "(Texto de cláusula para cambio de domicilio particular) ",
            { text: datos['NUEVO DOMICILIO TRABAJADOR:'] + ".", bold: true }
        ]);
    }

    if (datos['NUEVO CORREO TRABAJADOR:']) {
        agregarModificacion([
            "(Texto de cláusula para correo electrónico actualizado) ",
            { text: datos['NUEVO CORREO TRABAJADOR:'] + ".", bold: true }
        ]);
    }

    // Cláusulas finales
    agregarModificacion([
        "Queda Expresamente convenido que las cláusulas existentes en el contrato de trabajo celebrado por las partes el día ",
        { text: formatearFechaEspanol(datos['Fecha del contrato vigente:']), bold: true },
        " y anexos posteriores, y que no hayan sido objeto de modificación o actualización por este documento, se mantienen plenamente vigentes en todo aquello que no sea contrario o incompatible con lo pactado en este anexo."
    ]);

    agregarModificacion([
        "En expresa conformidad con lo precedentemente estipulado las partes firman el presente anexo en dos ejemplares de idéntico tenor y fecha, declarando el trabajador haber recibido uno de ellos en este acto. El otro queda en los archivos de ",
        { text: empresa.toUpperCase() + ".", bold: true }
    ]);

    // Espacio para firmas
    seccion.addChildElement(new Paragraph({ text: "\n\n\n" }));

    // Tabla de firmas
    const tablaFirmas = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [4500, 4500],
        rows: [new TableRow({
            children: [
                new TableCell({
                    children: [
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("_____________________________")] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("Empleador / Representante Legal")] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(`RUT: ${infoEmpresa.rut || "[RUT NO ENCONTRADO]"}`)] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(empresa.toUpperCase())] })
                    ]
                }),
                new TableCell({
                    children: [
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("_____________________________")] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("Trabajador")] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(`RUT: ${datos['Rut del trabajador:'] || "[RUT NO ESPECIFICADO]"}`)] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(trabajador.toUpperCase())] })
                    ]
                })
            ]
        })]
    });

    seccion.addChildElement(tablaFirmas);

    // Generar el documento
    const buffer = await Packer.toBuffer(doc);
    const nombreArchivo = `${trabajador.toUpperCase().replace(/[^A-Z0-9]/g, '_')}.docx`;
    const rutaCompleta = path.join(outputPath, nombreArchivo);
    fs.writeFileSync(rutaCompleta, buffer);
    return rutaCompleta;
}

router.post("/generar-anexo", async (req, res) => {
    try {
        const formData = req.body;
        console.log("Datos recibidos para generar anexo:", formData);
        
        const datosFormulario = formData.responses || formData || {};
        
        if (Object.keys(datosFormulario).length === 0) {
            return res.status(400).json({ 
                error: "No se recibieron datos del formulario" 
            });
        }

        const archivoGenerado = await generarAnexo(datosFormulario);
        
        res.download(archivoGenerado, path.basename(archivoGenerado), (err) => {
            if (err) {
                console.error('Error al descargar el archivo:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: "Error al descargar el documento" });
                }
            }
        });
        
    } catch (error) {
        console.error("Error generando el anexo:", error);
        if (!res.headersSent) {
            res.status(500).json({ 
                error: "Error generando el anexo", 
                detalles: error.message 
            });
        }
    }
});

module.exports = router;