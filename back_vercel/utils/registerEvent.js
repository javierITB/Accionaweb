async function registerEvent(req, actor, event) {
   const payload = {
      ...event,
      actor: {
         uid: actor?.uid?.toString() || null,
         name: actor?.nombre || "desconocido",
         last_name: actor?.apellido || "desconocido",
         role: actor?.rol || "desconocido",
         email: actor?.mail || "desconocido",
         empresa: actor?.empresa || "desconocido",
         cargo: actor?.cargo || "desconocido",
         estado: actor?.estado || "desconocido",
      },

      createdAt: new Date(),
   };

   const collection = req.db.collection("cambios");
   const result = await collection.insertOne(payload);

   if (!result.insertedId) {
      throw new Error("Error al registrar evento");
   }
}

export async function registerStatusChangeEvent(req, { updatedResponse, auth, result, error = null }) {
   const userData = auth?.data?.usuario || {};

   let description = "Cambio de estado de solicitud";

   registerEvent(req, userData, {
      code: CODES.SOLICITUD_CAMBIO_ESTADO,
      target: {
         type: TARGET_TYPES.SOLICITUD,
         _id: updatedResponse?._id?.toString() || null,
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

export async function registerRegenerateDocumentEvent(req, { respuesta, auth, result, error = null }) {
   const userData = auth?.data?.usuario || {};

   let description = "Regeneración de documento de solicitud";

   registerEvent(req, userData, {
      code: CODES.SOLICITUD_REGENERACION_DOCUMENTO,
      target: {
         type: TARGET_TYPES.SOLICITUD,
         _id: respuesta?._id.toString() || null,
      },

      description: respuesta ? `${description} "${respuesta?.formTitle}"` : description + " desconocida",
      metadata: {
         nombre_de_solicitud: respuesta?.formTitle,
      },
      result,
      ...(error && { error_message: error.message }),
   });
}

// results
export const RESULTS = {
   SUCCESS: "success",
   ERROR: "error",
};

// codes
const CODES = {
   SOLICITUD_CAMBIO_ESTADO: "SOLICITUD_CAMBIO_ESTADO",
   SOLICITUD_REGENERACION_DOCUMENTO: "SOLICITUD_REGENERACION_DOCUMENTO",
};

// target types
const TARGET_TYPES = {
   SOLICITUD: "solicitud",
};

// actor roles
const ACTOR_ROLES = {
   ADMIN: "admin",
};

// metadata

const STATUS = {
   PENDIENTE: "pendiente",
   EN_REVISION: "en_revisión",
   APROBADA: "aprobada",
   FIRMADA: "firmada",
   FINALIZADA: "finalizada",
   ARCHIVADA: "archivada",
};
