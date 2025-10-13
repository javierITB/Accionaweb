const express = require("express");
const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle }  = require("path");

const router = express.Router();

// Carpetas de recursos
const basePath = process.cwd(); // puedes adaptarlo
const recursosPath = path.join(basePath, "recursos");
const logosPath = path.join(recursosPath, "Logos");
const plantillaPath = path.join(basePath, "plantilla_base.docx"); // si quieres una plantilla base
const outputPath = path.join(basePath, "output");

if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath);



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
router.post("/", async (req, res) => {
    try {
        const body = req.body;

        // Mapear explícitamente las variables que vienen del frontend
        const datos = {
            trabajador: body.trabajador || "",          // nombre del trabajador
            rut_trabajador: body.rut_trabajador || "",  // RUT del trabajador
            empresa: body.empresa || "",                // nombre de la empresa
            fecha_contrato: body.fecha_contrato || "",  // fecha del contrato original
            sueldo: body.sueldo || "",                  // sueldo del trabajador
            cargo: body.cargo || "",                    // cargo del trabajador
            fecha_anexo: body.fecha_anexo || "",        // fecha del anexo
            // Agrega aquí todas las demás variables que tu frontend envíe
            // ejemplo:
            // jornada: body.jornada || "",
            // modalidad: body.modalidad || "",
            // bonos: body.bonos || [],
        };

        // Llamada a la función que genera el docx
        const archivo = await generarAnexo(datos);

        // Devolver el docx al cliente
        res.download(archivo);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error generando el anexo" });
    }
});

module.exports = router;
