const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

// Importar rutas
const authRoutes = require("./auth");
const formRoutes = require("./forms");
const answersRoutes = require("./answers");
const mailRoutes = require("./mail");
const gen = require("./Generador");
const noti = require("./notificaciones");

const app = express();
//actualizando
// Configuración CORS
app.use(cors());

app.use(express.json());

// Configurar conexión a MongoDB (desde variable de entorno)
const client = new MongoClient(process.env.MONGO_URI);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("formsdb");
    console.log("Conectado a MongoDB");
  }
  return db;
}

// Middleware para inyectar la base de datos en cada request
app.use(async (req, res, next) => {
  try {
    req.db = await connectDB();
    next();
  } catch (err) {
    console.error("Error al conectar con MongoDB:", err);
    res.status(500).json({ error: "Error con base de datos" });
  }
});

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/respuestas", answersRoutes);
app.use("/api/mail", mailRoutes);
app.use("/api/generador", gen);
app.use("/api/noti", noti);

// Ruta base
app.get("/", (req, res) => {
  res.json({ message: "API funcionando" });
});

// Exportar la app para que Vercel la maneje como serverless function
module.exports = app;