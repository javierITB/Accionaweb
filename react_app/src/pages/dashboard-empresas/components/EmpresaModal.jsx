import React, { useState, useEffect } from "react";
import { X, Database, Check, Loader2, Lock, UserCircle, LayoutGrid, ChevronRight, Server, Shield } from "lucide-react";
import { apiFetch, API_BASE_URL } from "../../../utils/api";
import Button from "../../../components/ui/Button";
import { PERMISSION_GROUPS } from "../../../config/permissionGroups";
import { usePermissions } from "../../../context/PermissionsContext";

const DEFAULT_LOCKED_PERMISSIONS = [
   "view_panel_cliente", "view_home", "view_perfil", "view_mis_solicitudes",
   "share_mis_solicitudes", "unshare_mis_solicitudes", "view_formulario",
   "view_panel_admin", "view_usuarios", "edit_usuarios", "delete_usuarios",
   "create_usuarios", "view_empresas", "edit_empresas", "delete_empresas",
   "create_empresas", "view_gestor_roles", "view_gestor_roles_details",
   "create_gestor_roles", "copy_gestor_roles", "view_gestor_roles_details_admin",
   "delete_gestor_roles", "edit_gestor_roles", "edit_gestor_roles_by_self",
   "edit_gestor_roles_admin"
];

export function EmpresaModal({ isOpen, onClose, onSuccess, company = null, plans = [] }) {
   const [isSaving, setIsSaving] = useState(false);
   const [isSuccess, setIsSuccess] = useState(false);
   const [activeTab, setActiveTab] = useState("admin");
   const { userPermissions } = usePermissions();
   const [customSourceLabel, setCustomSourceLabel] = useState(null);
   const [formData, setFormData] = useState({
      name: "",
      permissions: [], // Array de strings con los IDs de permisos individuales
      planId: ""
   });

   useEffect(() => {
      if (isOpen) {
         setIsSuccess(false);
         setCustomSourceLabel(null);
      }
   }, [isOpen, company]);

   useEffect(() => {
      if (company) {
         setFormData({
            id: company.name, // Usamos el nombre como ID
            name: company.name,
            permissions: company.permissions || [],
            planId: company.planId || ""
         });
         setCustomSourceLabel(null);
      } else {
         setFormData({
            name: "",
            permissions: DEFAULT_LOCKED_PERMISSIONS, // Preseleccionar permisos bloqueados
            planId: ""
         });
         setCustomSourceLabel(null);
      }
   }, [company, isOpen]);

   if (!isOpen) return null;

   const arePermissionsEqual = (p1, p2) => {
      if (p1.length !== p2.length) return false;
      const s1 = new Set(p1);
      return p2.every(p => s1.has(p));
   };

   const handlePlanChange = (newPlanId) => {
      if (newPlanId) {
         setCustomSourceLabel(null);
         const selectedPlan = plans.find(p => p._id === newPlanId);
         if (selectedPlan) {
            setFormData(prev => ({
               ...prev,
               planId: newPlanId,
               permissions: selectedPlan.permissions || []
            }));
         }
      } else {
         setCustomSourceLabel(null);
         setFormData(prev => ({ ...prev, planId: "" }));
      }
   };

   const togglePermission = (permId) => {
      if (isSuccess) setIsSuccess(false);
      if (!company && DEFAULT_LOCKED_PERMISSIONS.includes(permId) && !formData.planId) return;

      setFormData((prev) => {
         const hasPerm = prev.permissions.includes(permId);
         let newPerms = hasPerm ? prev.permissions.filter((p) => p !== permId) : [...prev.permissions, permId];

         // 1. Limpieza por Paneles Raíz
         if (permId === "view_panel_admin" && hasPerm) {
            const adminIds = Object.values(PERMISSION_GROUPS)
               .filter((g) => g.tagg === "admin")
               .flatMap((g) => g.permissions.map((p) => p.id));
            newPerms = newPerms.filter((p) => !adminIds.includes(p));
         }
         if (permId === "view_panel_cliente" && hasPerm) {
            const clienteIds = Object.values(PERMISSION_GROUPS)
               .filter((g) => g.tagg === "cliente")
               .flatMap((g) => g.permissions.map((p) => p.id));
            newPerms = newPerms.filter((p) => !clienteIds.includes(p));
         }

         // 2. Lógica de Dependencias: Si quito el padre, quito los hijos
         if (hasPerm) {
            const dependentPerms = Object.values(PERMISSION_GROUPS)
               .flatMap((g) => g.permissions)
               .filter((p) => p.dependency === permId)
               .map((p) => p.id);

            if (dependentPerms.length > 0) {
               newPerms = newPerms.filter((p) => !dependentPerms.includes(p));
            }
         }

         // Re-verificar bloqueados si es creación y NO estamos en modo plan (o acabamos de salir de uno)
         // Si salimos de plan, ya no es "creacion default", es "custom".

         // AUTO-DETACH / AUTO-REVERSE
         let newPlanId = prev.planId;

         // 1. Intentar encontrar un plan que coincida EXACTAMENTE con los nuevos permisos
         const matchingPlan = plans.find(p => arePermissionsEqual(p.permissions || [], newPerms));

         if (matchingPlan) {
            newPlanId = matchingPlan._id;
            setCustomSourceLabel(null);
         } else if (prev.planId) {
            // Si no hay match y tenía plan, se vuelve personalizado
            const planName = plans.find(p => p._id === prev.planId)?.name;
            if (planName) setCustomSourceLabel(`${planName} (Personalizado)`);
            newPlanId = "";
         }

         return { ...prev, permissions: newPerms, planId: newPlanId };
      });
   };

   const toggleAllInTab = () => {
      // PERMITIR SIEMPRE (aunque haya plan)
      // if (formData.planId) return; // REMOVED check

      if (isSuccess) setIsSuccess(false);
      const permsInTab = Object.values(PERMISSION_GROUPS)
         .filter((g) => g.tagg === activeTab)
         .flatMap((g) => g.permissions);

      // Filtramos solo los que no tienen dependencia o cuya dependencia ya está marcada
      const availablePerms = permsInTab
         .filter((p) => !p.dependency || formData.permissions.includes(p.dependency))
         .map((p) => p.id);
      const allSelected = availablePerms.every((id) => formData.permissions.includes(id));

      setFormData((prev) => {
         let newPerms;
         if (allSelected) {
            // Deseleccionar todo, pero mantener los bloqueados si es creación y NO TIENE PLAN
            // Si tiene plan, asumimos que quiere borrar todo custom => se queda custom vacio (o base locked)
            newPerms = prev.permissions.filter((p) => !availablePerms.includes(p));
            if (!company && !prev.planId) {
               newPerms = [...new Set([...newPerms, ...DEFAULT_LOCKED_PERMISSIONS])];
            }
         } else {
            // Seleccionar todo
            newPerms = [...new Set([...prev.permissions, ...availablePerms])];
         }


         // AUTO-DETACH / AUTO-REVERSE
         let newPlanId = prev.planId;
         const matchingPlan = plans.find(p => arePermissionsEqual(p.permissions || [], newPerms));

         if (matchingPlan) {
            newPlanId = matchingPlan._id;
            setCustomSourceLabel(null);
         } else if (prev.planId) {
            const planName = plans.find(p => p._id === prev.planId)?.name;
            if (planName) setCustomSourceLabel(`${planName} (Personalizado)`);
            newPlanId = "";
         }

         return { ...prev, permissions: newPerms, planId: newPlanId };
      });
   };

   const handleSubmit = async () => {
      if (!formData.name) return;
      setIsSaving(true);
      try {
         // Payload ahora envía permisos específicos
         const payload = {
            name: formData.name,
            permissions: formData.permissions,
            planId: formData.planId || null
         };

         // Si existe company, es edición (PUT), si no, creación (POST)
         // NOTA: Implementaremos PUT más adelante, por ahora POST asume creación pero lo prepararemos
         const url = `${API_BASE_URL}/sas/companies${company ? `/${company._id}` : ''}`;
         const method = company ? "PUT" : "POST";

         const res = await apiFetch(url, {
            method: method,
            body: JSON.stringify(payload),
         });

         if (res.ok) {
            setIsSuccess(true);
            onSuccess();
         } else {
            const err = await res.json();
            alert(err.error || "Error al guardar la empresa");
         }
      } catch (error) {
         alert("Error de conexión");
      } finally {
         setIsSaving(false);
      }
   };

   const isClientPanelEnabled = formData.permissions.includes("view_panel_cliente");
   const isAdminPanelEnabled = formData.permissions.includes("view_panel_admin");

   return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
         <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-border animate-in fade-in zoom-in duration-200">
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
               <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Database size={20} className="text-accent" />
                  {company ? "Editar Empresa y Permisos" : "Crear Nueva Empresa"}
               </h2>
               <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-lg"
               >
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               <div className="grid grid-cols-1 gap-4">
                  <div>
                     <label className="text-sm font-medium text-muted-foreground mb-1 block">Plan Global</label>
                     <select
                        value={formData.planId}
                        onChange={(e) => handlePlanChange(e.target.value)}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-accent outline-none appearance-none"
                     >
                        <option value="">{customSourceLabel || "-- Personalizado / Sin Plan --"}</option>
                        {plans.map(p => (
                           <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                     </select>
                     {formData.planId && <p className="text-xs text-indigo-400 mt-1">Los permisos y límites son gestionados por el plan seleccionado.</p>}
                  </div>

                  <div>
                     <label className="text-sm font-medium text-muted-foreground mb-1 block">Nombre de la Empresa (Base de Datos)</label>
                     <input
                        type="text"
                        placeholder="Ej: Constructora Del Sur"
                        value={formData.name}
                        onChange={(e) => {
                           if (isSuccess) setIsSuccess(false);
                           setFormData({ ...formData, name: e.target.value });
                        }}
                        disabled={!!company}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-accent outline-none disabled:opacity-50"
                     />
                     <p className="text-xs text-muted-foreground mt-1">
                        {company
                           ? `Base de datos: ${company.dbName || "..."}`
                           : <>Esto creará una base de datos física llamada <strong>{formData.name.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() || "..."}</strong></>
                        }
                     </p>
                     {!company && (
                        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                           <Server size={18} className="text-blue-500 shrink-0 mt-0.5" />
                           <p className="text-xs text-blue-700 leading-relaxed">
                              <strong>Plantilla activa:</strong> Esta nueva empresa se creará clonando los formularios, plantillas, roles y usuarios base desde la base de datos <strong>desarrollo</strong>.
                           </p>
                        </div>
                     )}
                  </div>
               </div>

               <div className="h-px bg-border" />

               {userPermissions.includes("view_empresas_permissions_list") && (
                  <>
                     {/* TABS DE PERMISOS */}
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
                        {Object.entries(PERMISSION_GROUPS)
                           .filter(([_, g]) => g.tagg === "root" && g.label.toLowerCase().includes(activeTab))
                           .map(([key, group]) => {
                              const isEnabled = formData.permissions.includes(group.permissions[0].id);
                              return (
                                 <div
                                    key={key}
                                    onClick={() => togglePermission(group.permissions[0].id)}
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
                              Object.entries(PERMISSION_GROUPS)
                                 .filter(([_, g]) => g.tagg === activeTab)
                                 // Filtramos gestor_empresas, configuracion_planes y registro_empresas
                                 .filter(([key, _]) => {
                                    if (key === 'gestor_empresas' || key === 'configuracion_planes') return false;
                                    // FILTRO: registro_empresas solo para 'formsdb'
                                    if (key === 'registro_empresas' && formData.name !== 'formsdb') return false;
                                    return true;
                                 })
                                 .map(([groupId, group]) => {
                                    const ids = group.permissions.map((p) => p.id);
                                    const isAllSelected = ids.every((id) => formData.permissions.includes(id));

                                    return (
                                       <div
                                          key={groupId}
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
                                                setFormData((prev) => {
                                                   const newPerms = isAllSelected
                                                      ? prev.permissions.filter((p) => !ids.includes(p))
                                                      : [...new Set([...prev.permissions, ...availableIds])];

                                                   // AUTO-DETACH / AUTO-REVERSE
                                                   let newPlanId = prev.planId;
                                                   const matchingPlan = plans.find(p => arePermissionsEqual(p.permissions || [], newPerms));

                                                   if (matchingPlan) {
                                                      newPlanId = matchingPlan._id;
                                                      setCustomSourceLabel(null);
                                                   } else if (prev.planId) {
                                                      const planName = plans.find(p => p._id === prev.planId)?.name;
                                                      if (planName) setCustomSourceLabel(`${planName} (Personalizado)`);
                                                      newPlanId = "";
                                                   }

                                                   return {
                                                      ...prev,
                                                      permissions: newPerms,
                                                      planId: newPlanId
                                                   };
                                                });
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
                                                const isLocked = !company && DEFAULT_LOCKED_PERMISSIONS.includes(perm.id);

                                                return (
                                                   <label
                                                      key={perm.id}
                                                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${isChild ? "ml-6 border-l border-border pl-4" : ""} ${isLocked ? "bg-muted/30 cursor-not-allowed opacity-80" : "hover:bg-muted/50 cursor-pointer"}`}
                                                   >
                                                      {isChild && <ChevronRight size={12} className="text-muted-foreground" />}
                                                      <div
                                                         className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? "bg-accent border-accent text-white" : "bg-background border-border"}`}
                                                      >
                                                         {isSelected && (isLocked ? <Lock size={10} strokeWidth={3} /> : <Check size={10} strokeWidth={3} />)}
                                                      </div>
                                                      <span className="text-xs text-muted-foreground">{perm.label}</span>
                                                      <input
                                                         type="checkbox"
                                                         className="hidden"
                                                         checked={isSelected}
                                                         disabled={isLocked}
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
                  </>
               )}
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-muted/10 shrink-0">
               <Button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground"
                  variant="outlineTeal"
               >
                  Cerrar
               </Button>

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
                  ) : company ? (
                     "Actualizar Empresa"
                  ) : (
                     "Crear Empresa"
                  )}
               </button>
            </div>
         </div>
      </div>
   );
}
