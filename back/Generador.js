const express = require("express");
const router = express.Router();

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
        console.log("Tiene length?:", documento.docxFile.length);
        
        // Actualizar estado a "en_revision"
        await req.db.collection('docxs').updateOne(
            { IDdoc: IDdoc },
            { 
                $set: { 
                    estado: 'en_revision',
                    updatedAt: new Date()
                } 
            }
        );

        // Configurar headers para descarga
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${IDdoc}.docx"`,
            'Content-Length': documento.docxFile.length
        });

        console.log("Enviando documento al cliente");
        
        // ENVIAR EL BUFFER CORRECTAMENTE
        res.send(documento.docxFile.buffer);

    } catch (err) {
        console.error("Error descargando DOCX:", err);
        console.error("Detalles del error:", err.message);
        res.status(500).json({ error: "Error descargando el documento: " + err.message });
    }
});

module.exports = router;