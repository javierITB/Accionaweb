const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const authRoutes = require("./auth");
const formRoutes = require("./forms");
const answersRoutes = require("./answers")
const mailRoutes = require("./mail");
const gen = require("./Generador");
const noti = require("./notificaciones");


const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Función para conectar a Mongo y arrancar el server
async function startServer() {
  try {
    const client = new MongoClient("mongodb://127.0.0.1:27017");
    await client.connect();
    console.log("✅ Conectado a MongoDB");

    const db = client.db("formsdb");

    // Inyectamos db en cada request
    app.use((req, res, next) => {
      req.db = db;
      next();
    });

    // Rutas
    app.use("/api/auth", authRoutes);
    app.use("/api/forms", formRoutes);
    app.use("/api/respuestas", answersRoutes);
    app.use("/api/mail", mailRoutes);
    app.use("/api/generador", gen);
    app.use("/api/noti", noti);


    app.get("/", (req, res) => {
      res.send({ message: "API funcionando 🚀" });
    });

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ Error al conectar a MongoDB:", err);
    process.exit(1);
  }
}

startServer();
