const { decrypt } = require("./seguridad.helper");

async function getTokenWithUserData(db, token) {
   try {
      const tokenDataArray = await db
   .collection("tokens")
   .aggregate([
      // ETAPA 1: FILTRAR por token exacto (token es único)
      {
         $match: {
            token: token, // Busca documento con este token hash
         },
      },

      // ETAPA 2: JOIN con colección usuarios (LEFT JOIN equivalente)
      {
         $lookup: {
            from: "usuarios", // Tabla a unir
            let: { userIdStr: "$userId" }, // Guarda userId del token como variable
            pipeline: [ // Filtros y transformaciones para usuarios
               {
                  $match: {
                     $expr: {
                        $and: [ // 4 validaciones para seguridad:
                           // 1. userId no es null
                           { $ne: ["$$userIdStr", null] },
                           // 2. userId no es string vacío
                           { $ne: ["$$userIdStr", ""] },
                           // 3. userId tiene formato ObjectId válido (24 hex)
                           { $regexMatch: { input: "$$userIdStr", regex: /^[0-9a-fA-F]{24}$/ } },
                           // 4. Compara _id de usuario con userId convertido
                           { $eq: ["$_id", { $toObjectId: "$$userIdStr" }] },
                        ],
                     },
                  },
               },
               // Selecciona solo estos campos del usuario
               {
                  $project: {
                     _id: 0, // Excluye el ObjectId original
                     cargo: 1, // Incluye cargo
                     rol: 1, // Incluye rol
                     estado: 1, // Incluye estado
                     nombre: 1, // Incluye nombre
                     apellido: 1, // Incluye apellido
                     mail: 1, // Incluye mail
                     empresa: 1, // Incluye empresa
                     uid: { $toString: "$_id" }, // Convierte _id a string como uid
                  },
               },
            ],
            as: "usuario", // Guarda resultado en campo "usuario" como array
         },
      },

      // ETAPA 3: Convertir array a objeto (desenrollar)
      {
         $unwind: {
            path: "$usuario", // Campo array a convertir
            preserveNullAndEmptyArrays: true, // Mantiene token aunque no tenga usuario
         },
      },
   ])
   .toArray(); // Ejecuta query y convierte a array JavaScript

      // Retornar el primer elemento o null (mismo comportamiento que findOne)
      return tokenDataArray.length > 0 ? tokenDataArray[0] : null;
      
   } catch (error) {
      console.error("Error en obtenerTokenConUsuario:", error);
      // Fallback a la consulta simple si hay error
      return await db.collection("tokens").findOne({ token: token });
   }
}

function processUserDataCiphered(userData) {
    if (!userData) return null;
    
    const usuarioProcesado = { ...userData };
    const camposADescifrar = ['nombre', 'apellido', 'mail', 'cargo', 'empresa', 'estado', 'rol'];
    
    for (const campo of camposADescifrar) {
        if (usuarioProcesado[campo] && usuarioProcesado[campo].includes(':')) {
            try {
                usuarioProcesado[campo] = decrypt(usuarioProcesado[campo]);
            } catch (error) {
                console.error(`Error descifrando ${campo} del usuario:`, error);
            }
        }
    }
    
    return usuarioProcesado;
}

module.exports = {
   getTokenWithUserData,
   processUserDataCiphered
};