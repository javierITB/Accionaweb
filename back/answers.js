const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { addNotification } = require("./notificaciones.helper");
const { generarAnexoDesdeRespuesta } = require("./generador.helper");

// Crear un formulario
router.post("/", async (req, res) => {
  try {
    const result = await req.db.collection("respuestas").insertOne({
      ...req.body,
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
      titulo: `El usuario ${usuario} de la empresa ${empresa} ha respondido el formulario ${nombreFormulario}`,
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
      
      // Verificar campos críticos
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
      console.log("⚠️ ADVERTENCIA: No hay req.body.responses");
    }

    try {
      await generarAnexoDesdeRespuesta(
        req.body.responses,
        result.insertedId.toString(),
        req.db
      );
      console.log('✅ DOCX generado automáticamente para respuesta:', result.insertedId);
    } catch (error) {
      console.error('❌ Error generando DOCX automáticamente:', error.message);
      console.error('Stack trace:', error.stack);
      // No fallar toda la operación por error en DOCX
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

// Listar todos los formularios
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

// Obtener un formulario por ID (Mongo ObjectId)
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

// Actualizar un formulario
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

// Publicar un formulario (cambiar status de draft → published)
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

// Eliminar un formulario
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

module.exports = router;