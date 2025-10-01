const express = require("express");
const cors = require("cors");
const authRoutes = require("./auth"); // <- importa el router
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send({ message: "API funcionando 🚀" });
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
