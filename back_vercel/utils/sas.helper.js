const { PERMISSION_GROUPS } = require("../config/permissions");

/**
 * Sincroniza la configuración (roles y límites) de una empresa en su base de datos propia.
 * 
 * @param {Object} req - Objeto de request de Express (debe contener mongoClient)
 * @param {Object} company - Documento de la empresa (debe contener dbName)
 * @param {Array<string>} [permissions] - Lista de IDs de permisos activos
 * @param {Object} [planLimits] - Objeto de límites del plan
 * @returns {Promise<void>}
 */
async function syncCompanyConfiguration(req, company, permissions, planLimits) {
    if (!company.dbName || company.dbName === "formsdb") {
        return; // No sincronizamos configuraciones internas en formsdb o si no tiene DB
    }

    const targetDb = req.mongoClient.db(company.dbName);

    // --- IMPLEMENTACIÓN DE SUSPENSIÓN ---
    // Si la empresa está suspendida, forzamos los permisos a SOLO los de comprobantes y acceso admin.
    // Guardamos original para no afectar por referencia
    let activePermissions = permissions;

    if (company.isSuspended) {
        console.log(`[SAS-Sync] ATENCIÓN: La empresa ${company.name} está SUSPENDIDA. Restringiendo permisos.`);
        activePermissions = [
            'view_panel_admin',
            'view_comprobantes',
            'create_comprobantes'
        ];
    }

    // 1. Sincronizar ROLES y PERMISOS
    if (activePermissions) {
        console.log(`[SAS-Sync] Updating roles with ${activePermissions.length} active permissions`);

        // A. Regenerar config_roles (Definición de qué permisos están disponibles en el sistema)
        // Limpiar config_roles actual
        await targetDb.collection("config_roles").deleteMany({});

        const rolesConfig = [];
        // Grupos que NO deben estar en DBs de clientes
        const SYSTEM_ONLY_GROUPS = ['gestor_empresas', 'configuracion_planes', 'planes'];

        Object.entries(PERMISSION_GROUPS).forEach(([key, group]) => {
            if (SYSTEM_ONLY_GROUPS.includes(key)) return;

            const groupPermissionsIncluded = group.permissions.filter(p => activePermissions.includes(p.id));
            if (groupPermissionsIncluded.length > 0) {
                rolesConfig.push({
                    key: key,
                    label: group.label,
                    tagg: group.tagg,
                    permissions: groupPermissionsIncluded
                });
            }
        });

        if (rolesConfig.length > 0) {
            await targetDb.collection("config_roles").insertMany(rolesConfig);
        }

        // B. Sincronizar permisos en ROLES ASIGNADOS existentes
        // Si un rol tiene un permiso que ya no existe en el plan, se le quita.
        const existingRoles = await targetDb.collection("roles").find({}).toArray();
        for (const role of existingRoles) {
            // FIX: "Maestro" 
            if (role.name === "Maestro") {
                const allPermissions = [];
                // Exclusivos para Formsdb
                const excludedGroups = ["gestor_empresas", "configuracion_planes"];

                Object.entries(PERMISSION_GROUPS).forEach(([groupKey, groupData]) => {
                    if (!excludedGroups.includes(groupKey)) {
                        groupData.permissions.forEach(p => allPermissions.push(p.id));
                    }
                });

                // FIX: Filter Maestro's permissions to match only those allowed by activePermissions (accounting for suspension)
                const finalMaestroPermissions = allPermissions.filter(p => activePermissions.includes(p));

                // Actualizar Maestro con los permisos permitidos
                await targetDb.collection("roles").updateOne(
                    { _id: role._id },
                    { $set: { permissions: finalMaestroPermissions } }
                );
                continue;
            }

            if (role.permissions && Array.isArray(role.permissions)) {
                // Intersección: Solo mantenemos los permisos que el usuario tenía Y que están en el nuevo plan
                const updatedPermissions = role.permissions.filter(p => activePermissions.includes(p));

                if (updatedPermissions.length !== role.permissions.length) {
                    await targetDb.collection("roles").updateOne(
                        { _id: role._id },
                        { $set: { permissions: updatedPermissions } }
                    );
                }
            }
        }
    }

    // 2. Sincronizar LÍMITES DEL PLAN
    if (planLimits) {
        await targetDb.collection("config_plan").updateOne(
            {},
            {
                $set: {
                    planLimits: planLimits,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
    }
}

module.exports = { syncCompanyConfiguration };
