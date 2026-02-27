const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { createBlindIndex } = require("../utils/seguridad.helper");

// Importar TU función validarToken
const { validarToken } = require("../utils/validarToken.js");
const {
  registerFormCreationEvent,
  registerFormUpdateEvent,
  registerFormPublishEvent,
  registerFormDeletionEvent,
} = require("../utils/registerEvent.js");

// Helper para verificar token en cualquier request - SOLO CAMBIO DE MENSAJES
const verifyRequest = async (req) => {
  let token = req.headers.authorization?.split(" ")[1];

  // Fallback: buscar en body.user.token
  if (!token && req.body?.user?.token) token = req.body.user.token;

  // Fallback: buscar en query param
  if (!token && req.query?.token) token = req.query.token;

  if (!token) return { ok: false, error: "Unauthorized" };

  const valid = await validarToken(req.db, token);
  if (!valid.ok) return { ok: false, error: "Unauthorized" };

  return { ok: true, data: valid.data };
};

router.use(express.json({ limit: '4mb' }));

/**
 * @openapi
 * /forms:
 *   post:
 *     summary: Crear o actualizar un formulario dinámico
 *     description: Permite definir la estructura del formulario. Si se omite el `id` en el body, crea uno nuevo validando los límites del plan. Si se incluye `id`, actualiza el existente. Configura automáticamente metadatos para campos de tipo archivo.
 *     tags: [Diseño de Formularios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id: { type: string, description: "Opcional. ID para actualización" }
 *               title: { type: string }
 *               description: { type: string }
 *               section: { type: string, description: "Categoría del formulario" }
 *               questions: 
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type: { type: string, enum: [text, number, date, file, select] }
 *                     label: { type: string }
 *                     required: { type: boolean }
 *     responses:
 *       201:
 *         description: Formulario creado exitosamente.
 *       403:
 * description: Límite de formularios del plan alcanzado.
 */
// Crear o actualizar un formulario - SOLO CAMBIO DE MENSAJES DE ERROR
router.post("/", async (req, res) => {
  try {
    // Validar token con el helper
    const tokenCheck = await verifyRequest(req);
    if (!tokenCheck.ok) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = req.body;

    if (!data.id) {
      // Plan Limites
      const { checkPlanLimits } = require("../utils/planLimits");
      try {
        await checkPlanLimits(req, 'forms');
      } catch (limitErr) {
        return res.status(403).json({ error: limitErr.message });
      }
    }

    // PROCESAR PREGUNTAS para asegurar configuraciones de archivos
    const processedQuestions = (data.questions || []).map(question => {
      if (question.type === 'file') {
        return {
          ...question,
          multiple: question.multiple || false,
          accept: question.accept || '.pdf,application/pdf',
          maxSize: question.maxSize || '1'
        };
      }
      return question;
    });

    const formData = {
      ...data,
      questions: processedQuestions,
      updatedAt: new Date()
    };

    let result;

    if (!data.id) {
      // INSERT
      result = await req.db.collection("forms").insertOne({
        ...formData,
        createdAt: new Date()
      });

      res.status(201).json({
        _id: result.insertedId,
        ...formData
      });

      // Registrar evento de creación (async, no bloquea respuesta)
      registerFormCreationEvent(req, tokenCheck, { ...formData, _id: result.insertedId }).catch(console.error);

    } else {
      // UPDATE
      result = await req.db.collection("forms").findOneAndUpdate(
        { _id: new ObjectId(data.id) },
        { $set: formData },
        { returnDocument: "after" }
      );

      if (!result) {
        return res.status(404).json({ error: "Not found" });
      }

      res.status(200).json(result.value || result);

      // Registrar evento de actualización (async, no bloquea respuesta)
      registerFormUpdateEvent(req, tokenCheck, formData).catch(console.error);
    }

  } catch (err) {
    console.error("Error en POST /forms:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /forms/mini:
 *   get:
 *     summary: Obtener catálogo optimizado con estadísticas
 *     description: Retorna una lista paginada de formularios con conteo de campos y estadísticas globales por estado y sección. Ideal para el dashboard administrativo.
 *     tags: [Consultas de Formularios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: search
 *         schema: { type: string, description: "Búsqueda por título o descripción" }
 *       - in: query
 *         name: category
 *         schema: { type: string, description: "Filtrar por sección" }
 *     responses:
 *       200:
 *         description: Lista de formularios y objeto de estadísticas.
 */
// Listar todos los formularios con PAGINACIÓN 
router.get("/mini", async (req, res) => {
  try {
    const tokenCheck = await verifyRequest(req);
    if (!tokenCheck.ok) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } }
      ];
    }
    if (req.query.category && req.query.category !== 'all') {
      query.section = req.query.category;
    }
    if (req.query.status) {
      const statuses = req.query.status.split(',');
      if (statuses.length > 0) {
        query.status = { $in: statuses };
      }
    }

    const totalForms = await req.db.collection("forms").countDocuments(query);

    const pipeline = [
      { $match: query },
      {
        $facet: {
          data: [
            { $sort: { updatedAt: -1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                title: 1,
                description: 1,
                category: 1,
                icon: 1,
                primaryColor: 1,
                status: 1,
                priority: 1,
                responseTime: 1,
                documentsRequired: 1,
                tags: 1,
                companies: 1,
                updatedAt: 1,
                createdAt: 1,
                section: 1,
                fields: {
                  $cond: {
                    if: { $isArray: "$questions" },
                    then: { $size: "$questions" },
                    else: 0
                  }
                }
              }
            }
          ],
          statsStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } }
          ],
          statsSection: [
            { $group: { _id: "$section", count: { $sum: 1 } } }
          ],
          statsGlobal: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                recent: {
                  $sum: {
                    $cond: [
                      { $gte: ["$updatedAt", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    ];

    const [result] = await req.db.collection("forms").aggregate(pipeline).toArray();

    const forms = result.data || [];
    const statsStatus = result.statsStatus || [];
    const statsSection = result.statsSection || [];
    const statsGlobal = result.statsGlobal[0] || { total: 0, recent: 0 };

    const mapCounts = (arr) => arr.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {});

    const stats = {
      total: statsGlobal.total,
      recent: statsGlobal.recent,
      status: mapCounts(statsStatus),
      section: mapCounts(statsSection)
    };

    res.json({
      data: forms,
      total: totalForms,
      page: page,
      pages: Math.ceil(totalForms / limit),
      limit: limit,
      stats: stats
    });
  } catch (err) {
    console.error("Error en GET /forms/mini:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Listar todos los formularios con Paginación FULL 
router.get("/", async (req, res) => {
  try {
    // Validar token con el helper
    const tokenCheck = await verifyRequest(req);
    if (!tokenCheck.ok) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Parámetros de Paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    // Filtros opcionales 
    const query = {};
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } }
      ];
    }
    if (req.query.category && req.query.category !== 'all') {
      query.section = req.query.category; // 
    }
    if (req.query.status) {
      // Si el status es un array o string separado por comas
      const statuses = req.query.status.split(',');
      if (statuses.length > 0) {
        query.status = { $in: statuses };
      }
    }

    // Ejecutar consulta con paginación
    const totalForms = await req.db.collection("forms").countDocuments(query);
    const forms = await req.db.collection("forms")
      .find(query)
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    res.json({
      data: forms,
      total: totalForms,
      page: page,
      pages: Math.ceil(totalForms / limit),
      limit: limit
    });
  } catch (err) {
    console.error("Error en GET /forms:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Obtener un formulario por ID - SOLO CAMBIO DE MENSAJES DE ERROR
router.get("/:id", async (req, res) => {
  try {
    // Validar token con el helper
    const tokenCheck = await verifyRequest(req);
    if (!tokenCheck.ok) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const form = await req.db
      .collection("forms")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!form) return res.status(404).json({ error: "Not found" });
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /forms/section/{section}/{mail}:
 *   get:
 *     summary: Filtrar formularios disponibles para un usuario
 *     description: Busca formularios publicados que pertenezcan a una sección específica y que estén autorizados para la empresa del usuario (vía blind index del mail) o marcados como "Todas".
 *     tags: [Consultas de Formularios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: mail
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de formularios accesibles para el usuario.
 */
//Filtrado de forms por seccion y empresa - SOLO CAMBIO DE MENSAJES DE ERROR
router.get("/section/:section/:mail", async (req, res) => {
  try {
    // Validar token con el helper
    const tokenCheck = await verifyRequest(req);
    if (!tokenCheck.ok) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { section, mail } = req.params;

    // 1. Buscar la empresa asociada al usuario usando BLIND INDEX
    const user = await req.db.collection("usuarios").findOne({
      mail_index: createBlindIndex(mail)
    });

    if (!user || !user.empresa) {
      return res.status(404).json({ error: "Not found" });
    }

    const empresaUsuario = user.empresa;

    // 2. Definir la consulta de filtrado
    const query = {
      section: section,
      status: "publicado",
      $or: [
        { companies: empresaUsuario },
        { companies: "Todas" }
      ],
    };

    // 3. Buscar formularios que cumplan todas las condiciones
    const forms = await req.db
      .collection("forms")
      .find(query)
      .toArray();

    if (!forms || forms.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    res.status(200).json(forms);
  } catch (err) {
    console.error("Error al obtener formularios filtrados:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /forms/{id}:
 *   put:
 *     summary: Actualizar un formulario existente
 *     tags: [Diseño de Formularios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Formulario actualizado.
 */
// Actualizar un formulario 
router.put("/:id", async (req, res) => {
  try {
    // Validar token con el helper
    const tokenCheck = await verifyRequest(req);
    if (!tokenCheck.ok) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = req.body;

    const processedQuestions = (data.questions || []).map(question => {
      if (question.type === 'file') {
        return {
          ...question,
          multiple: question.multiple || false,
          accept: question.accept || '.pdf,application/pdf',
          maxSize: question.maxSize || '1'
        };
      }
      return question;
    });

    const result = await req.db.collection("forms").findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          ...data,
          questions: processedQuestions,
          updatedAt: new Date()
        }
      },
      { returnDocument: "after" }
    );

    if (!result) return res.status(404).json({ error: "Not found" });
    res.json(result.value || result);

    // Registrar evento de actualización (async)
    registerFormUpdateEvent(req, tokenCheck, req.body).catch(console.error);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /forms/public/{id}:
 *   put:
 *     summary: Cambiar estado a "publicado"
 *     description: Activa un formulario para que empiece a recibir respuestas.
 *     tags: [Diseño de Formularios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado actualizado a publicado.
 */
// Publicar un formulario
router.put("/public/:id", async (req, res) => {
  try {
    // Validar token con el helper
    const tokenCheck = await verifyRequest(req);
    if (!tokenCheck.ok) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await req.db.collection("forms").findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          status: "publicado",
          updatedAt: new Date()
        }
      },
      { returnDocument: "after" }
    );

    if (!result.value) {
      return res.status(404).json({ error: "Not found" });
    }

    res.status(200).json(result.value);

    // Registrar evento de publicación (async)
    registerFormPublishEvent(req, tokenCheck, result.value).catch(console.error);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Eliminar un formulario -
router.delete("/:id", async (req, res) => {
  try {
    // Validar token con el helper
    const tokenCheck = await verifyRequest(req);
    if (!tokenCheck.ok) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Obtener el formulario antes de eliminar para tener su info en el log
    const formToDelete = await req.db.collection("forms").findOne({ _id: new ObjectId(req.params.id) });

    const result = await req.db
      .collection("forms")
      .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    res.status(200).json({ message: "Deleted" });

    // Registrar evento de eliminación (async)
    if (formToDelete) {
      registerFormDeletionEvent(req, tokenCheck, formToDelete).catch(console.error);
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/respuestas", async (req, res) => {
  try {
    const tokenCheck = await verifyRequest(req);
    if (!tokenCheck.ok) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await req.db.collection("respuestas").insertOne({
      ...req.body,
      createdAt: new Date()
    });

    res.json({ _id: result.insertedId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /forms/public-view/{id}:
 *   get:
 *     summary: Obtener estructura de formulario para vista pública
 *     description: Permite obtener la configuración de preguntas de un formulario sin necesidad de token. Usado para usuarios externos que deben completar un formulario mediante un link compartido.
 *     tags: [Acceso Público]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Estructura del formulario (preguntas, tipos, etc.).
 */
// Endpoint para obtener un formulario sin token
router.get("/public-view/:id", async (req, res) => {
  try {
    const form = await req.db
      .collection("forms")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!form) return res.status(404).json({ error: "Not found" });
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;