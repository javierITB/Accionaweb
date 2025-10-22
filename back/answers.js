const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const multer = require('multer');
const { addNotification } = require("./notificaciones.helper");
const { generarAnexoDesdeRespuesta } = require("./generador.helper");

// Configurar Multer para almacenar en memoria (buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

router.post("/", async (req, res) => {
  try {
    const result = await req.db.collection("respuestas").insertOne({
      ...req.body,
      status: "pendiente",
      createdAt: new Date()
    });

    /****************************************************
    SECCION DE INYECCION DE NOTIFICACION DE RESPUESTAS
    ****************************************************/
    const usuario = req.body.user.nombre;
    const empresa = req.body.user.empresa;
    const nombreFormulario = req.body.formTitle;
    const userId = req.body.user?.uid;

    await addNotification(req.db, {
      filtro: { rol: "admin" },
      titulo: `El usuario ${usuario} de la empresa ${empresa} ha respondedo el formulario ${nombreFormulario}`,
      descripcion: "Puedes revisar los detalles en el panel de respuestas.",
      prioridad: 2,
      color: "#fb8924",
      icono: "form",
      actionUrl: `/respuestas?id=${result.insertedId}`,
    });

    await addNotification(req.db, {
      userId: userId,
      titulo: "Formulario completado",
      descripcion: `El formulario ${nombreFormulario} fue completado correctamente.`,
      prioridad: 2,
      icono: "CheckCircle",
      color: "#3B82F6",
      actionUrl: `/?id=${result.insertedId}`,
    });
    /****************************************************
    SECCION DE INYECCION DE NOTIFICACION DE RESPUESTAS
    ****************************************************/

    /****************************************************
    SECCION DE GENERACION AUTOMATICA DE DOCX - IMPLEMENTADA
    ****************************************************/

    console.log("=== INICIANDO GENERACIÓN AUTOMÁTICA DE DOCX ===");
    console.log("Response ID:", result.insertedId.toString());
    console.log("DB disponible:", !!req.db);
    console.log("Usuario:", usuario);
    console.log("Empresa:", empresa);
    console.log("Formulario:", nombreFormulario);
    
    if (req.body.responses) {
      console.log("Número de campos en responses:", Object.keys(req.body.responses).length);
      
      const camposCriticos = [
        "Nombre de la Empresa solicitante:",
        "Nombre del trabajador:", 
        "Fecha del contrato vigente:"
      ];
      camposCriticos.forEach(campo => {
        const valor = req.body.responses[campo];
        console.log(`Campo crítico "${campo}":`, valor || "NO ENCONTRADO");
      });
    } else {
      console.log("ADVERTENCIA: No hay req.body.responses");
    }

    try {
      await generarAnexoDesdeRespuesta(
        req.body.responses,
        result.insertedId.toString(),
        req.db
      );
      console.log('DOCX generado automáticamente para respuesta:', result.insertedId);
    } catch (error) {
      console.error('Error generando DOCX automáticamente:', error.message);
      console.error('Stack trace:', error.stack);
    }
    /****************************************************
    SECCION DE GENERACION AUTOMATICA DE DOCX - IMPLEMENTADA
    ****************************************************/

    res.json({ _id: result.insertedId, ...req.body });
  } catch (err) {
    console.error('Error general al guardar respuesta:', err);
    res.status(500).json({ error: "Error al guardar respuesta: " + err });
  }
});


router.get("/", async (req, res) => {
  try {
    const answers = await req.db.collection("respuestas").find().toArray();
    res.json(answers);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener formularios" });
  }
});

router.get("/mail/:mail", async (req, res) => {
  try {
    const form = await req.db
      .collection("respuestas")
      .find({ "user.mail": req.params.mail })
      .toArray();
    console.log(req.params);
    if (!form) return res.status(404).json({ error: "Formulario no encontrado" });
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener formulario" });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const form = await req.db
      .collection("respuestas")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!form) return res.status(404).json({ error: "Formulario no encontrado" });
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener formulario" });
  }
});


router.get("/section/:section", async (req, res) => {
  try {
    const forms = await req.db
      .collection("respuestas")
      .find({ section: req.params.section })
      .toArray();

    if (!forms.length)
      return res.status(404).json({ error: "No se encontraron formularios en esta sección" });

    res.status(200).json(forms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener formularios por sección" });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const result = await req.db.collection("respuestas").findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result.value) return res.status(404).json({ error: "Formulario no encontrado" });
    res.json(result.value);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar formulario" });
  }
});

//publicar formulario
router.put("/public/:id", async (req, res) => {
  try {
    const result = await req.db.collection("respuestas").findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          status: "published",
          updatedAt: new Date()
        }
      },
      { returnDocument: "after" }
    );

    if (!result.value)
      return res.status(404).json({ error: "Formulario no encontrado" });

    res.status(200).json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al publicar formulario" });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const result = await req.db
      .collection("respuestas")
      .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Formulario no encontrado" });
    }

    res.status(200).json({ message: "Formulario eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar formulario" });
  }
});

//solicitar de mensajes
router.get("/:formId/chat", async (req, res) => {
  try {
    const { formId } = req.params;

    let query;
    if (ObjectId.isValid(formId)) {
      query = { $or: [{ _id: new ObjectId(formId) }, { formId }] };
    } else {
      query = { formId };
    }

    const respuesta = await req.db
      .collection("respuestas")
      .findOne(query, { projection: { mensajes: 1 } });

    if (!respuesta) {
      return res.status(404).json({ error: "No se encontró la respuesta con ese formId o _id" });
    }

    res.json(respuesta.mensajes || []);
  } catch (err) {
    console.error("Error obteniendo chat:", err);
    res.status(500).json({ error: "Error al obtener chat" });
  }
});

//enviar mensaje
router.post("/chat", async (req, res) => {
  try {
    const { formId, autor, mensaje } = req.body;

    if (!autor || !mensaje || !formId) {
      return res.status(400).json({ error: "Faltan campos: formId, autor o mensaje" });
    }

    const nuevoMensaje = {
      autor,
      mensaje,
      leido: false,
      fecha: new Date(),
    };

    let query;
    if (ObjectId.isValid(formId)) {
      query = { $or: [{ _id: new ObjectId(formId) }, { formId }] };
    } else {
      query = { formId };
    }

    const respuesta = await req.db.collection("respuestas").findOne(query);
    if (!respuesta) {
      return res.status(404).json({ error: "No se encontró la respuesta para agregar el mensaje" });
    }

    await req.db.collection("respuestas").updateOne(
      { _id: respuesta._id },
      { $push: { mensajes: nuevoMensaje } }
    );

    if (respuesta?.user?.nombre === autor) {
      await addNotification(req.db, {
        filtro: { rol: "admin" },
        titulo: "Nuevo mensaje en tu formulario",
        descripcion: `${autor} le ha enviado un mensaje por un formulario.`,
        icono: "chat",
        actionUrl: `/RespuestasForms/${respuesta._id}`,
      });
    } else {
      await addNotification(req.db, {
        userId: respuesta.user.uid,
        titulo: "Nuevo mensaje recibido",
        descripcion: `${autor} le ha respondido un mensaje.`,
        icono: "chat",
        actionUrl: `/msg/${respuesta._id}`,
      });
    }

    res.json({
      message: "Mensaje agregado correctamente y notificación enviada",
      data: nuevoMensaje,
    });
  } catch (err) {
    console.error("Error al agregar mensaje:", err);
    res.status(500).json({ error: "Error al agregar mensaje" });
  }
});


router.put("/chat/marcar-leidos", async (req, res) => {
  try {
    const result = await req.db.collection("respuestas").updateMany(
      { "mensajes.leido": false },
      { $set: { "mensajes.$[].leido": true } }
    );

    res.json({
      message: "Todos los mensajes fueron marcados como leídos",
      result,
    });
  } catch (err) {
    console.error("Error al marcar mensajes como leídos:", err);
    res.status(500).json({ error: "Error al marcar mensajes como leídos" });
  }
});

// Subir corrección PDF
router.post("/:id/upload-correction", upload.single('correctedFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se subió ningún archivo" });
    }

    const correctionData = {
      fileName: req.file.originalname,
      fileData: req.file.buffer,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date()
    };

    await req.db.collection("respuestas").updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: { 
          correctedFile: correctionData,
          updatedAt: new Date()
        } 
      }
    );

    res.json({ 
      message: "Corrección subida correctamente",
      fileName: correctionData.fileName,
      fileSize: correctionData.fileSize
    });
  } catch (err) {
    console.error("Error subiendo corrección:", err);
    res.status(500).json({ error: "Error subiendo corrección" });
  }
});

// Aprobar formulario y guardar en aprobados
router.post("/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    
    const respuesta = await req.db.collection("respuestas").findOne({ _id: new ObjectId(id) });
    
    if (!respuesta.correctedFile) {
      return res.status(400).json({ error: "No hay corrección subida para aprobar" });
    }

    await req.db.collection("respuestas").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: "aprobado",
          approvedAt: new Date()
        } 
      }
    );

    await req.db.collection("aprobados").insertOne({
      responseId: id,
      correctedFile: respuesta.correctedFile,
      approvedAt: new Date(),
      approvedBy: req.user?.id,
      createdAt: new Date(),
      formTitle: respuesta.formTitle,
      submittedBy: respuesta.submittedBy,
      company: respuesta.company
    });

    res.json({ message: "Formulario aprobado correctamente" });
  } catch (err) {
    console.error("Error aprobando formulario:", err);
    res.status(500).json({ error: "Error aprobando formulario" });
  }
});

module.exports = router;