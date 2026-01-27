async function registerEvent(req, event) {
   const payload = {
      ...event,
      createdAt: new Date(),
   };

   const collection = req.db.collection("cambios");
   const result = await collection.insertOne(payload);

   if (!result.insertedId) {
      throw new Error("Error al registrar evento");
   }
}

export async function registerStatusChangeEvent(req, { updatedResponse, auth, result, error = null }) {
   const actor = auth?.data || {};

   let description = "Cambio de estado de solicitud";

   await registerEvent(req, {
      code: CODES.SOLICITUD_CAMBIO_ESTADO,
      target: {
         type: TARGET_TYPES.SOLICITUD,
         _id: updatedResponse?._id?.toString() || null,
      },
      actor: {
         uid: updatedResponse?.user?.uid?.toString() || null,
         name: updatedResponse?.user?.nombre || "desconocido",
         role: actor?.rol || "desconocido",
         email: actor?.email || "desconocido",
         empresa: updatedResponse?.user?.empresa || "desconocido",
      },
      description: updatedResponse
         ? `${description} "${updatedResponse?.formTitle}" a ${updatedResponse?.status}`
         : description + " desconocida",
      metadata: {
         nombre_de_solicitud: updatedResponse?.formTitle || "desconocido",
         nuevo_estado: updatedResponse?.status || "desconocido",
      },

      result,
      ...(error && { error_message: error.message }),
   });
}

// codes
export const CODES = {
   SOLICITUD_CAMBIO_ESTADO: "SOLICITUD_CAMBIO_ESTADO",
   SOLICITUD_REGENERACION_DOCUMENTO: "SOLICITUD_REGENERACION_DOCUMENTO",
};

// target types
export const TARGET_TYPES = {
   SOLICITUD: "solicitud",
};

// actor roles
export const ACTOR_ROLES = {
   ADMIN: "admin",
};

// results
export const RESULTS = {
   SUCCESS: "success",
   ERROR: "error",
};

// metadata

export const STATUS = {
   PENDIENTE: "pendiente",
   EN_REVISION: "en_revisión",
   APROBADA: "aprobada",
   FIRMADA: "firmada",
   FINALIZADA: "finalizada",
   ARCHIVADA: "archivada",
};
