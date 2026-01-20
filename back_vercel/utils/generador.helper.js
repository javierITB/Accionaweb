const express = require("express");
const fs = require("fs");
const path = require("path");
const docx = require("docx");
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, ImageRun, BorderStyle } = docx;
const { createBlindIndex, decrypt } = require("./seguridad.helper");

// ========== FUNCIONES DE UTILIDAD (MANTENIDAS) ==========

function esCampoDeFecha(nombreVariable) {
    const patronesFecha = [
        'FECHA', 'FECHAS', 'FECHA_', '_FECHA', 'FECHA_DE_', '_FECHA_',
        'INICIO', 'TERMINO', 'FIN', 'VIGENCIA', 'VIGENTE', 'CONTRATO',
        'MODIFICACION', 'ACTUALIZACION', 'RENOVACION', 'COMPROMISO'
    ];

    const nombreUpper = nombreVariable.toUpperCase();
    return patronesFecha.some(patron => nombreUpper.includes(patron));
}

function formatearFechaEspanol(fechaIso) {
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    let d;
    if (fechaIso.includes('T')) {
        d = new Date(fechaIso);
    } else {
        const [year, month, day] = fechaIso.split('-');
        d = new Date(year, month - 1, day);
    }

    if (isNaN(d.getTime())) {
        return fechaIso;
    }

    return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

function generarIdDoc() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `doc_${timestamp}${random}`.toUpperCase();
}

function normalizarNombreVariable(title) {
    if (!title) return '';

    let tag = title.toUpperCase();
    tag = tag.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    tag = tag.replace(/[^A-Z0-9]+/g, '_');
    tag = tag.replace(/^_+|_+$/g, '').replace(/__+/g, '_');
    return tag;
}

const ORDINALES = [
    "", "PRIMERO:", "SEGUNDO:", "TERCERO:", "CUARTO:", "QUINTO:",
    "SEXTO:", "SÉPTIMO:", "OCTAVO:", "NOVENO:", "DÉCIMO:",
    "UNDÉCIMO:", "DUODÉCIMO:", "DÉCIMO TERCERO:", "DÉCIMO CUARTO:",
    "DÉCIMO QUINTO:", "DÉCIMO SEXTO:", "DÉCIMO SÉPTIMO:",
    "DÉCIMO OCTAVO:", "DÉCIMO NOVENO:", "VIGÉSIMO:"
];

async function obtenerEmpresaDesdeBD(nombreEmpresa, db) {
    try {
        console.log("=== BUSCANDO EMPRESA EN BD ===");

        if (!db || typeof db.collection !== 'function') {
            throw new Error("Base de datos no disponible");
        }

        const nombreIndex = createBlindIndex(nombreEmpresa);

        const empresa = await db.collection('empresas').findOne({
            nombre_index: nombreIndex
        });

        if (empresa) {
            console.log("Empresa encontrada en BD por índice");

            const empresaDescifrada = {
                nombre: decrypt(empresa.nombre),
                rut: decrypt(empresa.rut),
                encargado: decrypt(empresa.encargado),
                direccion: decrypt(empresa.direccion),
                rut_encargado: decrypt(empresa.rut_encargado),
                logo: empresa.logo // Mantener el logo tal cual (puede estar cifrado)
            };

            return empresaDescifrada;
        }

        return null;

    } catch (error) {
        console.error('Error buscando empresa en BD:', error);
        return null;
    }
}

function crearLogoImagen(logoData) {
    if (!logoData || !logoData.fileData) {
        console.log('No hay logo data o fileData');
        return null;
    }

    try {
        console.log('Procesando logo para DOCX...');
        

        let imageBuffer;

        // CASO 1: FileData está cifrado (string con ':')
        if (typeof logoData.fileData === 'string' && logoData.fileData.includes(':')) {
            console.log('Logo está cifrado, descifrando...');
            // Descifrar para obtener el Base64 original
            const base64Descifrado = decrypt(logoData.fileData);

            // Verificar que sea Base64 válido
            if (!/^[A-Za-z0-9+/]+=*$/.test(base64Descifrado.substring(0, 100))) {
                console.error('Base64 descifrado no es válido');
                return null;
            }

            // Convertir Base64 a Buffer
            imageBuffer = Buffer.from(base64Descifrado, 'base64');
        }
        // CASO 2: Es un Binary de MongoDB (tiene buffer property)
        else if (logoData.fileData && logoData.fileData.buffer) {
            console.log('Logo es Binary con buffer property');
            imageBuffer = Buffer.from(logoData.fileData.buffer);
        }
        // CASO 3: Es un Buffer directo
        else if (Buffer.isBuffer(logoData.fileData)) {
            console.log('Logo es Buffer directo');
            imageBuffer = logoData.fileData;
        }
        // CASO 4: Es string Base64 sin cifrar
        else if (typeof logoData.fileData === 'string') {
            console.log('Logo es string Base64 sin cifrar');
            // Verificar si es Base64 válido
            if (/^[A-Za-z0-9+/]+=*$/.test(logoData.fileData.substring(0, 100))) {
                imageBuffer = Buffer.from(logoData.fileData, 'base64');
            } else {
                console.error('String no es Base64 válido');
                return null;
            }
        }
        else {
            console.error('Tipo de fileData no reconocido:', typeof logoData.fileData);
            return null;
        }

        if (!imageBuffer || imageBuffer.length === 0) {
            console.error('Buffer de imagen vacío o inválido');
            return null;
        }


        return new ImageRun({
            data: imageBuffer,
            transformation: {
                width: 100,
                height: 100,
            },
            floating: {
                horizontalPosition: {
                    offset: 201440,
                },
                verticalPosition: {
                    offset: 201440,
                },
            }
        });

    } catch (error) {
        console.error('Error creando imagen del logo:', error);
        console.error('Stack:', error.stack);
        return null;
    }
}

// ========== NUEVO SISTEMA DE PLANTILLAS ==========

async function buscarPlantillaPorFormId(formId, db) {
    try {
        console.log("=== BUSCANDO PLANTILLA POR FORMID ===");

        if (!db || typeof db.collection !== 'function') {
            throw new Error("Base de datos no disponible");
        }

        const plantilla = await db.collection('plantillas').findOne({
            formId: formId,
            status: "publicado"
        });

        if (plantilla) {
            console.log("Plantilla encontrada");
            return plantilla;
        } else {
            console.log("No se encontró plantilla");
            return null;
        }
    } catch (error) {
        console.error('Error buscando plantilla:', error);
        return null;
    }
}

async function extraerVariablesDeRespuestas(responses, userData, db) {
    console.log("=== EXTRAYENDO VARIABLES DE RESPUESTAS ===");

    const variables = {};

    Object.keys(responses).forEach(key => {
        if (key === '_contexto') return;

        let valor = responses[key];

        if (Array.isArray(valor)) {
            valor = valor.join(', ');
        }

        if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
            valor = JSON.stringify(valor);
        }

        const nombreVariable = normalizarNombreVariable(key);
        variables[nombreVariable] = valor || '';

    });

    if (userData && userData.empresa) {
        try {

            let nombreEmpresaDescifrado = userData.empresa;

            if (userData.empresa.includes(':')) {
                nombreEmpresaDescifrado = decrypt(userData.empresa);
            }

            const empresaInfo = await obtenerEmpresaDesdeBD(nombreEmpresaDescifrado, db);
            if (empresaInfo) {
                if (!variables[normalizarNombreVariable('Empresa')]) {
                    variables[normalizarNombreVariable('Empresa')] = empresaInfo.nombre;
                }
                if (!variables[normalizarNombreVariable('Nombre empresa')]) {
                    variables[normalizarNombreVariable('Nombre empresa')] = empresaInfo.nombre;
                }
                variables[normalizarNombreVariable('Rut empresa')] = empresaInfo.rut || '';
                variables[normalizarNombreVariable('Encargado empresa')] = empresaInfo.encargado || '';
                variables[normalizarNombreVariable('Rut encargado empresa')] = empresaInfo.rut_encargado || '';
                variables[normalizarNombreVariable('Direccion empresa')] = empresaInfo.direccion || '';

            } else {
                console.log("No se pudo obtener información de la empresa, usando nombre descifrado");
                variables[normalizarNombreVariable('Empresa')] = nombreEmpresaDescifrado;
                variables[normalizarNombreVariable('Nombre empresa')] = nombreEmpresaDescifrado;
            }
        } catch (error) {
            console.error("Error obteniendo información de empresa:", error);
        }
    }

    const hoy = new Date();
    variables['FECHA_ACTUAL'] = formatearFechaEspanol(hoy.toISOString().split("T")[0]);
    variables['HORA_ACTUAL'] = hoy.toLocaleTimeString('es-CL', { timeZone: 'America/Santiago' });

    const unAnio = new Date(hoy); unAnio.setFullYear(hoy.getFullYear() + 1);
    variables['FECHA_ACTUAL_1_ANIO'] = formatearFechaEspanol(unAnio.toISOString().split("T")[0]);

    const seisMeses = new Date(hoy); seisMeses.setMonth(hoy.getMonth() + 6);
    variables['FECHA_ACTUAL_6_MESES'] = formatearFechaEspanol(seisMeses.toISOString().split("T")[0]);

    const unMes = new Date(hoy); unMes.setMonth(hoy.getMonth() + 1);
    variables['FECHA_ACTUAL_1_MES'] = formatearFechaEspanol(unMes.toISOString().split("T")[0]);

    return variables;
}

function evaluarCondicional(conditionalVar, variables) {
    console.log("=== EVALUANDO CONDICIONAL ===");
    

    if (!conditionalVar || conditionalVar.trim() === '') {
        console.log("Condición vacía - SIEMPRE INCLUIR");
        return true;
    }

    if (conditionalVar.includes('||')) {
        const variablesOR = conditionalVar.split('||').map(v => v.trim());
        

        for (const varOR of variablesOR) {
            const varName = varOR.replace(/[{}]/g, '').trim();
            const valor = variables[varName];


            if (valor && valor.toString().trim() !== '') {
                return true;
            }
        }

        console.log("OR: Ninguna variable tiene valor - NO INCLUIR");
        return false;
    }

    if (conditionalVar.includes('<')) {
        const [varPart, textPart] = conditionalVar.split('<').map(part => part.trim());
        const varName = varPart.replace(/[{}]/g, '').trim();
        const textoBuscado = textPart.replace(/"/g, '').trim();

        const valor = variables[varName];

        if (valor && valor.toString().toLowerCase().includes(textoBuscado.toLowerCase())) {
            return true;
        }

        return false;
    }

    if (conditionalVar.includes('=')) {
        const [varPart, valuePart] = conditionalVar.split('=').map(part => part.trim());
        const varName = varPart.replace(/[{}]/g, '').trim();
        const valorEsperado = valuePart.replace(/"/g, '').trim();

        const valorActual = variables[varName];

        if (valorActual && valorActual.toString().trim() === valorEsperado) {
            return true;
        }

        return false;
    }

    const varName = conditionalVar.replace(/[{}]/g, '').trim();
    const valor = variables[varName];

    if (valor && valor.toString().trim() !== '') {
        return true;
    }

    return false;
}

function reemplazarVariablesEnContenido(contenido, variables) {
    console.log("=== REEMPLAZANDO VARIABLES EN CONTENIDO ===");

    let contenidoProcesado = contenido;
    const regex = /{{([^}]+)}}/g;
    let match;

    const textRuns = [];
    let lastIndex = 0;

    while ((match = regex.exec(contenido)) !== null) {
        const variableCompleta = match[0];
        const nombreVariable = match[1].trim();
        const matchIndex = match.index;

        if (matchIndex > lastIndex) {
            const textoNormal = contenido.substring(lastIndex, matchIndex);
            textRuns.push(new TextRun(textoNormal));
        }

        let valor = variables[nombreVariable] || `[${nombreVariable} NO ENCONTRADA]`;

        if (esCampoDeFecha(nombreVariable) && valor && !valor.includes('NO ENCONTRADA')) {
            try {
                const fechaFormateada = formatearFechaEspanol(valor);
                valor = fechaFormateada;
            } catch (error) {
                console.error(`Error formateando fecha ${nombreVariable}:`, error);
            }
        }

        textRuns.push(new TextRun({ text: valor, bold: true }));

        lastIndex = matchIndex + variableCompleta.length;
    }

    if (lastIndex < contenido.length) {
        const textoFinal = contenido.substring(lastIndex);
        textRuns.push(new TextRun(textoFinal));
    }

    return textRuns;
}

function procesarTextoFirma(textoFirma, variables) {
    if (!textoFirma) return '';

    let textoProcesado = textoFirma;
    const regex = /{{([^}]+)}}/g;
    let match;

    while ((match = regex.exec(textoFirma)) !== null) {
        const variableCompleta = match[0];
        const nombreVariable = match[1].trim();

        const valor = variables[nombreVariable] || `[${nombreVariable}]`;
        textoProcesado = textoProcesado.replace(variableCompleta, valor);
    }

    return textoProcesado;
}

async function generarDocumentoDesdePlantilla(responses, responseId, db, plantilla, userData, formTitle) {
    try {
        console.log("=== GENERANDO DOCUMENTO DESDE PLANTILLA ===");
        

        const variables = await extraerVariablesDeRespuestas(responses, userData, db);

        const empresaInfo = await obtenerEmpresaDesdeBD(userData?.empresa || '', db);
        const logo = empresaInfo ? empresaInfo.logo : null;

        const children = [];

        if (logo) {
            const logoImagen = crearLogoImagen(logo);
            if (logoImagen) {
                children.push(new Paragraph({
                    children: [logoImagen]
                }));
                children.push(new Paragraph({ text: "" }));
            }
        }

        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({
                    text: plantilla.documentTitle,
                    bold: true,
                    size: 28
                })
            ]
        }));

        children.push(new Paragraph({ text: "" }));
        children.push(new Paragraph({ text: "" }));

        let contadorClausula = 0;
        const parrafosIncluidos = [];

        for (const parrafo of plantilla.paragraphs) {

            const debeIncluir = evaluarCondicional(parrafo.conditionalVar, variables);

            if (debeIncluir) {
                const contenidoProcesado = reemplazarVariablesEnContenido(parrafo.content, variables);

                if (contadorClausula > 0) {
                    const ordinal = ORDINALES[contadorClausula] || `${contadorClausula}°`;

                    children.push(new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        children: [new TextRun({ text: ordinal, bold: true })],
                        pageBreakBefore: false,
                        keepWithNext: true,
                        keepLines: true
                    }));
                }

                if (Array.isArray(contenidoProcesado)) {
                    children.push(new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        children: contenidoProcesado,
                        pageBreakBefore: false,
                        orphanControl: true,
                        widowControl: true
                    }));
                } else {
                    children.push(new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        children: [new TextRun(contenidoProcesado)],
                        pageBreakBefore: false,
                        orphanControl: true,
                        widowControl: true
                    }));
                }

                children.push(new Paragraph({ text: "" }));
                parrafosIncluidos.push(parrafo.id);
                contadorClausula++;
            } else {
                console.log(`Párrafo omitido por condición`);
            }
        }


        if (plantilla.signature1Text || plantilla.signature2Text) {
            children.push(new Paragraph({ text: "" }));
            children.push(new Paragraph({ text: "" }));
            children.push(new Paragraph({ text: "" }));
            children.push(new Paragraph({ text: "" }));
            children.push(new Paragraph({ text: "" }));
            children.push(new Paragraph({ text: "" }));

            const firma1 = procesarTextoFirma(plantilla.signature1Text, variables);
            const firma2 = procesarTextoFirma(plantilla.signature2Text, variables);

            children.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnWidths: [4000, 4000],
                borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({
                                    text: "_____________________________",
                                    alignment: AlignmentType.CENTER,
                                    pageBreakBefore: false,
                                    keepWithNext: true
                                })]
                            }),
                            new TableCell({
                                children: [new Paragraph({
                                    text: "_____________________________",
                                    alignment: AlignmentType.CENTER,
                                    pageBreakBefore: false,
                                    keepWithNext: true
                                })]
                            })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: firma1.split('\n').map(line =>
                                    new Paragraph({
                                        text: line,
                                        alignment: AlignmentType.CENTER,
                                        pageBreakBefore: false,
                                        keepWithNext: true
                                    })
                                )
                            }),
                            new TableCell({
                                children: firma2.split('\n').map(line =>
                                    new Paragraph({
                                        text: line,
                                        alignment: AlignmentType.CENTER,
                                        pageBreakBefore: false,
                                        keepWithNext: true
                                    })
                                )
                            })
                        ]
                    })
                ]
            }));
        }

        const doc = new Document({
            sections: [
                {
                    properties: {
                        page: {
                            margin: {
                                top: 1440,
                                right: 1440,
                                bottom: 1440,
                                left: 1440,
                            }
                        }
                    },
                    children: children
                }
            ]
        });

        const buffer = await Packer.toBuffer(doc);

        const trabajador = variables['NOMBRE_DEL_TRABAJADOR'] || 'DOCUMENTO';
        const nombreFormulario = formTitle || 'FORMULARIO';

        const fileName = `${limpiarFileName(nombreFormulario)}_${limpiarFileName(trabajador)}`;

        const existingDoc = await db.collection('docxs').findOne({
            responseId: responseId
        });

        let result;
        let IDdoc;

        if (existingDoc) {
            IDdoc = existingDoc.IDdoc;

            result = await db.collection('docxs').updateOne(
                { responseId: responseId },
                {
                    $set: {
                        docxFile: buffer,
                        fileName: fileName,
                        updatedAt: new Date(),
                        tipo: 'docx'
                    }
                }
            );
        } else {
            IDdoc = generarIdDoc();
            result = await db.collection('docxs').insertOne({
                IDdoc: IDdoc,
                docxFile: buffer,
                responseId: responseId,
                tipo: 'docx',
                fileName: fileName,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }


        return {
            IDdoc: IDdoc,
            buffer: buffer,
            tipo: 'docx'
        };

    } catch (error) {
        console.error('Error generando documento desde plantilla:', error);
        throw error;
    }
}

function limpiarFileName(texto) {
    if (typeof texto !== 'string') {
        texto = String(texto || 'documento');
    }

    return texto
        .replace(/ñ/g, 'n')
        .replace(/Ñ/g, 'N')
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u')
        .replace(/Á/g, 'A')
        .replace(/É/g, 'E')
        .replace(/Í/g, 'I')
        .replace(/Ó/g, 'O')
        .replace(/Ú/g, 'U')
        .replace(/ü/g, 'u')
        .replace(/Ü/g, 'U')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s._-]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100)
        .replace(/^_+|_+$/g, '')
        .toUpperCase();
}

function reemplazarVariablesEnContenidoTxt(contenido, variables) {
    console.log("=== REEMPLAZANDO VARIABLES EN CONTENIDO TXT ===");

    const regex = /{{([^}]+)}}/g;
    let match;

    const textRuns = [];
    let lastIndex = 0;

    while ((match = regex.exec(contenido)) !== null) {
        const variableCompleta = match[0];
        const nombreVariable = match[1].trim();
        const matchIndex = match.index;

        if (matchIndex > lastIndex) {
            const textoNormal = contenido.substring(lastIndex, matchIndex);
            textRuns.push(new TextRun(textoNormal));
        }

        let valor = variables[nombreVariable] || `[${nombreVariable} NO ENCONTRADA]`;

        if (esCampoDeFecha(nombreVariable) && valor && !valor.includes('NO ENCONTRADA')) {
            try {
                const fechaFormateada = formatearFechaEspanol(valor);
                valor = fechaFormateada;
            } catch (error) {
                console.error(`Error formateando fecha ${nombreVariable}:`, error);
            }
        }

        textRuns.push(new TextRun({ text: valor, bold: true }));

        lastIndex = matchIndex + variableCompleta.length;
    }

    if (lastIndex < contenido.length) {
        const textoFinal = contenido.substring(lastIndex);
        textRuns.push(new TextRun(textoFinal));
    }

    return textRuns;
}

async function generarDocumentoTxt(responses, responseId, db, formTitle) {
    try {
        console.log("=== GENERANDO DOCUMENTO TXT MEJORADO ===");

        let contenidoTxt = "FORMULARIO - RESPUESTAS\n";
        contenidoTxt += "========================\n\n";

        let index = 1;
        Object.keys(responses).forEach((pregunta) => {
            if (pregunta === '_contexto') return;

            const respuesta = responses[pregunta];

            contenidoTxt += `${index}. ${pregunta}\n`;

            if (Array.isArray(respuesta)) {
                contenidoTxt += `   - ${respuesta.join('\n   - ')}\n\n`;
            } else if (respuesta && typeof respuesta === 'object') {
                contenidoTxt += `   ${JSON.stringify(respuesta, null, 2)}\n\n`;
            } else {
                contenidoTxt += `   ${respuesta || 'Sin respuesta'}\n\n`;
            }
            index++;
        });

        if (responses._contexto) {
            contenidoTxt += "\n--- INFORMACIÓN DE TURNOS DETALLADA ---\n\n";

            Object.keys(responses._contexto).forEach(contexto => {
                contenidoTxt += `TURNO: ${contexto}\n`;

                Object.keys(responses._contexto[contexto]).forEach(pregunta => {
                    const respuesta = responses._contexto[contexto][pregunta];
                    contenidoTxt += `   ${pregunta}: ${respuesta}\n`;
                });
                contenidoTxt += "\n";
            });
        }

        contenidoTxt += `\nGenerado el: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`;

        const buffer = Buffer.from(contenidoTxt, 'utf8');

        const trabajador = responses['NOMBRE_DEL_TRABAJADOR'] || responses['Nombre del trabajador'] || ['NOMBRE DEL TRABAJADOR'] || 'TRABAJADOR';
        const nombreFormulario = formTitle || 'FORMULARIO';
        const fileName = `${limpiarFileName(nombreFormulario)}_${limpiarFileName(trabajador)}`;

        const existingDoc = await db.collection('docxs').findOne({
            responseId: responseId
        });

        let result;
        let IDdoc;

        if (existingDoc) {
            IDdoc = existingDoc.IDdoc;

            result = await db.collection('docxs').updateOne(
                { responseId: responseId },
                {
                    $set: {
                        docxFile: buffer,
                        fileName: fileName,
                        updatedAt: new Date(),
                        tipo: 'txt'
                    }
                }
            );
        } else {
            IDdoc = generarIdDoc();
            result = await db.collection('docxs').insertOne({
                IDdoc: IDdoc,
                docxFile: buffer,
                responseId: responseId,
                tipo: 'txt',
                fileName: fileName,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        console.log("TXT guardado en BD exitosamente");

        return {
            IDdoc: IDdoc,
            buffer: buffer,
            tipo: 'txt'
        };

    } catch (error) {
        console.error('Error generando TXT mejorado:', error);
        throw error;
    }
}

// ========== FUNCIÓN PRINCIPAL ACTUALIZADA ==========

async function generarAnexoDesdeRespuesta(responses, responseId, db, section, userData, formId, formTitle) {
    try {
        console.log("=== INICIANDO GENERACIÓN DE DOCUMENTO ===");
        

        if (!formId) {
            console.log("No se recibió formId - Generando TXT");
            return await generarDocumentoTxt(responses, responseId, db, formTitle);
        }

        const plantilla = await buscarPlantillaPorFormId(formId, db);

        if (plantilla) {
            return await generarDocumentoDesdePlantilla(responses, responseId, db, plantilla, userData, formTitle);
        } else {
            return await generarDocumentoTxt(responses, responseId, db, formTitle);
        }

    } catch (error) {
        console.error('Error en generarAnexoDesdeRespuesta:', error);

        console.log("Fallback a TXT por error");
        return await generarDocumentoTxt(responses, responseId, db);
    }
}

// ========== EXPORTACIONES ==========

module.exports = {
    generarAnexoDesdeRespuesta,
    generarDocumentoTxt,
    buscarPlantillaPorFormId,
    evaluarCondicional,
    reemplazarVariablesEnContenido
};