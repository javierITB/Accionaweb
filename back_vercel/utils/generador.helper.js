const express = require("express");
const fs = require("fs");
const path = require("path");
const docx = require("docx");
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, ImageRun, BorderStyle } = docx;

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
    const timestamp = Date.now().toString(36); // Base36 para más corto
    const random = Math.random().toString(36).substring(2, 8); // 6 caracteres random
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
        console.log("Nombre empresa buscado:", nombreEmpresa);

        if (!db || typeof db.collection !== 'function') {
            throw new Error("Base de datos no disponible");
        }

        const empresa = await db.collection('empresas').findOne({
            nombre: { $regex: new RegExp(nombreEmpresa, 'i') }
        });

        console.log("Empresa encontrada en BD:", empresa);

        if (empresa) {
            return {
                nombre: empresa.nombre,
                rut: empresa.rut,
                encargado: empresa.encargado || "", // NUEVO: obtener encargado
                direccion: empresa.direccion || "",
                rut_encargado: empresa.rut_encargado || "", // NUEVO: obtener rut encargado
                logo: empresa.logo
            };
        }

        const palabras = nombreEmpresa.toUpperCase().split(' ');
        for (const palabra of palabras) {
            if (palabra.length > 3) {
                const empresaPorPalabra = await db.collection('empresas').findOne({
                    nombre: { $regex: new RegExp(palabra, 'i') }
                });

                if (empresaPorPalabra) {
                    console.log("Empresa encontrada por palabra clave:", empresaPorPalabra);
                    return {
                        nombre: empresaPorPalabra.nombre,
                        rut: empresaPorPalabra.rut,
                        encargado: empresaPorPalabra.encargado || "", // NUEVO: obtener encargado
                        rut_encargado: empresaPorPalabra.rut_encargado || "", // NUEVO: obtener rut encargado
                        logo: empresaPorPalabra.logo
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

function crearLogoImagen(logoData) {
    if (!logoData || !logoData.fileData) {
        return null;
    }

    try {
        return new ImageRun({
            data: logoData.fileData.buffer,
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
        return null;
    }
}

// ========== NUEVO SISTEMA DE PLANTILLAS ==========

/**
 * Busca plantilla por formId en la colección 'plantillas'
 */
async function buscarPlantillaPorFormId(formId, db) {
    try {
        console.log("=== BUSCANDO PLANTILLA POR FORMID ===");
        console.log("FormId:", formId);

        if (!db || typeof db.collection !== 'function') {
            throw new Error("Base de datos no disponible");
        }

        const plantilla = await db.collection('plantillas').findOne({
            formId: formId,
            status: "publicado"
        });

        if (plantilla) {
            console.log("✅ Plantilla encontrada:", plantilla.documentTitle);
            return plantilla;
        } else {
            console.log("❌ No se encontró plantilla para formId:", formId);
            return null;
        }
    } catch (error) {
        console.error('Error buscando plantilla:', error);
        return null;
    }
}

/**
 * Extrae variables de las respuestas para reemplazo
 */
async function extraerVariablesDeRespuestas(responses, userData, db) {
    console.log("=== EXTRAYENDO VARIABLES DE RESPUESTAS ===");

    const variables = {};

    // 1. PROCESAR SOLO LAS RESPUESTAS DEL FORMULARIO (sin hardcodeo)
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

        console.log(`Variable: "${key}" → "${nombreVariable}" =`, valor);
    });

    // 2. AGREGAR DATOS DE EMPRESA (desde BD) - SIN SOBREESCRIBIR DATOS DEL FORMULARIO
    if (userData.empresa) {
        try {
            const empresaInfo = await obtenerEmpresaDesdeBD(userData.empresa, db);
            if (empresaInfo) {
                // Solo agregar si no existen ya estas variables
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

                console.log("✅ Información empresa obtenida:", {
                    nombre: empresaInfo.nombre,
                    rut: empresaInfo.rut,
                    encargado: empresaInfo.encargado,
                    direccion: empresaInfo.direccion,
                    rut_encargado: empresaInfo.rut_encargado
                });
            }
        } catch (error) {
            console.error("Error obteniendo información de empresa:", error);
        }
    }

    // 3. FECHA ACTUAL (siempre agregar)
    variables['FECHA_ACTUAL'] = formatearFechaEspanol(new Date().toISOString().split("T")[0]);

    console.log("=== VARIABLES EXTRAÍDAS ===");
    console.log("Total variables:", Object.keys(variables).length);
    console.log("Variables disponibles:", Object.keys(variables).sort());

    console.log("🔍 VALORES CLAVE:");
    console.log("NOMBRE_DEL_TRABAJADOR:", variables['NOMBRE_DEL_TRABAJADOR']);
    console.log("EMPRESA:", variables[normalizarNombreVariable('Empresa')]);
    console.log("ENCARGADO_EMPRESA:", variables[normalizarNombreVariable('Encargado empresa')]);
    console.log("DIRECCION_EMPRESA:", variables[normalizarNombreVariable('Direccion empresa')]);
    return variables;
}

/**
 * Evalúa condiciones según los 4 tipos soportados
 */
function evaluarCondicional(conditionalVar, variables) {
    console.log("=== EVALUANDO CONDICIONAL ===");
    console.log("ConditionalVar:", conditionalVar);
    console.log("Variables disponibles:", Object.keys(variables));

    // Caso 1: Sin condición - siempre incluir
    if (!conditionalVar || conditionalVar.trim() === '') {
        console.log("✅ Condición vacía - SIEMPRE INCLUIR");
        return true;
    }

    // Caso 2: Condición OR ({{VAR1}} || {{VAR2}})
    if (conditionalVar.includes('||')) {
        const variablesOR = conditionalVar.split('||').map(v => v.trim());
        console.log("Evaluando OR:", variablesOR);

        for (const varOR of variablesOR) {
            const varName = varOR.replace(/[{}]/g, '').trim();
            const valor = variables[varName];

            console.log(`Verificando ${varName}:`, valor);

            if (valor && valor.toString().trim() !== '') {
                console.log(`✅ OR: ${varName} tiene valor - INCLUIR`);
                return true;
            }
        }

        console.log("❌ OR: Ninguna variable tiene valor - NO INCLUIR");
        return false;
    }

    // Caso 3: Condición Contains ({{VAR}} < "texto")
    if (conditionalVar.includes('<')) {
        const [varPart, textPart] = conditionalVar.split('<').map(part => part.trim());
        const varName = varPart.replace(/[{}]/g, '').trim();
        const textoBuscado = textPart.replace(/"/g, '').trim();

        const valor = variables[varName];
        console.log(`Evaluando CONTAINS: ${varName} contiene "${textoBuscado}"? Valor:`, valor);

        if (valor && valor.toString().toLowerCase().includes(textoBuscado.toLowerCase())) {
            console.log(`✅ CONTAINS: ${varName} contiene "${textoBuscado}" - INCLUIR`);
            return true;
        }

        console.log(`❌ CONTAINS: ${varName} NO contiene "${textoBuscado}" - NO INCLUIR`);
        return false;
    }

    // Caso 4: Condición Equals ({{VAR}} = "valor")
    if (conditionalVar.includes('=')) {
        const [varPart, valuePart] = conditionalVar.split('=').map(part => part.trim());
        const varName = varPart.replace(/[{}]/g, '').trim();
        const valorEsperado = valuePart.replace(/"/g, '').trim();

        const valorActual = variables[varName];
        console.log(`Evaluando EQUALS: ${varName} = "${valorEsperado}"? Valor actual:`, valorActual);

        if (valorActual && valorActual.toString().trim() === valorEsperado) {
            console.log(`✅ EQUALS: ${varName} = "${valorEsperado}" - INCLUIR`);
            return true;
        }

        console.log(`❌ EQUALS: ${varName} ≠ "${valorEsperado}" - NO INCLUIR`);
        return false;
    }

    // Caso 5: Condición simple ({{VAR}})
    const varName = conditionalVar.replace(/[{}]/g, '').trim();
    const valor = variables[varName];
    console.log(`Evaluando SIMPLE: ${varName} tiene valor?`, valor);

    if (valor && valor.toString().trim() !== '') {
        console.log(`✅ SIMPLE: ${varName} tiene valor - INCLUIR`);
        return true;
    }

    console.log(`❌ SIMPLE: ${varName} no tiene valor - NO INCLUIR`);
    return false;
}

/**
 * Reemplaza variables {{}} en el contenido con valores reales
 */
function reemplazarVariablesEnContenido(contenido, variables) {
    console.log("=== REEMPLAZANDO VARIABLES EN CONTENIDO ===");

    let contenidoProcesado = contenido;
    const regex = /{{([^}]+)}}/g;
    let match;

    // ⚠️ NUEVO: Array para almacenar los TextRun
    const textRuns = [];
    let lastIndex = 0;

    while ((match = regex.exec(contenido)) !== null) {
        const variableCompleta = match[0];
        const nombreVariable = match[1].trim();
        const matchIndex = match.index;

        // 1. Texto normal ANTES de la variable
        if (matchIndex > lastIndex) {
            const textoNormal = contenido.substring(lastIndex, matchIndex);
            textRuns.push(new TextRun(textoNormal));
        }

        // 2. Variable en NEGRITA
        let valor = variables[nombreVariable] || `[${nombreVariable} NO ENCONTRADA]`;

        // ⚠️ MANTENER lógica de formateo de fechas existente
        if (esCampoDeFecha(nombreVariable) && valor && !valor.includes('NO ENCONTRADA')) {
            try {
                const fechaFormateada = formatearFechaEspanol(valor);
                console.log(`📅 Formateando fecha: ${valor} → ${fechaFormateada}`);
                valor = fechaFormateada;
            } catch (error) {
                console.error(`Error formateando fecha ${nombreVariable}:`, error);
            }
        }

        console.log(`Reemplazando: ${variableCompleta} ->`, valor);
        textRuns.push(new TextRun({ text: valor, bold: true })); // ⚠️ NEGRITA

        lastIndex = matchIndex + variableCompleta.length;
    }

    // 3. Texto normal DESPUÉS de la última variable
    if (lastIndex < contenido.length) {
        const textoFinal = contenido.substring(lastIndex);
        textRuns.push(new TextRun(textoFinal));
    }

    console.log("Contenido procesado (TextRuns):", textRuns.length, "elementos");
    return textRuns; // ⚠️ Ahora retorna array de TextRun
}

/**
 * Procesa texto de firma reemplazando variables
 */
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

/**
 * Genera documento DOCX desde plantilla
 */
async function generarDocumentoDesdePlantilla(responses, responseId, db, plantilla, userData, formTitle) {
    try {
        console.log("=== GENERANDO DOCUMENTO DESDE PLANTILLA ===");
        console.log("Título del documento:", plantilla.documentTitle);
        console.log("Número de párrafos:", plantilla.paragraphs.length);

        // Extraer variables de las respuestas (ahora async)
        const variables = await extraerVariablesDeRespuestas(responses, userData, db);

        // Obtener información de empresa para logo
        const empresaInfo = await obtenerEmpresaDesdeBD(userData?.empresa || '', db);
        const logo = empresaInfo ? empresaInfo.logo : null;

        const children = [];

        // Logo (si existe)
        if (logo) {
            const logoImagen = crearLogoImagen(logo);
            if (logoImagen) {
                children.push(new Paragraph({
                    children: [logoImagen]
                }));
                children.push(new Paragraph({ text: "" }));
            }
        }

        // Título del documento
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

        // Procesar párrafos condicionales
        let contadorClausula = 0;
        const parrafosIncluidos = [];

        for (const parrafo of plantilla.paragraphs) {
            console.log(`Procesando párrafo ${parrafo.id}:`, parrafo.conditionalVar);

            const debeIncluir = evaluarCondicional(parrafo.conditionalVar, variables);

            if (debeIncluir) {
                const contenidoProcesado = reemplazarVariablesEnContenido(parrafo.content, variables);

                // Solo numerar a partir del segundo párrafo incluido
                if (contadorClausula > 0) {
                    const ordinal = ORDINALES[contadorClausula] || `${contadorClausula}°`;

                    // Agregar título de cláusula CON CONTROL DE PAGINACIÓN
                    children.push(new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        children: [new TextRun({ text: ordinal, bold: true })],
                        // ⚠️ NUEVO: Control de paginación para evitar cortes
                        pageBreakBefore: false,
                        keepWithNext: true, // Mantiene el título con el párrafo siguiente
                        keepLines: true
                    }));
                }

                // Agregar contenido CON CONTROL DE PAGINACIÓN
                if (Array.isArray(contenidoProcesado)) {
                    children.push(new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        children: contenidoProcesado,
                        // ⚠️ NUEVO: Control de paginación para el contenido
                        pageBreakBefore: false,
                        orphanControl: true, // Evita líneas huérfanas
                        widowControl: true   // Evita líneas viudas
                    }));
                } else {
                    children.push(new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        children: [new TextRun(contenidoProcesado)],
                        // ⚠️ NUEVO: Control de paginación para el contenido
                        pageBreakBefore: false,
                        orphanControl: true,
                        widowControl: true
                    }));
                }

                children.push(new Paragraph({ text: "" }));
                parrafosIncluidos.push(parrafo.id);
                contadorClausula++;
            } else {
                console.log(`Párrafo ${parrafo.id} omitido por condición`);
            }
        }

        console.log(`Párrafos incluidos: ${parrafosIncluidos.length}/${plantilla.paragraphs.length}`);

        // Procesar firmas
        if (plantilla.signature1Text || plantilla.signature2Text) {
            children.push(new Paragraph({ text: "" }));
            children.push(new Paragraph({ text: "" }));
            children.push(new Paragraph({ text: "" }));
            children.push(new Paragraph({ text: "" }));
            children.push(new Paragraph({ text: "" }));
            children.push(new Paragraph({ text: "" }));

            const firma1 = procesarTextoFirma(plantilla.signature1Text, variables);
            const firma2 = procesarTextoFirma(plantilla.signature2Text, variables);

            // Crear tabla de firmas CON CONTROL DE PAGINACIÓN
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
                    // Líneas de firma
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
                    // Textos de firma
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

        // Generar documento DOCX con configuración de paginación
        const doc = new Document({
            sections: [
                {
                    properties: {
                        // ⚠️ NUEVO: Configuración global de paginación
                        page: {
                            margin: {
                                top: 1440,    // 2.5 cm
                                right: 1440,  // 2.5 cm
                                bottom: 1440, // 2.5 cm
                                left: 1440,   // 2.5 cm
                            }
                        }
                    },
                    children: children
                }
            ]
        });

        const buffer = await Packer.toBuffer(doc);

        // Generar nombre del archivo: [nombre formulario]_[nombre trabajador]
        const trabajador = variables['NOMBRE_DEL_TRABAJADOR'] || 'DOCUMENTO';
        const nombreFormulario = formTitle || 'FORMULARIO';

        const fileName = `${limpiarFileName(nombreFormulario)}_${limpiarFileName(trabajador)}`;
        const IDdoc = generarIdDoc();

        // Guardar en base de datos
        await db.collection('docxs').insertOne({
            IDdoc: IDdoc,
            docxFile: buffer,
            responseId: responseId,
            tipo: 'docx',
            fileName: fileName,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log("DOCX generado desde plantilla exitosamente:", IDdoc);

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
    if (!texto) return 'documento';

    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
        .replace(/[^a-zA-Z0-9\s]/g, '') // Solo alfanumérico y espacios
        .replace(/\s+/g, '_') // Espacios a guiones bajos
        .substring(0, 30) // Limitar a 30 caracteres máximo
        .toUpperCase();
}

function reemplazarVariablesEnContenido(contenido, variables) {
    console.log("=== REEMPLAZANDO VARIABLES EN CONTENIDO ===");

    const regex = /{{([^}]+)}}/g;
    let match;

    const textRuns = [];
    let lastIndex = 0;

    while ((match = regex.exec(contenido)) !== null) {
        const variableCompleta = match[0];
        const nombreVariable = match[1].trim();
        const matchIndex = match.index;

        // Texto normal antes de la variable
        if (matchIndex > lastIndex) {
            const textoNormal = contenido.substring(lastIndex, matchIndex);
            textRuns.push(new TextRun(textoNormal));
        }

        // Variable en negrita
        let valor = variables[nombreVariable] || `[${nombreVariable} NO ENCONTRADA]`;

        // Detectar y formatear fechas automáticamente
        if (esCampoDeFecha(nombreVariable) && valor && !valor.includes('NO ENCONTRADA')) {
            try {
                const fechaFormateada = formatearFechaEspanol(valor);
                console.log(`Formateando fecha: ${valor} → ${fechaFormateada}`);
                valor = fechaFormateada;
            } catch (error) {
                console.error(`Error formateando fecha ${nombreVariable}:`, error);
            }
        }

        console.log(`Reemplazando: ${variableCompleta} ->`, valor);
        textRuns.push(new TextRun({ text: valor, bold: true }));

        lastIndex = matchIndex + variableCompleta.length;
    }

    // Texto normal después de la última variable
    if (lastIndex < contenido.length) {
        const textoFinal = contenido.substring(lastIndex);
        textRuns.push(new TextRun(textoFinal));
    }

    console.log("Contenido procesado (TextRuns):", textRuns.length, "elementos");
    return textRuns;
}

// ========== FUNCIONES EXISTENTES (MANTENIDAS CON FALLBACK) ==========

async function generarDocumentoTxt(responses, responseId, db) {
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
        const IDdoc = generarIdDoc(); // ID corto
        const fileName = `${limpiarFileName(nombreFormulario)}_${limpiarFileName(trabajador)}`;

        await db.collection('docxs').insertOne({
            IDdoc: IDdoc,
            docxFile: buffer,
            responseId: responseId,
            tipo: 'txt',
            fileName: fileName,
            createdAt: new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago' }),
            updatedAt: new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })
        });

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
        console.log("ResponseId:", responseId);
        console.log("Section:", section);
        console.log("UserData:", userData);
        console.log("FormId recibido:", formId);

        // ⚠️ CORRECCIÓN: El formId ahora viene como parámetro separado
        if (!formId) {
            console.log("❌ No se recibió formId - Generando TXT");
            return await generarDocumentoTxt(responses, responseId, db);
        }

        // Buscar plantilla por formId
        const plantilla = await buscarPlantillaPorFormId(formId, db);

        if (plantilla) {
            console.log("✅ Usando plantilla para generar DOCX");
            return await generarDocumentoDesdePlantilla(responses, responseId, db, plantilla, userData, formTitle);
        } else {
            console.log("❌ No hay plantilla - Generando TXT como fallback");
            return await generarDocumentoTxt(responses, responseId, db);
        }

    } catch (error) {
        console.error('Error en generarAnexoDesdeRespuesta:', error);

        // Fallback a TXT en caso de error
        console.log("🔄 Fallback a TXT por error");
        return await generarDocumentoTxt(responses, responseId, db);
    }
}

// ========== EXPORTACIONES ==========

module.exports = {
    generarAnexoDesdeRespuesta,
    generarDocumentoTxt,
    // Exportar nuevas funciones para testing
    buscarPlantillaPorFormId,
    evaluarCondicional,
    reemplazarVariablesEnContenido
};