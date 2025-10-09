const express = require("express");
const router = express.Router();
const crypto = require("crypto");

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

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("AQUI LOS IDEADOS")
    const user = await req.db
      .collection("usuarios")
      .findOne({ mail: email, pass: password });

    console.log(user);
    
    if (!user) return res.status(401).json({ success: false, message: "Credenciales inválidas" });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION);

      const usr = { name: user.nombre, email, cargo:user.cargo};
      activeTokens.push({ token, usr, expiresAt });

      return res.json({ success: true, token, usr });

    
  } catch (err) {
    return res.status(505).json({ error: "Error al obtener usuario", msg: err});
  }


});

// Validación de token con match de usuario
router.post("/validate", (req, res) => {
  const { token, email } = req.body;
  console.log(activeTokens);
  if (!token || !email) {
    return res.status(401).json({ valid: false, message: "Faltan token o usuario" });
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

  return res.json({ valid: true, user: tokenRecord.user });
});

// Logout
router.post("/logout", (req, res) => {
  const { token } = req.body;
  activeTokens = activeTokens.filter((t) => t.token !== token);
  res.json({ success: true });
});

module.exports = router;