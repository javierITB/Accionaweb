const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

// Crear notificación para un usuario
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const { userId, titulo, descripcion, prioridad = 1, color = "#f5872dff", icono = "paper" } = data;

    if (!userId || !titulo || !descripcion) {
      return res.status(400).json({ error: "Faltan campos requeridos: userId, titulo, descripcion" });
    }

    // Construir la notificación
    const notificacion = {
      id: new ObjectId().toString(),  // Genera un ID único
      titulo,
      leido: false,
      descripcion,
      prioridad,
      fecha_creacion: new Date(),
      color,
      icono,
    };

    // Inyectar la notificación en el array de notificaciones del usuario
    const result = await req.db.collection("usuarios").findOneAndUpdate(
      { id: userId },
      { $push: { notificaciones: notificacion } },
      { returnDocument: "after" }
    );
    
    if (!result) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear notificación", detalles: err.message });
  }
});

// Listar notificaciones de un usuario
router.get("/:user", async (req, res) => {
  try {
    const users = await req.db.collection("usuarios")
      .find({ nombre: req.params.user }, { projection: { notificaciones: 1 } })
      .toArray();

    if (!users.length) return res.status(404).json({ error: "Usuario no encontrado" });

    // Si quieres devolver todas las notificaciones de todos los usuarios que coincidan
    const allNotis = users.flatMap(u => u.notificaciones || []);
    res.json(allNotis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
});

router.put("/:userId/:notiId/leido", async (req, res) => {
  try {
    const result = await req.db.collection("usuarios").findOneAndUpdate(
      { _id: new ObjectId(req.params.userId), "notificaciones.id": req.params.notiId },
      { $set: { "notificaciones.$.leido": true } },
      { returnDocument: "after" }
    );

    if (!result.value) return res.status(404).json({ error: "Usuario o notificación no encontrada" });

    res.json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al marcar notificación como leída" });
  }
});

// Eliminar notificación
router.delete("/:userId/:notiId", async (req, res) => {
  try {
    const result = await req.db.collection("usuarios").findOneAndUpdate(
      { _id: new ObjectId(req.params.userId) },
      { $pull: { notificaciones: { id: req.params.notiId } } },
      { returnDocument: "after" }
    );

    if (!result.value) return res.status(404).json({ error: "Usuario o notificación no encontrada" });

    res.json({ message: "Notificación eliminada", usuario: result.value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar notificación" });
  }
});

module.exports = router;
