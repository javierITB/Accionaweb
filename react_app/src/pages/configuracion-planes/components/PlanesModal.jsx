import React, { useState, useEffect } from "react";
import { X, Check, Loader2, ShieldCheck, Activity } from "lucide-react";

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

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.REACT_APP_API_URL}/sas/companies/${company._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    planLimits: {
                        solicitudes: { maxTotal: parseInt(formData.solicitudes) || 0 },
                        tickets: { maxQuantity: parseInt(formData.tickets) || 0 },
                        users: { maxUsers: parseInt(formData.usuarios) || 0 },
                        forms: { maxQuantity: parseInt(formData.formularios) || 0 },
                        templates: { maxQuantity: parseInt(formData.plantillas) || 0 },
                        roles: { maxRoles: parseInt(formData.roles) || 0 },
                        configTickets: { maxCategories: parseInt(formData.categorias) || 0 },
                        companies: { maxQuantity: parseInt(formData.empresas) || 0 }
                    }
                }),
            });

            if (res.ok) {
                setIsSuccess(true);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1000);
            } else {
                setIsSaving(false);
            }
        } catch (error) {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-[#0f172a] rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-white/10 overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* HEADER SIMPLE */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-blue-500" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Configuración de Plan</h2>
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white p-1">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* INFO BAR SIMPLE (ESTILO IMAGEN) */}
                    <div className="px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Activity size={16} className="text-blue-500" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                BD: <span className="text-blue-500 ml-1">{company?.dbName?.toUpperCase()}</span>
                            </span>
                        </div>
                        <div className="px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/5">
                            <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Estado: Activo</span>
                        </div>
                    </div>

                    {/* LISTA DE LÍMITES MINIMALISTA */}
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
                            <div key={item.key} className="flex items-center justify-between py-3 px-2 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors rounded-lg">
                                <span className="text-xs font-semibold text-white/70 uppercase tracking-tight">{item.label}</span>
                                <input
                                    type="number"
                                    value={formData[item.key]}
                                    onChange={(e) => setFormData({ ...formData, [item.key]: e.target.value })}
                                    className="w-24 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white text-right focus:border-blue-500 outline-none transition-all"
                                    placeholder="0"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* FOOTER SIMPLE */}
                <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3 bg-white/[0.02] shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[10px] font-black uppercase text-white/50 hover:text-white tracking-widest transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || isSuccess}
                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
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
