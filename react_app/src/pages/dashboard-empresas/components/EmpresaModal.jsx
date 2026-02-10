import React, { useState, useEffect } from "react";
import { X, Database, Check, Loader2, Lock, UserCircle, LayoutGrid, ChevronRight, Server } from "lucide-react";
import { apiFetch, API_BASE_URL } from "../../../utils/api";
import Button from "components/ui/Button";
import { PERMISSION_GROUPS } from "../../../config/permissionGroups";

export function EmpresaModal({ isOpen, onClose, onSuccess, company = null }) {
   const [isSaving, setIsSaving] = useState(false);
   const [isSuccess, setIsSuccess] = useState(false);
   const [activeTab, setActiveTab] = useState("admin");
   const [formData, setFormData] = useState({
      name: "",
      features: [], // Array de strings con los keys de las colecciones/features
   });

   useEffect(() => {
      if (isOpen) setIsSuccess(false);
   }, [isOpen, company]);

   // Mapeo inverso si estuviéramos editando (aunque por ahora solo es crear)
   useEffect(() => {
      if (company) {
         setFormData({
            id: company.name, // Usamos el nombre como ID
            name: company.name,
            features: [], // No tenemos info de features activas en el GET /companies list, así que empezamos vacío o asumimos
         });
      } else {
         setFormData({
            name: "",
            features: [],
         });
      }
   }, [company, isOpen]);

   if (!isOpen) return null;

   // En este modal, "features" son las funcionalidades macro (Keys de PERMISSION_GROUPS)
   // No se seleccionan permisos individuales, sino grupos completos (Funcionalidades)
   const toggleFeature = (featureKey) => {
      if (isSuccess) setIsSuccess(false);

      setFormData((prev) => {
         const hasFeature = prev.features.includes(featureKey);
         let newFeatures = hasFeature
            ? prev.features.filter((f) => f !== featureKey)
            : [...prev.features, featureKey];

         return { ...prev, features: newFeatures };
      });
   };

   const handleSubmit = async () => {
      if (!formData.name) return;
      setIsSaving(true);
      try {
         // Transformamos el payload para el endpoint SAS
         const payload = {
            name: formData.name,
            features: formData.features
         };

         const res = await apiFetch(`${API_BASE_URL}/sas/companies`, {
            method: "POST",
            body: JSON.stringify(payload),
         });

         if (res.ok) {
            setIsSuccess(true);
            onSuccess();
         } else {
            const err = await res.json();
            alert(err.error || "Error al crear la empresa");
         }
      } catch (error) {
         alert("Error de conexión");
      } finally {
         setIsSaving(false);
      }
   };

   // Filtramos los grupos de permisos para mostrarlos como "Features"
   // Asumimos que cada top-level key en PERMISSION_GROUPS es una feature (ej: 'gestor_usuarios', 'tickets')
   const featuresList = Object.entries(PERMISSION_GROUPS).map(([key, group]) => ({
      key: key, // Esto será el nombre de la colección/feature
      label: group.label,
      tagg: group.tagg,
      description: group.permissions?.[0]?.label || "Funcionalidad del sistema" // Descripción simple
   }));

   return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
         <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-border animate-in fade-in zoom-in duration-200">
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
               <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Database size={20} className="text-accent" />
                  {company ? "Ver Empresa (Solo Lectura)" : "Crear Nueva Empresa"}
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
               <div className="grid grid-cols-1 gap-4">
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
                        Esto creará una base de datos física llamada <strong>{formData.name.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() || "..."}</strong>
                     </p>
                  </div>
               </div>

               <div className="h-px bg-border" />

               {/* SELECCIÓN DE FUNCIONALIDADES */}
               <div>
                  <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                     <Server size={18} /> Funcionalidades y Colecciones
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                     Selecciona los módulos que tendrá habilitados esta empresa. Se crearán las colecciones correspondientes en su base de datos.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {featuresList.map((feature) => {
                        const isSelected = formData.features.includes(feature.key);
                        return (
                           <div
                              key={feature.key}
                              onClick={() => !company && toggleFeature(feature.key)}
                              className={`
                                       p-3 rounded-xl border flex items-start gap-3 transition-all cursor-pointer
                                       ${isSelected ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border hover:bg-muted/50"}
                                       ${company ? "cursor-default opacity-80" : ""}
                                   `}
                           >
                              <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? "bg-accent border-accent" : "border-muted-foreground"}`}>
                                 {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-foreground">{feature.label}</p>
                                 <p className="text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
                                 <p className="text-[10px] uppercase font-mono text-muted-foreground mt-1 bg-muted inline-block px-1 rounded">
                                    Coll: {feature.key}
                                 </p>
                              </div>
                           </div>
                        )
                     })}
                  </div>
               </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-muted/10 shrink-0">
               <Button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground"
                  variant="outlineTeal"
               >
                  Cerrar
               </Button>

               {!company && (
                  <button
                     onClick={handleSubmit}
                     disabled={isSaving || !formData.name || isSuccess}
                     className="px-8 py-2 bg-accent text-white text-sm font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/20 min-w-[200px] transition-all duration-200"
                  >
                     {isSaving ? (
                        <>
                           <Loader2 size={16} className="animate-spin" />
                           Creando DB...
                        </>
                     ) : isSuccess ? (
                        <>
                           <Check size={16} />
                           Creada Exitosamente
                        </>
                     ) : (
                        "Crear Empresa"
                     )}
                  </button>
               )}
            </div>
         </div>
      </div>
   );
}
