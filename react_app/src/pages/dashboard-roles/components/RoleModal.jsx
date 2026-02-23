import React, { useState, useEffect } from "react";
import { X, Shield, Check, Loader2, Lock, UserCircle, LayoutGrid, ChevronRight } from "lucide-react";
import { apiFetch, API_BASE_URL } from "../../../utils/api";
import Button from "components/ui/Button";

export function RoleModal({ isOpen, onClose, onSuccess, role = null, permisos, availablePermissions = [], myLevel = 10 }) {
   const [isSaving, setIsSaving] = useState(false);
   const [isSuccess, setIsSuccess] = useState(false);
   const [activeTab, setActiveTab] = useState("admin");
   const [formData, setFormData] = useState({
      name: "",
      description: "",
      permissions: [],
      color: "#4f46e5",
      level: 10,
   });

   useEffect(() => {
      if (isOpen) setIsSuccess(false);
   }, [isOpen, role]);

   const isClientPanelEnabled = formData.permissions.includes("view_panel_cliente");
   const isAdminPanelEnabled = formData.permissions.includes("view_panel_admin");

   useEffect(() => {
      if (role) {
         let defaultLevel = 10;
         const rn = (role.name || "").toLowerCase();
         if (rn === "maestro") defaultLevel = 100;
         else if (rn === "administrador") defaultLevel = 90;

         setFormData({
            id: role._id,
            name: role.name,
            description: role.description,
            permissions: role.permissions || [],
            color: role.color || "#4f46e5",
            level: role.level || defaultLevel,
         });
      } else {
         setFormData({
            name: "",
            description: "",
            permissions: [],
            color: "#4f46e5",
            level: 10,
         });
      }
   }, [role, isOpen]);

   if (!isOpen) return null;

   // Helper para buscar permisos en la config dinámica
   const findPermissionById = (id) => {
      for (const group of availablePermissions) {
         const found = group.permissions.find(p => p.id === id);
         if (found) return found;
      }
      return null;
   };

   const togglePermission = (permId) => {
      if (isSuccess) setIsSuccess(false);
      setFormData((prev) => {
         const hasPerm = prev.permissions.includes(permId);
         let newPerms = hasPerm ? prev.permissions.filter((p) => p !== permId) : [...prev.permissions, permId];

         // 1. Limpieza por Paneles Raíz
         if (permId === "view_panel_admin" && hasPerm) {
            const adminIds = availablePermissions
               .filter((g) => g.tagg === "admin")
               .flatMap((g) => g.permissions.map((p) => p.id));
            newPerms = newPerms.filter((p) => !adminIds.includes(p));
         }
         if (permId === "view_panel_cliente" && hasPerm) {
            const clienteIds = availablePermissions
               .filter((g) => g.tagg === "cliente")
               .flatMap((g) => g.permissions.map((p) => p.id));
            newPerms = newPerms.filter((p) => !clienteIds.includes(p));
         }

         // 2. Lógica de Dependencias: Si quito el padre, quito los hijos
         if (hasPerm) {
            // Buscamos en todos los grupos
            const allPermissions = availablePermissions.flatMap(g => g.permissions);

            const dependentPerms = allPermissions
               .filter((p) => p.dependency === permId)
               .map((p) => p.id);

            if (dependentPerms.length > 0) {
               newPerms = newPerms.filter((p) => !dependentPerms.includes(p));
            }
         }

         return { ...prev, permissions: newPerms };
      });
   };

   const toggleAllInTab = () => {
      if (isSuccess) setIsSuccess(false);
      const permsInTab = availablePermissions
         .filter((g) => g.tagg === activeTab)
         .flatMap((g) => g.permissions);

      // Filtramos solo los que no tienen dependencia o cuya dependencia ya está marcada
      const availablePerms = permsInTab
         .filter((p) => !p.dependency || formData.permissions.includes(p.dependency))
         .map((p) => p.id);
      const allSelected = availablePerms.every((id) => formData.permissions.includes(id));

      setFormData((prev) => ({
         ...prev,
         permissions: allSelected
            ? prev.permissions.filter((p) => !availablePerms.includes(p))
            : [...new Set([...prev.permissions, ...availablePerms])],
      }));
   };

   const handleSubmit = async () => {
      if (!formData.name) return;
      setIsSaving(true);
      try {
         const res = await apiFetch(`${API_BASE_URL}/roles`, {
            method: "POST",
            body: JSON.stringify(formData),
            skipRedirect: true, // No redirigir para poder mostrar el error de límite
         });
         if (res.ok) {
            setIsSuccess(true);
            onSuccess();
         } else {
            const errData = await res.json().catch(() => ({}));
            alert(errData.error || errData.message || "Error al guardar el rol");
         }
      } catch (error) {
         alert("Error de conexión");
      } finally {
         setIsSaving(false);
      }
   };

   const isCreating = !role;

   const roleName = role?.name?.toLowerCase();
   const myRoleName = sessionStorage.getItem("cargo")?.toLowerCase();

   const isMaestroRole = roleName === "maestro";
   const isAdminRole = roleName === "administrador";
   const itsMyRole = roleName === myRoleName;
   const iAmMaestro = myRoleName === "maestro";

   const canEditMaestro = isMaestroRole && iAmMaestro;
   const canEditAdmin = isAdminRole && (permisos.edit_gestor_roles_admin || iAmMaestro);
   const canEditMyRole = itsMyRole && permisos.edit_gestor_roles_by_self;
   const canEditOtherRoles = !isAdminRole && !isMaestroRole && !itsMyRole && (permisos.edit_gestor_roles || iAmMaestro);

   const canEdit = isCreating || canEditMaestro || canEditAdmin || canEditMyRole || canEditOtherRoles;

   return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
         <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-border animate-in fade-in zoom-in duration-200">
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
               <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Shield size={20} className="text-accent" />
                  {role ? "Editar Rol / Cargo" : "Crear Nuevo Rol"}
               </h2>
               <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-lg"
               >
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               {/* INFO BÁSICA */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                     type="text"
                     placeholder="Nombre del Cargo"
                     value={formData.name}
                     onChange={(e) => {
                        if (isSuccess) setIsSuccess(false);
                        setFormData({ ...formData, name: e.target.value });
                     }}
                     className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-accent outline-none"
                  />
                  <div className="flex items-center gap-3">
                     <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Jerarquía (1-{myLevel}):</span>
                     <input
                        type="number"
                        min="1"
                        max={myLevel}
                        value={formData.level}
                        onChange={(e) => {
                           if (isSuccess) setIsSuccess(false);
                           let val = parseInt(e.target.value, 10);
                           if (isNaN(val)) val = 1;
                           if (val > myLevel) val = myLevel;
                           if (val < 1) val = 1;
                           setFormData({ ...formData, level: val });
                        }}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-accent outline-none"
                     />
                  </div>
                  <textarea
                     placeholder="Descripción de funciones"
                     value={formData.description}
                     onChange={(e) => {
                        if (isSuccess) setIsSuccess(false);
                        setFormData({ ...formData, description: e.target.value });
                     }}
                     rows={2}
                     className="w-full md:col-span-2 px-4 py-2 bg-background border border-border rounded-lg text-foreground resize-none focus:ring-2 focus:ring-accent outline-none"
                  />
               </div>

               <div className="h-px bg-border" />

               {/* TABS */}
               <div className="flex flex-col space-y-4">
                  <div className="flex p-1 bg-muted rounded-xl space-x-1">
                     <button
                        onClick={() => setActiveTab("admin")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === "admin" ? "bg-card text-accent shadow-sm ring-1 ring-accent/20" : "text-muted-foreground hover:text-foreground"}`}
                     >
                        <Shield size={16} /> Administración
                     </button>
                     <button
                        onClick={() => setActiveTab("cliente")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === "cliente" ? "bg-card text-accent shadow-sm ring-1 ring-accent/20" : "text-muted-foreground hover:text-foreground"}`}
                     >
                        <UserCircle size={16} /> Cliente
                     </button>
                  </div>

                  <button
                     type="button"
                     onClick={toggleAllInTab}
                     className="flex items-center justify-center gap-2 py-2 px-4 border border-dashed border-accent/50 text-accent bg-accent/5 hover:bg-accent/10 rounded-xl text-xs font-bold transition-all"
                  >
                     <LayoutGrid size={14} />
                     Seleccionar / Desmarcar disponibles en esta pestaña
                  </button>
               </div>

               <div className="space-y-4">
                  {/* HABILITADOR DE PANEL */}
                  {availablePermissions
                     .filter((g) => g.tagg === "root" && g.label.toLowerCase().includes(activeTab))
                     .map((group) => {
                        // Asumimos que los root tienen un permiso principal
                        if (!group.permissions || group.permissions.length === 0) return null;

                        const permId = group.permissions[0].id;
                        const isEnabled = formData.permissions.includes(permId);

                        return (
                           <div
                              key={group.key || group.label} // Usar key si existe, sino label
                              onClick={() => togglePermission(permId)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isEnabled ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border bg-muted/20 opacity-60"}`}
                           >
                              <span className="text-sm font-bold text-foreground">{group.label}</span>
                              <div
                                 className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isEnabled ? "bg-accent border-accent" : "border-muted-foreground"}`}
                              >
                                 {isEnabled && <Check size={12} strokeWidth={4} className="text-white" />}
                              </div>
                           </div>
                        );
                     })}

                  {/* VISTAS Y PERMISOS CON DEPENDENCIA */}
                  <div className="space-y-4">
                     {(activeTab === "admin" && isAdminPanelEnabled) ||
                        (activeTab === "cliente" && isClientPanelEnabled) ? (
                        availablePermissions
                           .filter((g) => g.tagg === activeTab)
                           // Se elimina el filtro de maestro para permitir asignación en formsdb.
                           // En clientes, estos grupos no vienen en availablePermissions, así que no se muestran.
                           .map((group) => {
                              const ids = group.permissions.map((p) => p.id);
                              const isAllSelected = ids.every((id) => formData.permissions.includes(id));

                              return (
                                 <div
                                    key={group.key || group.label}
                                    className="rounded-xl border border-border bg-muted/10 overflow-hidden"
                                 >
                                    <div
                                       className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted/50"
                                       onClick={() => {
                                          if (isSuccess) setIsSuccess(false);
                                          // Al seleccionar todo el grupo, solo seleccionamos los que no tienen dependencia o ya tienen el padre marcado
                                          const availableIds = group.permissions
                                             .filter((p) => !p.dependency || formData.permissions.includes(p.dependency))
                                             .map((p) => p.id);
                                          setFormData((prev) => ({
                                             ...prev,
                                             permissions: isAllSelected
                                                ? prev.permissions.filter((p) => !ids.includes(p))
                                                : [...new Set([...prev.permissions, ...availableIds])],
                                          }));
                                       }}
                                    >
                                       <span className="text-xs font-bold text-foreground">{group.label}</span>
                                       <div
                                          className={`w-4 h-4 rounded border flex items-center justify-center ${isAllSelected ? "bg-accent border-accent text-white" : "bg-background border-border"}`}
                                       >
                                          {isAllSelected && <Check size={12} strokeWidth={3} />}
                                       </div>
                                    </div>
                                    <div className="p-3 grid grid-cols-1 gap-1">
                                       {group.permissions.map((perm) => {
                                          // VALIDACIÓN DE DEPENDENCIA PARA RENDERIZADO
                                          if (perm.dependency && !formData.permissions.includes(perm.dependency)) {
                                             return null;
                                          }

                                          const isSelected = formData.permissions.includes(perm.id);
                                          const isChild = !!perm.dependency;

                                          return (
                                             <label
                                                key={perm.id}
                                                className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${isChild ? "ml-6 border-l border-border pl-4" : ""}`}
                                             >
                                                {isChild && <ChevronRight size={12} className="text-muted-foreground" />}
                                                <div
                                                   className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? "bg-accent border-accent text-white" : "bg-background border-border"}`}
                                                >
                                                   {isSelected && <Check size={10} strokeWidth={3} />}
                                                </div>
                                                <span className="text-xs text-muted-foreground">{perm.label}</span>
                                                <input
                                                   type="checkbox"
                                                   className="hidden"
                                                   checked={isSelected}
                                                   onChange={() => togglePermission(perm.id)}
                                                />
                                             </label>
                                          );
                                       })}
                                    </div>
                                 </div>
                              );
                           })
                     ) : (
                        <div className="py-10 text-center border border-dashed border-border rounded-xl">
                           <Lock size={24} className="mx-auto mb-2 text-muted-foreground opacity-20" />
                           <p className="text-xs text-muted-foreground">
                              Habilita el panel superior para configurar vistas
                           </p>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-muted/10 shrink-0">
               {canEdit ? (
                  <>
                     <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground">
                        Cancelar
                     </button>

                     <button
                        onClick={handleSubmit}
                        disabled={isSaving || !formData.name || isSuccess}
                        className="px-8 py-2 bg-accent text-white text-sm font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/20 min-w-[200px] transition-all duration-200"
                     >
                        {isSaving ? (
                           <>
                              <Loader2 size={16} className="animate-spin" />
                              Guardando...
                           </>
                        ) : isSuccess ? (
                           <>
                              <Check size={16} />
                              Guardado Exitosamente
                           </>
                        ) : role ? (
                           "Actualizar Cargo"
                        ) : (
                           "Guardar Cargo"
                        )}
                     </button>
                  </>
               ) : (
                  <Button
                     onClick={onClose}
                     className="px-4 py-2 text-sm font-medium text-muted-foreground"
                     variant="outlineTeal"
                  >
                     Cerrar
                  </Button>
               )}
            </div>
         </div>
      </div>
   );
}
