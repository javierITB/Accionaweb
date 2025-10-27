const express = require("express");
const router = express.Router();


router.post("/filter", async (req, res) => {
  try {
    const { mail, token, cargo } = req.body;
    
    if (!mail || !token || !cargo) {
        return res.status(400).json({ error: "Faltan parámetros de autenticación (mail, token, cargo)." });
    }
    
    const allowedCargos = [cargo, 'all'];

    const menuItems = await req.db.collection('menu').find({
        cargos: { $in: allowedCargos }
    }).toArray();
    
    res.json(menuItems);

  } catch (err) {
    console.error("Error filtrando elementos del menú:", err);
    res.status(500).json({ error: "Error interno al filtrar el menú" });
  }
});

module.exports = router;