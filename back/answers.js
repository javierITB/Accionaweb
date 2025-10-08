const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

// Crear un formulario
router.post("/", async (req, res) => {
  try {
    const result = await req.db.collection("respuestas").insertOne({
      ...req.body,
      createdAt: new Date()
    });

    res.json({ _id: result.insertedId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: "Error al guardar respuesta" });
  }
});


router.get("/", async (req, res) => {
  try {
    const db = req.db;
    const respuestas = await db.collection("respuestas").find().toArray();

    // Normalizar formId a string (evita mismatches ObjectId vs string)
    const formIdStrings = [...new Set(
      respuestas
        .map(r => {
          if (!r.formId) return null;
          // si viene como ObjectId -> toString() o toHexString()
          try {
            return typeof r.formId === "string" ? r.formId : r.formId.toString();
          } catch (e) {
            return String(r.formId);
          }
        })
        .filter(Boolean)
    )];

    // Filtrar sólo los ids válidos para ObjectId
    const validObjectIds = formIdStrings.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));

    const forms = validObjectIds.length > 0
      ? await db.collection("form").find({ _id: { $in: validObjectIds } }).toArray()
      : [];

    const formMap = Object.fromEntries(forms.map(f => [f._id.toString(), f]));

    const respuestasConForm = respuestas.map(r => {
      const key = r.formId ? (typeof r.formId === "string" ? r.formId : r.formId.toString()) : null;
      return {
        ...r,
        formData: key ? (formMap[key] || null) : null
      };
    });

    res.json(respuestasConForm);
  } catch (err) {
    console.error("Error al obtener respuestas con formularios:", err);
    res.status(500).json({ error: "Error al obtener respuestas con formularios asociados" });
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
  console.log("BORRAR AQUI")
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