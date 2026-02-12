import React, { useState, useEffect } from "react";
import { X, Check, Loader2, ShieldCheck, Activity, ChevronUp, ChevronDown } from "lucide-react";
import { apiFetch } from "../../../utils/api";

export function PlanesModal({ isOpen, onClose, onSuccess, company = null }) {
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        solicitudes: "",
        tickets: "",
        usuarios: "",
        formularios: "",
        plantillas: "",
        roles: "",
        categorias: "",
        empresas: ""
    });

    useEffect(() => {
        if (isOpen) setIsSuccess(false);
        if (company) {
            const getVal = (val) => (val !== undefined && val !== null) ? val : "";
            setFormData({
                solicitudes: getVal(company.planLimits?.requests?.maxTotal ?? company.planLimits?.solicitudes?.maxTotal),
                tickets: getVal(company.planLimits?.tickets?.maxQuantity),
                usuarios: getVal(company.planLimits?.users?.maxUsers),
                formularios: getVal(company.planLimits?.forms?.maxQuantity),
                plantillas: getVal(company.planLimits?.templates?.maxQuantity),
                roles: getVal(company.planLimits?.roles?.maxRoles),
                categorias: getVal(company.planLimits?.configTickets?.maxCategories),
                empresas: getVal(company.planLimits?.companies?.maxQuantity)
            });
        }
    }, [isOpen, company]);

    if (!isOpen) return null;
    if (company?.dbName === 'formsdb' || company?.isSystem) return null;

    const handleAdjust = (key, delta) => {
        setFormData(prev => ({
            ...prev,
            [key]: Math.max(0, (parseInt(prev[key]) || 0) + delta).toString()
        }));
    };

    const handleSubmit = async () => {
        console.log("Saving plan limits...", formData);
        setIsSaving(true);
        try {

            const payload = {
                planLimits: {
                    requests: { maxTotal: parseInt(formData.solicitudes) || 0 },
                    tickets: { maxQuantity: parseInt(formData.tickets) || 0 },
                    users: { maxUsers: parseInt(formData.usuarios) || 0 },
                    forms: { maxQuantity: parseInt(formData.formularios) || 0 },
                    templates: { maxQuantity: parseInt(formData.plantillas) || 0 },
                    roles: { maxRoles: parseInt(formData.roles) || 0 },
                    configTickets: { maxCategories: parseInt(formData.categorias) || 0 },
                    companies: { maxQuantity: parseInt(formData.empresas) || 0 }
                }
            };

            console.log("Sending payload:", JSON.stringify(payload));

            console.log("Sending payload via apiFetch:", JSON.stringify(payload));

            const res = await apiFetch(`/sas/companies/${company._id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });

            console.log("Response status:", res.status);

            if (res.ok) {
                setIsSuccess(true);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1000);
            } else {
                console.warn("Save failed with status:", res.status);
                setIsSaving(false);
            }
        } catch (error) {
            console.error("Error saving plan limits:", error);
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* HEADER COMPACTO */}
                <div className="relative h-32 bg-indigo-600 flex items-center px-8 shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/50 hover:text-white p-1.5 hover:bg-white/10 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                            <ShieldCheck size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Configuración de Plan</h2>
                            <p className="text-white/70 text-xs font-bold">{company?.name}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* INFO BAR SIMPLE */}
                    <div className="px-4 py-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Activity size={16} className="text-indigo-600" />
                            <span className="text-[10px] font-black text-foreground uppercase tracking-widest">
                                BD: <span className="text-indigo-600 ml-1">{company?.dbName?.toUpperCase()}</span>
                            </span>
                        </div>
                        <div className="px-3 py-1 rounded-full border border-border bg-background">
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Estado: Activo</span>
                        </div>
                    </div>

                    {/* LISTA DE LÍMITES */}
                    <div className="space-y-1">
                        {[
                            { label: "Límite de Solicitudes", key: "solicitudes" },
                            { label: "Límite de Tickets", key: "tickets" },
                            { label: "Límite de Usuarios", key: "usuarios" },
                            { label: "Límite de Formularios", key: "formularios" },
                            { label: "Límite de Plantillas", key: "plantillas" },
                            { label: "Límite de Roles", key: "roles" },
                            { label: "Límite de Categorías", key: "categorias" },
                            { label: "Límite de Sub-Empresas", key: "empresas" },
                        ].map((item, idx, arr) => (
                            <div key={item.key} className="flex items-center justify-between py-3 px-2 border-b border-border last:border-0 hover:bg-muted/50 transition-colors rounded-lg">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">{item.label}</span>
                                <div className="flex items-center w-24 bg-background border border-border rounded-lg overflow-hidden focus-within:border-indigo-600 transition-all h-9">
                                    <input
                                        type="number"
                                        value={formData[item.key]}
                                        onChange={(e) => setFormData({ ...formData, [item.key]: e.target.value })}
                                        className="w-full h-full px-2 bg-transparent text-center text-xs font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="0"
                                    />
                                    <div className="flex flex-col border-l border-border divide-y divide-border bg-muted/20 w-8 h-full">
                                        <button
                                            type="button"
                                            onClick={() => handleAdjust(item.key, 1)}
                                            className="flex-1 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95"
                                        >
                                            <ChevronUp size={12} strokeWidth={3} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleAdjust(item.key, -1)}
                                            className="flex-1 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95"
                                        >
                                            <ChevronDown size={12} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-muted/30 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[10px] font-black uppercase text-muted-foreground hover:text-foreground tracking-widest transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || isSuccess}
                        className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                    >
                        {isSaving ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : isSuccess ? (
                            "Guardado"
                        ) : (
                            "Guardar Cambios"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
