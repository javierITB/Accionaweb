const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { validarToken } = require("../utils/validarToken.js");
const { registerCargoCreationEvent, registerCargoUpdateEvent } = require("../utils/registerEvent");
const { decrypt, encrypt, encryptArray } = require("../utils/seguridad.helper");
const { getRoleLevel } = require("../utils/role.helper");

/**
 * Filtra los permisos de los roles si la empresa asociada está suspendida.
 * - Solo mantiene permisos de facturación/comprobantes.
 * - Solo afecta a los roles que ya los tenían.
 */
async function filterSuspendedPermissions(req, roles) {
   if (req.db.databaseName !== "formsdb" && req.mongoClient) {
      try {
         const centralDb = req.mongoClient.db("formsdb");
         const company = await centralDb.collection("config_empresas").findOne({ dbName: req.db.databaseName });

         if (company && company.isSuspended) {
            const allowed = ["view_panel_admin", "view_comprobantes", "create_comprobantes"];
            roles.forEach(r => {
               if (r.permissions && Array.isArray(r.permissions)) {
                  // Solo conserva aquellos que ESTABAN en el rol Y están en la lista permitida
                  r.permissions = r.permissions.filter(p => allowed.includes(p));
               }
            });
         }
      } catch (err) {
         console.error("[FilterSuspendedPermissions] Error verificando suspensión:", err);
      }
   }
}

// Helper para verificar token (Consistente con tu estructura)
const verifyRequest = async (req) => {
   let token = req.headers.authorization?.split(" ")[1];
   if (!token && req.body?.user?.token) token = req.body.user.token;
   if (!token && req.query?.token) token = req.query.token;

   if (!token) return { ok: false, error: "Unauthorized" };

   const valid = await validarToken(req.db, token);
   if (!valid.ok) return { ok: false, error: "Unauthorized" };

   return { ok: true, data: valid.data };
};

router.use(express.json({ limit: "4mb" }));

/**
 * @openapi
 * /roles:
 *   post:
 *     summary: Crear o actualizar un rol de la organización
 *     description: Define un nuevo cargo o actualiza uno existente. Valida la jerarquía del solicitante; no se puede asignar un 'level' superior al propio. El rol 'Maestro' está restringido a usuarios con nivel 100.
 *     tags: [Gestión de Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id: { type: string, description: "Opcional. ID del rol para actualización" }
 *               name: { type: string, example: "Supervisor de Operaciones" }
 *               description: { type: string }
 *               level: { type: integer, example: 50, description: "Nivel jerárquico del rol" }
 *               permissions: { type: array, items: { type: string }, example: ["view_reports", "edit_forms"] }
 *               color: { type: string, example: "#4f46e5" }
 *     responses:
 *       201:
 *         description: Rol creado exitosamente.
 *       403:
 *         description: Nivel jerárquico insuficiente o intento de modificar rol 'Maestro/Admin'.
 */
router.post("/", async (req, res) => {
   try {
      const tokenCheck = await verifyRequest(req);
      if (!tokenCheck.ok) return res.status(401).json({ error: "Unauthorized" });

      const { id, name, description, permissions, color, level } = req.body;

      const userRoleLevel = await getRoleLevel(req.db, tokenCheck.data.rol);
      const targetRoleLevel = Number(level) || 10;

      if (targetRoleLevel > userRoleLevel) {
         return res.status(403).json({ error: `No puedes asignar un nivel (${targetRoleLevel}) mayor a tu propia jerarquía (${userRoleLevel}).` });
      }

      if (name && name.toLowerCase() === "maestro" && userRoleLevel < 100) {
         return res.status(403).json({ error: "No puedes crear ni editar un rol con el nombre Maestro." });
      }

      const roleData = {
         name: name || "Nuevo Rol",
         description: description || "",
         permissions: permissions || [], // Array de strings: ["view_reports", "edit_users", etc]
         color: color || "#4f46e5",
         level: targetRoleLevel,
         updatedAt: new Date(),
      };

      if (!id) {
         // CREAR ROL
         // Plan Limites
         const { checkPlanLimits } = require("../utils/planLimits");
         try {
            await checkPlanLimits(req, "roles");
         } catch (limitErr) {
            return res.status(403).json({ error: limitErr.message });
         }

         roleData.createdAt = new Date();
         const result = await req.db.collection("roles").insertOne(roleData);

         registerCargoCreationEvent(req, tokenCheck, roleData);

         res.status(201).json({ _id: result.insertedId, ...roleData });
      } else {
         // ACTUALIZAR ROL
         if (id === "admin") {
            return res.status(403).json({ error: "No se puede modificar el rol raíz de administrador" });
         }

         const currentCargoState = await req.db.collection("roles").findOne({ _id: new ObjectId(id) });
         if (!currentCargoState) return res.status(404).json({ error: "Rol no encontrado" });

         const currentCargoLevel = await getRoleLevel(req.db, currentCargoState.name);
         if (currentCargoLevel > userRoleLevel) {
            return res.status(403).json({ error: "No tienes suficiente jerarquía para modificar este rol." });
         }

         const newCargoState = await req.db
            .collection("roles")
            .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: roleData }, { returnDocument: "after" });

         if (!newCargoState) return res.status(404).json({ error: "Rol no encontrado" });

         registerCargoUpdateEvent(req, tokenCheck, currentCargoState, newCargoState);
         res.status(200).json(newCargoState);
      }
   } catch (err) {
      console.error("Error en POST /roles:", err);
      res.status(500).json({ error: "Internal server error" });
   }
});

/**
 * @openapi
 * /roles/config:
 *   get:
 *     summary: Obtener matriz de permisos disponibles
 *     description: Retorna la configuración global de permisos que pueden ser asignados a los roles en esta empresa.
 *     tags: [Gestión de Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de permisos configurables.
 */
router.get("/config", async (req, res) => {
   try {
      const tokenCheck = await verifyRequest(req);
      if (!tokenCheck.ok) return res.status(401).json({ error: "Unauthorized" });

      // Intentamos obtener la configuración desde la colección config_roles
      const configRoles = await req.db.collection("config_roles").find({}).toArray();

      res.json(configRoles);
   } catch (err) {
      console.error("Error en GET /roles/config:", err);
      res.status(500).json({ error: "Internal server error" });
   }
});

/**
 * @openapi
 * /roles:
 *   get:
 *     summary: Listar todos los roles de la empresa
 *     description: Retorna la lista de roles disponibles. Si la empresa está suspendida, los permisos de los roles se filtran automáticamente dejando solo 'facturación' y 'panel básico'. El rol 'Maestro' se oculta a menos que el solicitante sea Maestro.
 *     tags: [Gestión de Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles filtrada por estado de suscripción y jerarquía.
 */
router.get("/", async (req, res) => {
   try {
      const tokenCheck = await verifyRequest(req);
      if (!tokenCheck.ok) return res.status(401).json({ error: "Unauthorized" });

      const isUserMaestro = tokenCheck.data.rol?.toLowerCase() === "maestro";

      const roles = await req.db.collection("roles").find({}).sort({ name: 1 }).toArray();

      // Filtrar Maestro si el usuario no es Maestro
      const filteredRoles = isUserMaestro ? roles : roles.filter((r) => r.name?.toLowerCase() !== "maestro");

      // Filtrar permisos si la empresa está suspendida
      await filterSuspendedPermissions(req, filteredRoles);

      res.json(filteredRoles);
   } catch (err) {
      console.error("Error en GET /roles:", err);
      res.status(500).json({ error: "Internal server error" });
   }
});

/**
 * @route   GET /roles/name/:name
 * @desc    Obtener detalle de un rol por su nombre
 */
router.get("/name/:name", async (req, res) => {
   try {
      const tokenCheck = await verifyRequest(req);
      if (!tokenCheck.ok) return res.status(401).json({ error: "Unauthorized" });

      const roleName = req.params.name;
      const role = await req.db.collection("roles").findOne({
         name: { $regex: new RegExp(`^${roleName}$`, "i") },
      });

      if (!role) return res.status(404).json({ error: "Rol no encontrado" });

      // Filtrar permisos si la empresa está suspendida
      await filterSuspendedPermissions(req, [role]);

      res.json(role);
   } catch (err) {
      console.error("Error en GET /roles/name/:name:", err);
      res.status(500).json({ error: "Internal server error" });
   }
});

/**
 * @route   GET /roles/:id
 * @desc    Obtener detalle de un rol específico
 */
router.get("/:id", async (req, res) => {
   try {
      const tokenCheck = await verifyRequest(req);
      if (!tokenCheck.ok) return res.status(401).json({ error: "Unauthorized" });

      const role = await req.db.collection("roles").findOne({
         _id: new ObjectId(req.params.id),
      });

      if (!role) return res.status(404).json({ error: "Rol no encontrado" });

      // Filtrar permisos si la empresa está suspendida
      await filterSuspendedPermissions(req, [role]);

      res.json(role);
   } catch (err) {
      res.status(500).json({ error: "Internal server error" });
   }
});

/**
 * @openapi
 * /roles/{id}:
 *   delete:
 *     summary: Eliminar un rol existente
 *     description: Borra un rol de la base de datos siempre que no tenga usuarios asociados (validación mediante descifrado de cargos). Los roles 'admin' y 'maestro' están protegidos contra eliminación.
 *     tags: [Gestión de Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Rol eliminado con éxito.
 *       400:
 *         description: No se puede eliminar el rol porque tiene usuarios asignados.
 */
router.delete("/:id", async (req, res) => {
   try {
      const tokenCheck = await verifyRequest(req);
      if (!tokenCheck.ok) return res.status(401).json({ error: "Unauthorized" });

      const roleId = req.params.id;

      // 1. Evitar borrar el admin o maestro
      const isUserMaestro = tokenCheck.data.rol?.toLowerCase() === "maestro";

      if (roleId === "admin") {
         return res.status(403).json({ error: "No se puede eliminar un rol de sistema" });
      }

      const roleToDelete = await req.db.collection("roles").findOne({ _id: new ObjectId(roleId) });
      if (roleToDelete && roleToDelete.name?.toLowerCase() === "maestro") {
         if (!isUserMaestro) {
            return res.status(403).json({ error: "No tienes permisos para eliminar el rol Maestro" });
         }
         // Incluso si es maestro, tal vez no debería borrarse? El usuario dijo "no se puede modificar"
         // Mantenemos protección alta:
         return res.status(403).json({ error: "El rol Maestro es vital para el sistema y no puede eliminarse" });
      }

      // 2. Verificar si hay usuarios con este rol antes de borrar
      // Buscar en 'usuarios' y desencriptar el 'cargo'
      const users = await req.db
         .collection("usuarios")
         .find(
            {},
            {
               projection: {
                  cargo: 1,
               },
            },
         )
         .toArray();

      const usersCount = users.filter((u) => {
         try {
            const decCargo = decrypt(u.cargo);
            return decCargo === roleToDelete.name;
         } catch {
            return u.cargo === roleToDelete.name;
         }
      }).length;

      if (usersCount > 0) {
         return res.status(400).json({
            error: "No se puede eliminar: Hay usuarios asignados a este rol.",
         });
      }

      const result = await req.db.collection("roles").deleteOne({
         _id: new ObjectId(roleId),
      });

      if (result.deletedCount === 0) return res.status(404).json({ error: "Rol no encontrado" });

      res.status(200).json({ message: "Rol eliminado con éxito" });
   } catch (err) {
      console.error("Error en DELETE /roles:", err);
      res.status(500).json({ error: "Internal server error" });
   }
});

/**
 * @openapi
 * /roles/check-permission/{permission}:
 *   get:
 *     summary: Verificar si el usuario tiene un permiso específico
 *     description: Utilidad para que el frontend valide si el usuario actual posee un permiso concreto o el permiso maestro 'all'.
 *     tags: [Utilidades de Seguridad]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permission
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Objeto booleano con el resultado de la validación.
 */
router.get("/check-permission/:permission", async (req, res) => {
   try {
      const tokenCheck = await verifyRequest(req);
      if (!tokenCheck.ok) return res.status(401).json({ error: "Unauthorized" });

      // El verifyRequest devuelve la data del usuario (incluyendo su rol)
      const userRoleName = tokenCheck.data.role;

      const role = await req.db.collection("roles").findOne({ name: userRoleName });

      if (!role) return res.status(403).json({ hasPermission: false });

      const hasPermission = role.permissions.includes("all") || role.permissions.includes(req.params.permission);

      res.json({ hasPermission });
   } catch (err) {
      res.status(500).json({ error: "Internal server error" });
   }
});

/**
 * @openapi
 * /roles/user-count/all:
 *   get:
 *     summary: Obtener distribución de cargos en la empresa
 *     description: Escanea la colección de usuarios, descifra sus cargos y retorna una lista plana para conteo y analítica en el dashboard.
 *     tags: [Consultas de Administración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array de nombres de cargos asignados actualmente.
 */
router.get("/user-count/all", async (req, res) => {
   try {
      const tokenCheck = await verifyRequest(req);
      if (!tokenCheck.ok) return res.status(401).json({ error: "Unauthorized" });

      const users = await req.db
         .collection("usuarios")
         .find(
            {},
            {
               projection: {
                  cargo: 1,
               },
            },
         )
         .toArray();

      const cargos = users.map((u) => {
         try {
            return decrypt(u.cargo);
         } catch {
            return u.cargo;
         }
      });

      res.json(cargos);
   } catch (err) {
      console.error("Error en GET /roles/users:", err);
      res.status(500).json({ error: err.message });
   }
});

module.exports = router;
