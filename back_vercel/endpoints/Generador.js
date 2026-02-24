const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { addNotification } = require("../utils/notificaciones.helper");
const { validarToken } = require("../utils/validarToken.js");

const verifyRequest = async (req) => {
    let token = req.headers.authorization?.split(" ")[1];
    if (!token && req.body?.user?.token) token = req.body.user.token;
    if (!token && req.query?.token) token = req.query.token;

    if (!token) return { ok: false, error: "Token no proporcionado" };

    const valid = await validarToken(req.db, token);
    if (!valid.ok) return { ok: false, error: valid.reason, status: 401 };

    return { ok: true, data: valid.data };
};

// Nuevo endpoint para obtener información del documento por responseId
router.get("/info-by-response/:responseId", async (req, res) => {
    try {
        const { responseId } = req.params;
        const documento = await req.db.collection('docxs').findOne({ responseId: responseId });

        const auth = await verifyRequest(req);
        if (!auth.ok) return res.status(401).json({ error: auth.error });

        if (!documento) {
            return res.status(404).json({ error: "Documento no encontrado" });
        }

        res.json({
            IDdoc: documento.IDdoc,
            tipo: documento.tipo || 'docx',
            responseId: documento.responseId,
            createdAt: documento.createdAt
        });
    } catch (err) {
        console.error("Error obteniendo información del documento:", err);
        res.status(500).json({ error: "Error obteniendo información del documento" });
    }
});

// Endpoint para obtener todos los documentos
router.get("/docxs", async (req, res) => {
    try {
        const auth = await verifyRequest(req);
        if (!auth.ok) return res.status(401).json({ error: auth.error });

        const docxs = await req.db.collection('docxs').find().toArray();
        res.json(docxs);
    } catch (err) {
        console.error("Error obteniendo documentos:", err);
        res.status(500).json({ error: "Error obteniendo documentos" });
    }
});

// Endpoint para descargar documento (DOCX o TXT)
router.get("/download/:IDdoc", async (req, res) => {
    try {
        const { IDdoc } = req.params;
        console.log("=== SOLICITUD DE DESCARGA ===");

        const auth = await verifyRequest(req);
        if (!auth.ok) return res.status(401).json({ error: auth.error });

        const documento = await req.db.collection('docxs').findOne({ IDdoc: IDdoc });

        if (!documento) {
            return res.status(404).json({ error: "Documento no encontrado" });
        }

        console.log("Documento encontrado");

        // OBTENER EL BUFFER CORRECTAMENTE
        const fileBuffer = documento.docxFile.buffer || documento.docxFile;
        const bufferLength = fileBuffer.length;

        // USAR EL fileName GUARDADO EN LUGAR DEL IDdoc
        const fileName = documento.fileName || IDdoc;
        const extension = documento.tipo === 'txt' ? 'txt' : 'docx';
        let finalFileName = documento.fileName || IDdoc;

        if (finalFileName.toLowerCase().endsWith(`.${extension}`)) {
            finalFileName = finalFileName.slice(0, -(extension.length + 1));
        }

        // Por ahora solo DOCX
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${finalFileName}.${extension}"`,
            'Content-Length': bufferLength
        });

        // ENVIAR EL BUFFER
        res.send(fileBuffer);

    } catch (err) {
        console.error("Error descargando documento:", err);
        console.error("Detalles del error:", err.message);
        res.status(500).json({ error: "Error descargando el documento: " + err.message });
    }
});

// Nuevo endpoint para obtener información del documento (útil para el frontend)
router.get("/info/:IDdoc", async (req, res) => {
    try {
        const { IDdoc } = req.params;
        const documento = await req.db.collection('docxs').findOne({ IDdoc: IDdoc });

        const auth = await verifyRequest(req);
        if (!auth.ok) return res.status(401).json({ error: auth.error });

        if (!documento) {
            return res.status(404).json({ error: "Documento no encontrado" });
        }

        res.json({
            IDdoc: documento.IDdoc,
            tipo: documento.tipo || 'docx',
            responseId: documento.responseId,
            createdAt: documento.createdAt
        });
    } catch (err) {
        console.error("Error obteniendo información del documento:", err);
        res.status(500).json({ error: "Error obteniendo información del documento" });
    }
});

module.exports = router;