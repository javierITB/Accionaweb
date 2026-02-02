const { getActor, encryptObject } = require("./registerEvent.helper.js");
const { encrypt, decrypt } = require("../utils/seguridad.helper");

async function registerEvent(req, auth, event, metadata = {}, descriptionBuilder = null) {
   const actor = await getActor(req, auth);

   const description = typeof descriptionBuilder === "function" ? descriptionBuilder(actor) || "" : event.description;
   const finalDescription =
      typeof description === "string" && description.trim() !== "" && !description.includes(":")
         ? encrypt(description)
         : description;

   const payload = {
      ...event,
      actor,
      description: finalDescription,
      metadata: metadata && Object.keys(metadata).length ? encryptObject(metadata) : metadata,
      createdAt: new Date(),
   };

   const collection = req.db.collection("cambios");
   const result = await collection.insertOne(payload);

   if (!result.insertedId) {
      throw new Error("Error al registrar evento");
   }
}

async function registerSolicitudCreationEvent(req, auth, description = "", metadata = {}) {
   const payload = {
      code: CODES.SOLICITUD_CREACION,
      target: {
         type: TARGET_TYPES.SOLICITUD,
      },
      description,
   };

   await registerEvent(req, auth, payload, metadata);
}

async function registerSolicitudRemovedEvent(req, auth, metadata = {}) {
   const descriptionBuilder = (actor) =>
      `${decrypt(actor?.name) || "desconocido"} ${decrypt(actor?.last_name) || ""} eliminó una solicitud`;

   const payload = {
      code: CODES.SOLICITUD_ELIMINACION,
      target: {
         type: TARGET_TYPES.SOLICITUD,
      },
   };

   await registerEvent(req, auth, payload, metadata, descriptionBuilder);
}

async function registerTicketCreationEvent(req, auth, description = "", metadata = {}) {
   const payload = {
      code: CODES.TICKET_CREACION,
      target: {
         type: TARGET_TYPES.TICKET,
      },
      description,
   };

   await registerEvent(req, auth, payload, metadata);
}

async function registerTicketRemovedEvent(req, auth, metadata = {}) {
   const descriptionBuilder = (actor) =>
      `${decrypt(actor?.name) || "desconocido"} ${decrypt(actor?.last_name) || ""} eliminó un ticket`;
   const payload = {
      code: CODES.TICKET_ELIMINACION,
      target: {
         type: TARGET_TYPES.TICKET,
      },
   };
   await registerEvent(req, auth, payload, metadata, descriptionBuilder);
}

async function registerDomicilioVirtualRemovalEvent(req, auth, metadata = {}) {
   const descriptionBuilder = (actor) =>
      `${decrypt(actor?.name) || "desconocido"} ${decrypt(actor?.last_name) || ""} eliminó una solicitud de domicilio virtual`;
   const payload = {
      code: CODES.DOMICILIOV_ELIMINACION,
      target: {
         type: TARGET_TYPES.SOLICITUD,
      },
   };
   await registerEvent(req, auth, payload, metadata, descriptionBuilder);
}

async function registerUserUpdateEvent(req, auth, profileData = {}) {
   const { nombre, apellido, mail, empresa, cargo, rol, estado } = profileData;
   const metadata = { Usuario: { nombre, apellido, mail, empresa, cargo, rol, estado } };

   const descriptionBuilder = (actor) =>
      `${decrypt(actor?.name) || "desconocido"} ${decrypt(actor?.last_name) || ""} actualizó un perfil de usuario`;
   const payload = {
      code: CODES.USUARIO_ACTUALIZACION,
      target: {
         type: TARGET_TYPES.USUARIO,
      },
   };

   await registerEvent(req, auth, payload, metadata, descriptionBuilder);
}

async function registerUserCreationEvent(req, auth, profileData = {}) {
   const { nombre, apellido, mail, empresa, cargo, rol, estado } = profileData;
   const metadata = { Usuario: { nombre, apellido, mail, empresa, cargo, rol, estado } };

   const descriptionBuilder = (actor) =>
      `${decrypt(actor?.name) || "desconocido"} ${decrypt(actor?.last_name) || ""} creó un nuevo usuario`;

   const payload = {
      code: CODES.USUARIO_CREACION,
      target: {
         type: TARGET_TYPES.USUARIO,
      },
   };

   await registerEvent(req, auth, payload, metadata, descriptionBuilder);
}

async function registerUserRemovedEvent(req, auth, metadata = {}) {
   const descriptionBuilder = (actor) =>
      `${decrypt(actor?.name) || "desconocido"} ${decrypt(actor?.last_name) || ""} eliminó un usuario`;

   const payload = {
      code: CODES.USUARIO_ELIMINACION,
      target: {
         type: TARGET_TYPES.USUARIO,
      },
   };

   await registerEvent(req, auth, payload, metadata, descriptionBuilder);
}

// codes
const CODES = {
   SOLICITUD_CREACION: "SOLICITUD_CREACION",
   SOLICITUD_ELIMINACION: "SOLICITUD_ELIMINACION",
   TICKET_CREACION: "TICKET_CREACION",
   TICKET_ELIMINACION: "TICKET_ELIMINACION",
   DOMICILIOV_ELIMINACION: "DOMICILIOV_ELIMINACION",
   USUARIO_ACTUALIZACION: "USUARIO_ACTUALIZACION",
   USUARIO_CREACION: "USUARIO_CREACION",
   USUARIO_ELIMINACION: "USUARIO_ELIMINACION",
};

// target types
const TARGET_TYPES = {
   SOLICITUD: "Solicitud",
   TICKET: "Ticket",
   USUARIO: "Usuario",
};

module.exports = {
   registerSolicitudCreationEvent,
   registerTicketCreationEvent,
   registerSolicitudRemovedEvent,
   registerTicketRemovedEvent,
   registerDomicilioVirtualRemovalEvent,
   registerUserUpdateEvent,
   registerUserCreationEvent,
   registerUserRemovedEvent,
};
