const express = require("express");
const router = express.Router({ mergeParams: true });
const { ObjectId } = require("mongodb");
const multer = require("multer");
const { validarToken } = require("../utils/validarToken");
const { addNotification } = require("../utils/notificaciones.helper");

// --- UTILS ---

const getCentralDB = (req) => {
    return req.mongoClient.db("formsdb");
};

// Multer Config
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Formato no válido. Solo PDF, JPG y PNG."));
        }
    }
});

// --- MIDDLEWARE ---

const verifyAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "No autorizado. Token faltante." });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Formato de token inválido." });
        }

        let dbToUse = req.db;
        if (!dbToUse && req.mongoClient) {
            dbToUse = req.mongoClient.db("formsdb");
        }

        if (!dbToUse) {
            console.error("[Pagos] Error: No database connection available for token validation");
            return res.status(500).json({ error: "Configuration Error: No DB connection" });
        }

        const validation = await validarToken(dbToUse, token);

        if (!validation.ok) {
            return res.status(401).json({ error: validation.reason });
        }

        req.user = validation.data;
        next();
    } catch (error) {
        console.error("Error en middleware de autenticación:", error);
        res.status(500).json({ error: "Error interno de autenticación." });
    }
};

// --- ENDPOINTS (Refactored for Cobros System) ---

/**
 * @openapi
 * /pagos/admin/generate-charges:
 *   post:
 *     summary: Generar cobros masivos o individuales
 *     description: Crea registros de cobro para las empresas seleccionadas. Al generarse, el sistema dispara automáticamente notificaciones a los administradores de cada empresa cliente.
 *     tags: [SaaS - Cobros]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companies, amount, concept]
 *             properties:
 *               companies: 
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dbName: { type: string }
 *                     name: { type: string }
 *                     amount: { type: number, description: "Opcional. Sobrescribe el monto general." }
 *               amount: { type: number, example: 50000 }
 *               concept: { type: string, example: "Suscripción Mensual Marzo" }
 *               period: { type: string, example: "2026-03" }
 *     responses:
 *       201:
 *         description: Cobros generados y notificaciones enviadas.
 */
router.post("/admin/generate-charges", verifyAuth, async (req, res) => {
    try {
        const db = getCentralDB(req);

        // ADMIN CHECK
        let dbToUse = req.db;
        if (!dbToUse && req.mongoClient) dbToUse = req.mongoClient.db("formsdb");
        if (!dbToUse || (dbToUse.databaseName !== 'formsdb' && dbToUse.databaseName !== 'api')) {
            return res.status(403).json({ error: "Acceso denegado: Solo administradores." });
        }

        const { companies, amount, concept, period } = req.body;

        if (!companies || !Array.isArray(companies) || companies.length === 0) {
            return res.status(400).json({ error: "Debe seleccionar al menos una empresa." });
        }
        if (!concept) {
            return res.status(400).json({ error: "El concepto es requerido." });
        }

        const batch = companies.map(company => {
            const rawAmount = parseFloat(company.amount || amount);
            return {
                companyDb: company.dbName,
                companyName: company.name,
                amount: isNaN(rawAmount) ? 0 : rawAmount,
                concept: concept,
                period: period || new Date().toISOString().slice(0, 7), // YYYY-MM per default
                status: "Pendiente",
                createdAt: new Date(),
                updatedAt: new Date(),
                receipt: null // Will hold file info later
            };
        });

        const result = await db.collection("cobros").insertMany(batch);

        // Enviar Notificaciones
        for (const company of companies) {
            const chargeAmount = parseFloat(company.amount || amount) || 0;
            const clientDb = req.mongoClient.db(company.dbName);
            await addNotification(clientDb, {
                filtro: {
                    cargo: "Administrador" // Solo Administradores
                },
                titulo: "Nuevo cobro generado",
                descripcion: `Se ha generado un nuevo cobro por $${chargeAmount} (${concept}).`,
                color: "#ef4444",
                icono: "paper",
                actionUrl: "/comprobantes"
            }).catch(err => console.error(`Error sending notification to ${company.name}:`, err));
        }

        res.status(201).json({
            message: `Se generaron ${result.insertedCount} cobros exitosamente.`,
            ids: result.insertedIds
        });

    } catch (error) {
        console.error("Error generating charges:", error);
        res.status(500).json({ error: "Error al generar cobros." });
    }
});

/**
 * @openapi
 * /pagos/admin/dashboard-stats:
 *   get:
 *     summary: Obtener estadísticas globales de recaudación
 *     description: Retorna métricas consolidadas (Total recaudado, recaudación del mes actual, montos pendientes) y un desglose por empresa.
 *     tags: [SaaS - Cobros]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Objeto con estadísticas globales y por tenant.
 */
router.get("/admin/dashboard-stats", verifyAuth, async (req, res) => {
    try {
        const db = getCentralDB(req);

        // ADMIN CHECK
        let dbToUse = req.db;
        if (!dbToUse && req.mongoClient) dbToUse = req.mongoClient.db("formsdb");
        if (!dbToUse || (dbToUse.databaseName !== 'formsdb' && dbToUse.databaseName !== 'api')) {
            return res.status(403).json({ error: "Acceso denegado." });
        }

        // 1. Global Stats
        const now = new Date();
        // Since we store period as 'YYYY-MM', let's use that for current month
        const currentPeriod = now.toISOString().slice(0, 7);

        const globalStats = await db.collection("cobros").aggregate([
            {
                $group: {
                    _id: null,
                    totalCollected: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "Aprobado"] },
                                { $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 } },
                                0
                            ]
                        }
                    },
                    monthCollected: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$status", "Aprobado"] },
                                        { $eq: ["$period", currentPeriod] }
                                    ]
                                },
                                { $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 } },
                                0
                            ]
                        }
                    },
                    totalPending: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ["$status", "Pendiente"] },
                                        { $eq: ["$status", "En Revisión"] }
                                    ]
                                },
                                { $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 } },
                                0
                            ]
                        }
                    },
                    countPending: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ["$status", "Pendiente"] },
                                        { $eq: ["$status", "En Revisión"] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]).toArray();

        // 2. Stats per Company
        const companyStats = await db.collection("cobros").aggregate([
            {
                $group: {
                    _id: "$companyDb",
                    lastChargeDate: { $max: "$createdAt" },
                    pendingCount: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ["$status", "Pendiente"] },
                                        { $eq: ["$status", "En Revisión"] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    pendingAmount: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ["$status", "Pendiente"] },
                                        { $eq: ["$status", "En Revisión"] }
                                    ]
                                },
                                { $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 } },
                                0
                            ]
                        }
                    }
                }
            }
        ]).toArray();

        // Convert array to map for easier frontend lookup
        const statsByCompany = {};
        companyStats.forEach(stat => {
            statsByCompany[stat._id] = stat;
        });

        res.json({
            global: globalStats[0] || { totalCollected: 0, monthCollected: 0, totalPending: 0, countPending: 0 },
            byCompany: statsByCompany
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ error: "Error al obtener estadísticas." });
    }
});

/**
 * ENDPOINT: Get Charges by Company (Admin View)
 * Obtiene el historial de cobros para una empresa específica.
 */
router.get("/admin/charges/:companyDb", verifyAuth, async (req, res) => {
    try {
        const db = getCentralDB(req);
        const { companyDb } = req.params;

        // ADMIN CHECK
        let dbToUse = req.db;
        if (!dbToUse && req.mongoClient) dbToUse = req.mongoClient.db("formsdb");
        if (!dbToUse || (dbToUse.databaseName !== 'formsdb' && dbToUse.databaseName !== 'api')) {
            return res.status(403).json({ error: "Acceso denegado." });
        }

        const charges = await db.collection("cobros")
            .find({ companyDb: companyDb })
            .project({ "receipt.file.data": 0 }) // Exclude binary data
            .sort({ createdAt: -1 })
            .toArray();

        res.json(charges);
    } catch (error) {
        console.error("Error fetching charges for company:", error);
        res.status(500).json({ error: "Error al obtener cobros." });
    }
});

/**
 * @openapi
 * /pagos/client/my-charges:
 *   get:
 *     summary: Listar cobros de mi empresa
 *     description: Retorna el historial de cobros (pendientes, aprobados y en revisión) asociados al contexto de la empresa actual.
 *     tags: [SaaS - Pagos Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cobros de la empresa.
 */
router.get("/client/my-charges", verifyAuth, async (req, res) => {
    try {
        const db = getCentralDB(req);

        // Determinar la companyDb del usuario actual
        // El frontend suele enviar la company en la URL base si configuramos rutas asi, 
        // pero aqui asumimos que 'req.params.company' viene por el middleware de app.use('/pagos/:company', ...)
        const companyDb = req.params.company;

        if (!companyDb) {
            return res.status(400).json({ error: "Contexto de empresa no definido." });
        }

        const charges = await db.collection("cobros")
            .find({ companyDb: companyDb }) // Buscar por el identificador de la DB o nombre unico
            .project({ "receipt.file.data": 0 })
            .sort({ createdAt: -1 })
            .toArray();

        res.json(charges);
    } catch (error) {
        console.error("Error fetching client charges:", error);
        res.status(500).json({ error: "Error al obtener mis cobros." });
    }
});

/**
 * @openapi
 * /pagos/client/upload/{chargeId}:
 *   post:
 *     summary: Subir comprobante de pago
 *     description: Permite al cliente subir un archivo (PDF, JPG, PNG) como respaldo de un cobro. Cambia el estado del cobro a 'En Revisión' y notifica al administrador del SaaS.
 *     tags: [SaaS - Pagos Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chargeId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Comprobante subido correctamente. El cobro queda en revisión.
 */
router.post("/client/upload/:chargeId", verifyAuth, upload.single("file"), async (req, res) => {
    try {
        const db = getCentralDB(req);
        const { chargeId } = req.params;
        const user = req.user;

        if (!ObjectId.isValid(chargeId)) {
            return res.status(400).json({ error: "ID de cobro inválido." });
        }
        if (!req.file) {
            return res.status(400).json({ error: "Debe subir un archivo." });
        }

        const charge = await db.collection("cobros").findOne({ _id: new ObjectId(chargeId) });
        if (!charge) {
            return res.status(404).json({ error: "Cobro no encontrado." });
        }

        // Actualizar el cobro con el comprobante y cambiar estado a "En Revisión"
        const updateResult = await db.collection("cobros").updateOne(
            { _id: new ObjectId(chargeId) },
            {
                $set: {
                    status: "En Revisión",
                    updatedAt: new Date(),
                    receipt: {
                        uploadedBy: user ? user.email : "anonymous",
                        uploadedAt: new Date(),
                        file: {
                            name: req.file.originalname,
                            mimetype: req.file.mimetype,
                            size: req.file.size,
                            data: req.file.buffer // Binary
                        }
                    }
                }
            }
        );

        if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ error: "No se pudo actualizar el cobro." });
        }

        // --- NOTIFICACIÓN AL ADMINISTRADOR DE ACCIONA ---
        try {
            const formsDb = req.mongoClient.db("formsdb");

            // Buscar el nombre real de la empresa
            const company = await formsDb.collection("config_empresas").findOne({ dbName: charge.companyDb });
            const companyName = company ? company.name : (charge.companyDb || "Una empresa");

            await addNotification(formsDb, {
                filtro: {
                    cargo: "Administrador" // Informamos a los administradores principales
                },
                titulo: "Comprobante de pago subido",
                descripcion: `La empresa ${companyName} ha subido un comprobante para el cobro de $${charge.amount} (${charge.concept}).`,
                color: "#3b82f6",
                icono: "paper",
                actionUrl: "/pagos"
            });
        } catch (notifErr) {
            console.error("Error notifying formsdb admin of uploaded receipt:", notifErr);
        }

        res.json({ message: "Comprobante subido exitosamente.", status: "En Revisión" });

    } catch (error) {
        console.error("Error uploading receipt:", error);
        res.status(500).json({ error: "Error interno al subir comprobante." });
    }
});

/**
 * @openapi
 * /pagos/admin/status/{chargeId}:
 *   put:
 *     summary: Aprobar o rechazar un pago
 *     description: Permite al administrador de la plataforma validar un comprobante subido por un cliente. Se puede incluir feedback en caso de rechazo.
 *     tags: [SaaS - Cobros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chargeId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [Aprobado, Rechazado, Pendiente] }
 *               feedback: { type: string, description: "Motivo en caso de rechazo" }
 *     responses:
 *       200:
 *         description: Estado del pago actualizado.
 */
router.put("/admin/status/:chargeId", verifyAuth, async (req, res) => {
    try {
        const db = getCentralDB(req);
        const { chargeId } = req.params;
        const { status, feedback } = req.body; // feedback opcional para rechazos

        // ADMIN CHECK
        let dbToUse = req.db;
        if (!dbToUse && req.mongoClient) dbToUse = req.mongoClient.db("formsdb");
        if (!dbToUse || (dbToUse.databaseName !== 'formsdb' && dbToUse.databaseName !== 'api')) {
            return res.status(403).json({ error: "Acceso denegado." });
        }

        if (!ObjectId.isValid(chargeId)) {
            return res.status(400).json({ error: "ID inválido." });
        }

        const updateData = {
            status: status,
            updatedAt: new Date()
        };
        if (feedback) updateData.feedback = feedback;

        const result = await db.collection("cobros").updateOne(
            { _id: new ObjectId(chargeId) },
            { $set: updateData }
        );

        res.json({ message: "Estado actualizado correctamente." });

    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ error: "Error al actualizar estado." });
    }
});

/**
 * @openapi
 * /pagos/file/{chargeId}:
 *   get:
 *     summary: Descargar/Ver comprobante
 *     description: Retorna el archivo binario del comprobante de pago asociado a un registro de cobro.
 *     tags: [SaaS - Cobros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chargeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Archivo PDF o Imagen.
 *         content:
 *           application/pdf: { schema: { type: string, format: binary } }
 *           image/jpeg: { schema: { type: string, format: binary } }
 */
router.get("/file/:chargeId", verifyAuth, async (req, res) => {
    try {
        const db = getCentralDB(req);
        const { chargeId } = req.params;

        if (!ObjectId.isValid(chargeId)) {
            return res.status(400).json({ error: "ID inválido." });
        }

        const doc = await db.collection("cobros").findOne(
            { _id: new ObjectId(chargeId) },
            { projection: { "receipt.file": 1 } }
        );

        if (!doc || !doc.receipt || !doc.receipt.file) {
            return res.status(404).json({ error: "Archivo no encontrado." });
        }

        const file = doc.receipt.file;
        res.setHeader("Content-Type", file.mimetype);
        res.setHeader("Content-Disposition", `inline; filename="${file.name}"`);
        res.send(file.data.buffer);

    } catch (error) {
        console.error("Error serving file:", error);
        res.status(500).json({ error: "Error al obtener el archivo." });
    }
});

module.exports = router;
