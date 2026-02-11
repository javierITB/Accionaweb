import React, { useState, useEffect } from "react";
import { X, Check, Loader2, FileText, Bell, Users, ShieldCheck, Activity } from "lucide-react";
import Button from "components/ui/Button";

export function PlanesModal({ isOpen, onClose, onSuccess, company = null }) {
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        solicitudes: "100",
        tickets: "50",
        usuarios: "10",
    });

    useEffect(() => {
        if (isOpen) setIsSuccess(false);
        if (company && company.limits) {
            setFormData({
                solicitudes: company.limits.solicitudes || "100",
                tickets: company.limits.tickets || "50",
                usuarios: company.limits.usuarios || "10",
            });
        } else {
            setFormData({
                solicitudes: "100",
                tickets: "50",
                usuarios: "10",
            });
        }
    }, [isOpen, company]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setIsSaving(true);
        // Simular guardado ya que no hay back aún
        setTimeout(() => {
            setIsSaving(false);
            setIsSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 1000);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-border animate-in fade-in zoom-in duration-200">
                {/* HEADER CON GRADIENTE */}
                <div className="relative px-6 py-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Configuración de Plan</h2>
                            <p className="text-white/70 text-sm font-medium">{company?.name || "Empresa"}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Activity size={18} className="text-indigo-500" />
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Límites Operativos</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {/* Solicitudes */}
                            <div className="group">
                                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-2 ml-1 uppercase tracking-tight">
                                    <FileText size={14} className="text-blue-500" />
                                    Límite de Solicitudes
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.solicitudes}
                                        onChange={(e) => setFormData({ ...formData, solicitudes: e.target.value })}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-foreground font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all group-hover:border-indigo-500/30"
                                        placeholder="Ej: 100"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg">Mensual</span>
                                </div>
                            </div>

                            {/* Tickets */}
                            <div className="group">
                                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-2 ml-1 uppercase tracking-tight">
                                    <Bell size={14} className="text-orange-500" />
                                    Límite de Tickets
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.tickets}
                                        onChange={(e) => setFormData({ ...formData, tickets: e.target.value })}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-foreground font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all group-hover:border-indigo-500/30"
                                        placeholder="Ej: 50"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg">Activos</span>
                                </div>
                            </div>

                            {/* Usuarios */}
                            <div className="group">
                                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-2 ml-1 uppercase tracking-tight">
                                    <Users size={14} className="text-purple-500" />
                                    Límite de Usuarios
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.usuarios}
                                        onChange={(e) => setFormData({ ...formData, usuarios: e.target.value })}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-foreground font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all group-hover:border-indigo-500/30"
                                        placeholder="Ej: 10"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg">Totales</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                        <p className="text-[10px] text-indigo-600/70 font-medium leading-relaxed italic">
                            * Estos límites se aplicarán de forma global a la empresa seleccionada. Los cambios son instantáneos para la visualización pero requieren integración con el backend para la restricción real.
                        </p>
                    </div>
                </div>

                <div className="px-8 py-6 bg-muted border-t border-border flex flex-col gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || isSuccess}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Guardando Cambios...
                            </>
                        ) : isSuccess ? (
                            <>
                                <Check size={18} />
                                Plan Actualizado
                            </>
                        ) : (
                            "Guardar Configuración de Plan"
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
