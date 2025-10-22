const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const nodemailer = require("nodemailer");

// Rutas
const authRoutes = require("./auth");
const formRoutes = require("./forms");
const answersRoutes = require("./answers");
const mailRoutes = require("./mail");
const gen = require("./Generador");
const noti = require("./notificaciones");

const app = express();
app.use(cors());
app.use(express.json());

// Conexión Mongo (usa variable de entorno en producción)
const client = new MongoClient(process.env.MONGO_URI);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("formsdb");
    console.log("✅ Conectado a MongoDB");
  }
  return db;
}

// Middleware de conexión
app.use(async (req, res, next) => {
  try {
    req.db = await connectDB();
    next();
  } catch (err) {
    console.error("❌ Error al conectar con MongoDB:", err);
    res.status(500).json({ error: "Error con base de datos" });
  }
});

// Tu código SMTP (si lo usas)
console.log("✅ Servidor SMTP listo para enviar correos");

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/respuestas", answersRoutes);
app.use("/api/mail", mailRoutes);
app.use("/api/generador", gen);
app.use("/api/noti", noti);

app.get("/", (req, res) => {
  res.json({ message: "API funcionando 🚀" });
});

// ❌ NO pongas app.listen()
// ✅ Exporta la app
module.exports = app;
