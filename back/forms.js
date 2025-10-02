const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

// Crear un formulario
router.post("/", async (req, res) => {
  try {
    data = req.body;
    let result;
    if (!data.id){
      result = await req.db.collection("forms").insertOne({
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    } else {
      result = await req.db.collection("forms").findOneAndUpdate(
        { _id: new ObjectId(data.id)},
        { $set: { ...req.body, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
      if (!result.value) return res.status(404).json({ error: "Formulario no encontrado" });
    }
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: "Error al crear formulario, error: ", err });
  }
});

// Listar todos los formularios
router.get("/", async (req, res) => {
  try {
    const forms = await req.db.collection("forms").find().toArray();
    res.json(forms);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener formularios" });
  }
});

// Obtener un formulario por ID (Mongo ObjectId)
router.get("/:id", async (req, res) => {
  try {
    const form = await req.db
      .collection("forms")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!form) return res.status(404).json({ error: "Formulario no encontrado" });
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener formulario" });
  }
});

// Actualizar un formulario
router.put("/:id", async (req, res) => {
  try {
    const result = await req.db.collection("forms").findOneAndUpdate(
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

// Eliminar un formulario
router.delete("/:id", async (req, res) => {
  console.log("BORRAR AQUI")
  try {
    const result = await req.db
      .collection("forms")
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
