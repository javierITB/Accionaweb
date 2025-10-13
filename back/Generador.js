// docxEndpoint.js
import express from "express";
import fs from "fs";
import path from "path";
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";

const router = express.Router();

// Carpetas de recursos
const basePath = process.cwd(); // puedes adaptarlo
const recursosPath = path.join(basePath, "recursos");
const logosPath = path.join(recursosPath, "Logos");
const plantillaPath = path.join(basePath, "plantilla_base.docx"); // si quieres una plantilla base
const outputPath = path.join(basePath, "output");

if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath);

// Diccionarios de ejemplo (deberías llenarlos según tu config)
logos_empresas = {
    "ACCIONA CENTRO DE NEGOCIOS SPA": os.path.join(carpeta_logos, "ACCIONA.png"),
    "AGUAS PARA SANIDAD": os.path.join(carpeta_logos, "AGUAS PARA SANIDAD.png"),
    "CLINICA DENTAL ALTO LOS ANDES SPA": os.path.join(carpeta_logos, "ALTO LOS ANDES.png"),
    "AZZUCA SPA": os.path.join(carpeta_logos, "AZZUCA.png"),
    "BRUTAL STUDIO CHILE SPA": os.path.join(carpeta_logos, "BRUTAL.png"),
    "CAPTURA": os.path.join(carpeta_logos, "Captura.png"),
    "DINSIDE SPA": os.path.join(carpeta_logos, "dinside.png"),
    "SERVICIO DE MANTENCION DE VEHICULOS EMBRY LIMITADA": os.path.join(carpeta_logos, "EMBRY.png"),
    "GROW GREEN CHILE SPA": os.path.join(carpeta_logos, "GROW GREEN.png"),
    "HOME STYLE SPA": os.path.join(carpeta_logos, "HOME.png"),
    "ICEGCLINIC SPA": os.path.join(carpeta_logos, "ICEGCLINIC.png"),
    "MINIMRKET KAMI 2024 SPA": os.path.join(carpeta_logos, "kami-Photoroom.png"),
    "LA DEHESA": os.path.join(carpeta_logos, "LA DEHESA.png"),
    "COMERCIAL YIREHPAL LIMITADA": os.path.join(carpeta_logos, "yirehpal.png"),
    "LSOFT SERVICIOS INFORMÁTICOS SPA": os.path.join(carpeta_logos, "LSOFT.png"),
    "PIDA 2024 SPA": os.path.join(carpeta_logos, "PIDA.png"),
    "RYS SEGURIDAD Y VIGILANCIA CHILE SPA": os.path.join(carpeta_logos, "RYS.png"),
    "INVERSIONES SAN AGUSTÍN SPA": os.path.join(carpeta_logos, "SAN AGUSTIN.png"),
    "INVERSIONES SANTA MARIA SPA": os.path.join(carpeta_logos, "SANTA MARIA.png"),
    "SIENTE VITAL SPA": os.path.join(carpeta_logos, "SienteVital.png"),
    "SOCIEDAD COMERCIAL TECNOLOGICA LIMITADA": os.path.join(carpeta_logos, "SOCOTEC.png"),
    "SYNIXTOR CHILE SPA": os.path.join(carpeta_logos, "SYNIXTOR.png")
}

rut_empresas = {
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
}

nombre_empresa = {
   "77.975.065-5":  "F & M ODONTOLOGIC MEDICAL SPA",
   "77.947.515-8":  "MINIMRKET KAMI 2024 SPA",
   "77.975.744-7":  "BRUTAL STUDIO CHILE SPA",
   "77.397.128-5":  "PRESTACIONES MÉDICAS CASTRO & SELMA LIMITADA",
   "77.933.997-1":  "AZZUCA SPA",
   "78.055.137-2":  "JANUSNET SPA",
   "78.083.288-6":  "FLIPPKO SPA",
   "78.153.281-9":  "GCU ATENCIONES SPA",
   "78.144.149-K":  "SANTA ELOISA SPA",
   "77.924.401-6":  "IMPORTADORA OUSTO COSMETIC CHILE SPA",
   "76.373.078-6":  "SOCIEDAD COMERCIAL TECNOLOGICA LIMITADA",
   "76.778.293-4":  "ACCIONA CENTRO DE NEGOCIOS SPA",
   "76.687.921-7":  "JMCIA CONSTRUCCIONES SPA",
   "76.678.453-4":  "BORDADOS AMG SPA",
   "76.867.785-9":  "DH HILOS SPA",
   "76.887.205-8":  "ARIDOS MCC SPA",
   "76.275.709-5":  "SERVICIOS Y ASESORIAS DE ATENCION INTEGRAL LIMITAD",
   "76.974.777-K":  "CORPORACIÓN MVP SPA",
   "78.330.870-3":  "SERVICIO DE MANTENCION DE VEHICULOS EMBRY LIMITADA",
   "76.993.230-5":  "PELUQUERÍA YINET DÍAZ E.I.R.L.",
   "76.493.699-K":  "OPENZ EXPERIENCIA CONSULTORES SPA",
   "77.039.974-2":  "SOCIEDAD ARIDOS CORDERO SPA",
   "76.875.644-9":  "GROW GREEN CHILE SPA",
   "76.084.474-8":  "COMERCIAL YIREHPAL LIMITADA",
   "76.926.747-6":  "CENTRO CLINICO EDUCATIVO CRECE SPA",
   "77.032.053-4":  "COMERCIALIZADORA Y DISTRIBUIDORA LOOK & GLOW SPA",
   "76.697.693-K":  "DINSIDE SPA",
   "76.155.283-K":  "INVERSIONES Y ASESORIAS PLAN D SPA",
   "76.084.487-K":  "TRANSPORTE YIREHPAL LIMITADA",
   "77.123.226-4":  "GREEN BUSINESS CHILE SPA",
   "76.743.599-1":  "SOCIEDAD DE INVERSIONES COMERCIALIZADORA R Y V SPA",
   "77.292.823-8":  "HOME STYLE SPA",
   "77.197.781-2":  "DISTRIBUIDORA V Y R SPA",
   "77.413.001-2":  "COMERCIALIZADORA JKA SPA",
   "76.397.289-5":  "INVERSIONES SANTA MARIA SPA",
   "77.328.293-5":  "INVERSIONES SAN AGUSTÍN SPA",
   "77.489.147-1":  "SIENTE VITAL SPA",
   "77.515.709-7":  "IRON WORLD SERVICES INGENIERIA SPA",
   "76.746.098-8":  "COMERCIALIZADORA LD SPA",
   "77.570.852-2":  "J & P MEDICAL SPA",
   "77.420.334-6":  "SERVICIOS PROFESIONALES DE SALUD CAROLINA SANDOVAL SALINAS E.I.R.L.",
   "76.815.534-8":  "LSOFT SERVICIOS INFORMÁTICOS SPA",
   "77.625.197-6":  "GOLD GREEN SPA",
   "77.577.628-5":  "FERDINAND CLAUSEN & ASOCIADOS SPA",
   "77.315.309-4":  "RYS SEGURIDAD Y VIGILANCIA CHILE SPA",
   "77.680.543-2":  "CLINICA DENTAL ALTO LOS ANDES SPA",
   "76.696.743-4":  "SYNIXTOR CHILE SPA",
   "77.126.237-6":  "ICEGCLINIC SPA",
   "77.851.576-8":  "PIDA 2024 SPA",
   "77.894.212-7":  "GREENACTIO ENVIRO SPA",
   "77.926.019-4":  "COMERCIALIZADORA DYM",
   "77.919.204-0":  "VENTA DE PRODUCTOS Y MINIMARKET RANIA ZEIDAN ABDUL E.I.R.L.",
   "77.879.121-8":  "SERVICIOS DE MARKETING LABIFY SPA",
   "65.110.913-2":  "AGUAS PARA SANIDAD"
}

// Función auxiliar para formatear fecha
function formatearFechaEspanol(fechaIso) {
    const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    const d = new Date(fechaIso);
    return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

// Diccionario de ordinales
const ORDINALES = ["", "PRIMERO:", "SEGUNDO:", "TERCERO:", "CUARTO:", "QUINTO:", "SEXTO:", "SÉPTIMO:", "OCTAVO:", "NOVENO:", "DÉCIMO:"];

// Genera docx desde datos
async function generarAnexo(datos) {
    const doc = new Document();

    // Encabezado
    const ciudad = "PROVIDENCIA";
    const hoy = formatearFechaEspanol(new Date().toISOString().split("T")[0]);
    const trabajador = datos.trabajador || "[NOMBRE DEL TRABAJADOR]";
    let empresa = datos.empresa || "[EMPRESA]";
    const rut = Object.entries(rutEmpresas).find(([k]) => empresa.toUpperCase().includes(k))?.[1] || "";

    // Header con logo
    const logoPath = Object.entries(logosEmpresas).find(([k]) => empresa.toUpperCase().includes(k))?.[1];
    if (logoPath && fs.existsSync(logoPath)) {
        const header = doc.createHeader();
        header.addParagraph(new Paragraph().addRun(new TextRun().addImage(fs.readFileSync(logoPath), 100, 100)));
    }

    // Párrafo inicial
    const pEncabezado = new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
            new TextRun(`En ${ciudad} a ${hoy}, entre `),
            new TextRun({ text: `${empresa.toUpperCase()} `, bold: true }),
            new TextRun("y Don(ña) "),
            new TextRun({ text: `${trabajador.toUpperCase()}`, bold: true }),
            new TextRun(`, se conviene modificar el Contrato de Trabajo vigente de fecha ${formatearFechaEspanol(datos.fecha_contrato)} y sus posteriores ANEXOS.`)
        ]
    });
    doc.addParagraph(pEncabezado);

    // Función para agregar modificaciones
    let modificacionNum = 1;
    function agregarModificacion(textos = []) {
        const ordinal = ORDINALES[modificacionNum] || `${modificacionNum}°`;
        modificacionNum++;
        const p = new Paragraph({ alignment: AlignmentType.JUSTIFIED });
        p.addRun(new TextRun({ text: ordinal, bold: true }));
        textos.forEach(t => {
            if (typeof t === "string") p.addRun(new TextRun(t));
            else p.addRun(new TextRun({ ...t }));
        });
        doc.addParagraph(p);
    }

    // Ejemplo: sueldo
    if (datos.sueldo) {
        agregarModificacion([
            "El empleador se compromete a pagar al trabajador una remuneración mensual de $",
            { text: datos.sueldo, bold: true },
            ", monto que ambas partes reconocen y aceptan como sueldo base."
        ]);
    }

    // Agregar más secciones según la lógica de tu Python...

    // Firma con tabla
    const tabla = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({ text: "_____________________________" }),
                            new Paragraph({ text: "Empleador / Representante Legal" }),
                            new Paragraph({ text: `RUT: ${rut}` }),
                            new Paragraph({ text: empresa.toUpperCase() })
                        ]
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({ text: "_____________________________" }),
                            new Paragraph({ text: "Trabajador" }),
                            new Paragraph({ text: `RUT: ${datos.rut_trabajador}` }),
                            new Paragraph({ text: trabajador.toUpperCase() })
                        ]
                    })
                ]
            })
        ]
    });
    doc.addTable(tabla);

    // Guardar archivo
    const salida = path.join(outputPath, `${trabajador.toUpperCase()}.docx`);
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(salida, buffer);
    return salida;
}

// Endpoint POST
router.post("/generar-anexo", async (req, res) => {
    try {
        const datos = req.body; // Aquí recibes tu formulario como JSON
        const archivo = await generarAnexo(datos);
        res.download(archivo); // devuelve el docx al cliente
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error generando el anexo" });
    }
});

export default router;
