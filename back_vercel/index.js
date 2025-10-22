const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const authRoutes = require("./auth");
const formRoutes = require("./forms");
const answersRoutes = require("./answers");
const mailRoutes = require("./mail");
const gen = require("./Generador");
const noti = require("./notificaciones");

const app = express();
app.use(cors());
app.use(express.json());

// --- Conexión MongoDB (solo si estás usando cluster externo, no localhost)
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

// Middleware para inyectar DB
app.use(async (req, res, next) => {
  try {
    req.db = await connectDB();
    next();
  } catch (err) {
    console.error("❌ Error de conexión DB:", err);
    res.status(500).json({ error: "Error al conectar con la base de datos" });
  }
});

// --- Rutas
app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/respuestas", answersRoutes);
app.use("/api/mail", mailRoutes);
app.use("/api/generador", gen);
app.use("/api/noti", noti);

app.get("/", (req, res) => {
  res.send({ message: "API funcionando 🚀" });
});

// --- En Vercel, exportamos el handler en lugar de escuchar puerto
module.exports = app;
