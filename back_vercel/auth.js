const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { ObjectId } = require('mongodb');

let activeTokens = [];
const TOKEN_EXPIRATION = 1000 * 60 * 60;

router.get("/", async (req, res) => {
  try {
    const usr = await req.db.collection("usuarios").find().toArray();
    res.json(usr);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});


router.get("/:mail", async (req, res) => {
  try {
    const usr = await req.db
      .collection("usuarios")
      .findOne({ mail: req.params.mail});

    if (!usr) return res.status(404).json({ error: "Usuario no encontrado" });
    
    res.json({id: usr._id, empresa: usr.empresa, cargo: usr.cargo});
  } catch (err) {
    res.status(500).json({ error: "Error al obtener Usuario" });
  }
});


router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await req.db
      .collection("usuarios")
      .findOne({ mail: email });

    if (!user) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
    
    // ✅ CAMBIO IMPORTANTE: Validar por estado en lugar de por contraseña
    if (user.estado === "pendiente") {
      return res.status(401).json({ 
        success: false, 
        message: "Usuario pendiente de activación. Revisa tu correo para establecer tu contraseña." 
      });
    }

    if (user.estado === "inactivo") {
      return res.status(401).json({ 
        success: false, 
        message: "Usuario inactivo. Contacta al administrador." 
      });
    }

    // ✅ Ahora la contraseña puede ser cualquier valor, incluso "pending"
    if (user.pass !== password) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION);

    const usr = { 
      name: `${user.nombre}`, 
      email, 
      cargo: user.cargo 
    };
    activeTokens.push({ token, usr, expiresAt });

    return res.json({ success: true, token, usr });

  } catch (err) {
    return res.status(505).json({ error: "Error al obtener usuario", msg: err});
  }
});


router.post("/validate", (req, res) => {
  const { token, email, cargo } = req.body; 
  if (!token || !email || !cargo) {
    return res.status(401).json({ valid: false, message: "Acceso inválido" });
  }
  const tokenRecord = activeTokens.find((t) => t.token === token);
  if (!tokenRecord) {
    return res.status(401).json({ valid: false, message: "Token inválido" });
  }
  const now = new Date();
  if (tokenRecord.expiresAt < now) {
    activeTokens = activeTokens.filter((t) => t.token !== token);
    return res.status(401).json({ valid: false, message: "Token expirado" });
  }
  if (tokenRecord.usr.email !== email) {
    return res.status(401).json({ valid: false, message: "Token no corresponde al usuario" });
  }
  if (tokenRecord.usr.cargo !== cargo) {
    return res.status(401).json({ valid: false, message: "Cargo no corresponde al usuario" });
  }
  return res.json({ valid: true, user: tokenRecord.user });
});


router.post("/logout", (req, res) => {
  const { token } = req.body;
  activeTokens = activeTokens.filter((t) => t.token !== token);
  res.json({ success: true });
});


router.post("/register", async (req, res) => {
  try {
    const { nombre, apellido, mail, empresa, cargo, rol, estado } = req.body;
    if (!nombre || !apellido || !mail || !empresa || !cargo || !rol) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }
    const existingUser = await req.db.collection("usuarios").findOne({ mail });
    if (existingUser) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }
    const newUser = {
      nombre,
      apellido,
      mail,
      empresa,
      cargo,
      rol,
      pass: "", // ✅ CAMBIO: Contraseña vacía inicialmente
      estado: estado, // ✅ NUEVO CAMPO: estado del usuario
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const result = await req.db.collection("usuarios").insertOne(newUser);
    const createdUser = await req.db.collection("usuarios").findOne({ 
      _id: result.insertedId 
    });
    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      user: createdUser
    });
  } catch (err) {
    console.error("Error al registrar usuario:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


router.post("/set-password", async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ error: "UserId y contraseña son requeridos" });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres" });
    }
    const existingUser = await req.db.collection("usuarios").findOne({ 
      _id: new ObjectId(userId) 
    });
    if (!existingUser) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    // ✅ CAMBIO: Validar por estado en lugar de por contraseña
    if (existingUser.estado !== "pendiente") {
      return res.status(400).json({ 
        error: "La contraseña ya fue establecida anteriormente. Si necesitas cambiarla, contacta al administrador." 
      });
    }
    const result = await req.db.collection("usuarios").updateOne(
      { 
        _id: new ObjectId(userId),
        estado: "pendiente" // ✅ Solo permitir si está pendiente
      },
      { 
        $set: { 
          pass: password,
          estado: "activo", // ✅ Cambiar estado a activo
          updatedAt: new Date().toISOString()
        } 
      }
    );
    if (result.matchedCount === 0) {
      return res.status(400).json({ 
        error: "No se puede establecer la contraseña. Ya fue configurada anteriormente o el enlace expiró." 
      });
    }
    res.json({ 
      success: true, 
      message: "Contraseña establecida exitosamente" 
    });

  } catch (error) {
    console.error("Error al establecer contraseña:", error);
    if (error.message.includes("ObjectId")) {
      return res.status(400).json({ error: "ID de usuario inválido" });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;