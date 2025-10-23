const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

// Endpoint para obtener todos los documentos
router.get("/docxs", async (req, res) => {
  try {
    const docxs = await req.db.collection('docxs').find().toArray();
    res.json(docxs);
  } catch (err) {
    console.error("Error obteniendo documentos:", err);
    res.status(500).json({ error: "Error obteniendo documentos" });
  }
});

// Endpoint para descargar DOCX
router.get("/download/:IDdoc", async (req, res) => {
    try {
        const { IDdoc } = req.params;
        console.log("=== SOLICITUD DE DESCARGA ===");
        console.log("Buscando documento con IDdoc:", IDdoc);

        const documento = await req.db.collection('docxs').findOne({ IDdoc: IDdoc });
        
        if (!documento) {
            console.log("Documento no encontrado para IDdoc:", IDdoc);
            return res.status(404).json({ error: "Documento no encontrado" });
        }

        console.log("Documento encontrado");
        console.log("Tipo de docxFile:", typeof documento.docxFile);
        console.log("Tiene buffer?:", !!documento.docxFile.buffer);
        console.log("Es función length?:", typeof documento.docxFile.length === 'function');
        
        // OBTENER EL BUFFER CORRECTAMENTE
        const docxBuffer = documento.docxFile.buffer;
        const bufferLength = docxBuffer.length;

        // Actualizar estado en respuestas
        await req.db.collection("respuestas").updateOne(
            { _id: new ObjectId(documento.responseId) },
            { 
                $set: { 
                    status: "en_revision",
                    reviewedAt: new Date()
                } 
            }
        );

        // Configurar headers para descarga
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${IDdoc}.docx"`,
            'Content-Length': bufferLength
        });

        console.log("Enviando documento al cliente, tamaño:", bufferLength);
        
        // ENVIAR EL BUFFER CORRECTAMENTE
        res.send(docxBuffer);

    } catch (err) {
        console.error("Error descargando DOCX:", err);
        console.error("Detalles del error:", err.message);
        res.status(500).json({ error: "Error descargando el documento: " + err.message });
    }
});

router.get("/preview/:IDdoc", async (req, res) => {
  try {
    const { IDdoc } = req.params;
    const documento = await req.db.collection('docxs').findOne({ IDdoc: IDdoc });

    if (!documento) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }

    // Convertir el binario en base64 legible
    const base64 = documento.docxFile.buffer.toString('base64');

    res.json({
      IDdoc,
      base64,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

  } catch (err) {
    console.error("Error obteniendo preview DOCX:", err);
    res.status(500).json({ error: "Error al obtener la vista previa del documento" });
  }
});

module.exports = router;