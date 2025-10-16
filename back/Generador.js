const express = require("express");
const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType } = require("docx");

const router = express.Router();

// Middleware para inyectar la base de datos
router.use((req, res, next) => {
    // Pasar la conexión de la base de datos al generador_helper
    if (typeof setDatabase === 'function') {
        setDatabase(req.db);
    }
    next();
});

// Endpoint para descargar DOCX
router.get("/download/:IDdoc", async (req, res) => {
    try {
        const { IDdoc } = req.params;

        const documento = await req.db.collection('docxs').findOne({ IDdoc: IDdoc });
        
        if (!documento) {
            return res.status(404).json({ error: "Documento no encontrado" });
        }

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

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${IDdoc}.docx"`,
            'Content-Length': documento.docxFile.length
        });

        res.send(documento.docxFile);

    } catch (err) {
        console.error("Error descargando DOCX:", err);
        res.status(500).json({ error: "Error descargando el documento" });
    }
});

module.exports = router;