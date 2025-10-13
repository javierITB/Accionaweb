const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { ObjectId } = require('mongodb');

let activeTokens = [];
const TOKEN_EXPIRATION = 1000 * 60 * 60; // 1 hora

router.get("/", async (req, res) => {
  try {
    const usr = await req.db.collection("usuarios").find().toArray();
    res.json(usr);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

router.get("/:name", async (req, res) => {
  try {
    const usr = await req.db
      .collection("usuarios")
      .findOne({ nombre: req.params.name});

    if (!usr) return res.status(404).json({ error: "Usuario no encontrado" });
    
    res.json({id: usr.id, empresa: usr.empresa, cargo: usr.cargo});
  } catch (err) {
    res.status(500).json({ error: "Error al obtener Usuario" });
  }
});

// Login - MEJORADO CON SEGURIDAD Y NOMBRE COMPLETO
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await req.db
      .collection("usuarios")
      .findOne({ mail: email });

    if (!user) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
    
    if (user.pass === "pending") {
      return res.status(401).json({ 
        success: false, 
        message: "Usuario pendiente de activación. Revisa tu correo." 
      });
    }

    if (user.pass !== password) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION);

    const usr = { 
      name: `${user.nombre} ${user.apellido}`, 
      email, 
      cargo: user.cargo 
    };
    activeTokens.push({ token, usr, expiresAt });

    return res.json({ success: true, token, usr });

  } catch (err) {
    return res.status(505).json({ error: "Error al obtener usuario", msg: err});
  }
});

// Validación de token con match de usuario
router.post("/validate", (req, res) => {
  const { token, email, cargo } = req.body;
  console.log(activeTokens);
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

  // Verificar que el token corresponde al usuario enviado
  if (tokenRecord.usr.email !== email) {
    return res.status(401).json({ valid: false, message: "Token no corresponde al usuario" });
  }

  if (tokenRecord.usr.cargo !== cargo) {
    return res.status(401).json({ valid: false, message: "Cargo no corresponde al usuario" });
  }
  
  return res.json({ valid: true, user: tokenRecord.user });
});

// Logout
router.post("/logout", (req, res) => {
  const { token } = req.body;
  activeTokens = activeTokens.filter((t) => t.token !== token);
  res.json({ success: true });
});

// ==============================================
// NUEVAS RUTAS AGREGADAS
// ==============================================

// Ruta para registrar usuario (sin contraseña)
router.post("/register", async (req, res) => {
  try {
    const { nombre, apellido, mail, empresa, cargo, rol } = req.body;

    // Validar campos obligatorios
    if (!nombre || !apellido || !mail || !empresa || !cargo || !rol) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // Verificar si el usuario ya existe
    const existingUser = await req.db.collection("usuarios").findOne({ mail });
    if (existingUser) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    // Crear nuevo usuario con contraseña pendiente
    const newUser = {
      nombre,
      apellido,
      mail,
      empresa,
      cargo,
      rol,
      pass: "pending", // Marcamos que la contraseña está pendiente
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Insertar en la base de datos
    const result = await req.db.collection("usuarios").insertOne(newUser);

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      user: {
        _id: new ObjectId(req.params.id) ,
        ...newUser
      }
    });

  } catch (err) {
    console.error("Error al registrar usuario:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta para establecer contraseña
router.post("/set-password", async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ error: "UserId y contraseña son requeridos" });
    }

    // Validar longitud mínima de contraseña
    if (password.length < 4) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres" });
    }

    // Actualizar el usuario con la contraseña
    const result = await req.db.collection("usuarios").updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          pass: password,
          updatedAt: new Date().toISOString()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ 
      success: true, 
      message: "Contraseña establecida exitosamente" 
    });

  } catch (error) {
    console.error("Error al establecer contraseña:", error);
    
    // Manejar error de ObjectId inválido
    if (error.message.includes("ObjectId")) {
      return res.status(400).json({ error: "ID de usuario inválido" });
    }
    
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;