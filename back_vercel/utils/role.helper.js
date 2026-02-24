async function getRoleLevel(db, roleName) {
    if (!roleName) return 10; // Nivel más bajo por defecto
    const normalizedName = roleName.toLowerCase().trim();
    if (normalizedName === "maestro") return 100;

    try {
        const role = await db.collection("roles").findOne({
            name: { $regex: new RegExp(`^${normalizedName}$`, "i") },
        });

        if (role && role.level !== undefined && role.level !== null) {
            return Number(role.level);
        }

        // Retrocompatibilidad
        if (normalizedName === "administrador") return 90;
        
        return 10; // Rango base para roles custom sin level
    } catch (error) {
        console.error("Error al obtener el nivel del rol:", error);
        return 10; 
    }
}

module.exports = { getRoleLevel };
