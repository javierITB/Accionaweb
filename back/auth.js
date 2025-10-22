const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { ObjectId } = require('mongodb');
const multer = require('multer');

let activeTokens = [];
const TOKEN_EXPIRATION = 1000 * 60 * 60;

// Configurar Multer para almacenar logos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

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
      pass: "",
      estado: estado,
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
    if (existingUser.estado !== "pendiente") {
      return res.status(400).json({ 
        error: "La contraseña ya fue establecida anteriormente. Si necesitas cambiarla, contacta al administrador." 
      });
    }
    const result = await req.db.collection("usuarios").updateOne(
      { 
        _id: new ObjectId(userId),
        estado: "pendiente"
      },
      { 
        $set: { 
          pass: password,
          estado: "activo",
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

// EMPRESAS ENDPOINTS

// GET - Obtener todas las empresas
router.get("/empresas/todas", async (req, res) => {
  try {
    const empresas = await req.db.collection("empresas").find().toArray();
    res.json(empresas);
  } catch (err) {
    console.error("Error obteniendo empresas:", err);
    res.status(500).json({ error: "Error al obtener empresas" });
  }
});

// GET - Obtener empresa por ID
router.get("/empresas/:id", async (req, res) => {
  try {
    const empresa = await req.db.collection("empresas").findOne({ 
      _id: new ObjectId(req.params.id) 
    });

    if (!empresa) {
      return res.status(404).json({ error: "Empresa no encontrada" });
    }

    res.json(empresa);
  } catch (err) {
    console.error("Error obteniendo empresa:", err);
    res.status(500).json({ error: "Error al obtener empresa" });
  }
});

// POST - Registrar nueva empresa
router.post("/empresas/register", upload.single('logo'), async (req, res) => {
  try {
    console.log("Debug: Iniciando registro de empresa");
    console.log("Debug: Datos recibidos:", req.body);

    const { nombre, rut, direccion, encargado } = req.body;

    if (!nombre || !rut) {
      return res.status(400).json({ error: "Nombre y RUT son obligatorios" });
    }

    const empresaExistente = await req.db.collection("empresas").findOne({
      $or: [
        { nombre: nombre.trim() },
        { rut: rut.trim() }
      ]
    });

    if (empresaExistente) {
      const campoDuplicado = empresaExistente.nombre === nombre.trim() ? 'nombre' : 'RUT';
      return res.status(400).json({ 
        error: `Ya existe una empresa con el mismo ${campoDuplicado}` 
      });
    }

    const empresaData = {
      nombre: nombre.trim(),
      rut: rut.trim(),
      direccion: direccion ? direccion.trim() : '',
      encargado: encargado ? encargado.trim() : '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (req.file) {
      empresaData.logo = {
        fileName: req.file.originalname,
        fileData: req.file.buffer,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date()
      };
    }

    const result = await req.db.collection("empresas").insertOne(empresaData);

    console.log("Debug: Empresa registrada exitosamente, ID:", result.insertedId);

    const nuevaEmpresa = await req.db.collection("empresas").findOne({
      _id: result.insertedId
    });

    res.status(201).json({
      message: "Empresa registrada exitosamente",
      empresa: nuevaEmpresa
    });

  } catch (err) {
    console.error("Error registrando empresa:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({ error: "Empresa duplicada" });
    }
    
    res.status(500).json({ error: "Error al registrar empresa: " + err.message });
  }
});

// PUT - Actualizar empresa
router.put("/empresas/:id", upload.single('logo'), async (req, res) => {
  try {
    const { nombre, rut, direccion, encargado } = req.body;

    const updateData = {
      nombre: nombre.trim(),
      rut: rut.trim(),
      direccion: direccion ? direccion.trim() : '',
      encargado: encargado ? encargado.trim() : '',
      updatedAt: new Date()
    };

    if (req.file) {
      updateData.logo = {
        fileName: req.file.originalname,
        fileData: req.file.buffer,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date()
      };
    }

    const result = await req.db.collection("empresas").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Empresa no encontrada" });
    }

    const empresaActualizada = await req.db.collection("empresas").findOne({
      _id: new ObjectId(req.params.id)
    });

    res.json({
      message: "Empresa actualizada exitosamente",
      empresa: empresaActualizada
    });

  } catch (err) {
    console.error("Error actualizando empresa:", err);
    res.status(500).json({ error: "Error al actualizar empresa" });
  }
});

// DELETE - Eliminar empresa
router.delete("/empresas/:id", async (req, res) => {
  try {
    const result = await req.db.collection("empresas").deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Empresa no encontrada" });
    }

    res.json({ message: "Empresa eliminada exitosamente" });

  } catch (err) {
    console.error("Error eliminando empresa:", err);
    res.status(500).json({ error: "Error al eliminar empresa" });
  }
});

module.exports = router;