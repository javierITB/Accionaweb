import React, { useState } from "react";
import { LayoutDashboard, Users, FileText, Calendar, HardDrive, Lock, ShieldCheck, Loader2, Edit, Trash2 } from "lucide-react";
import { PlanManagerModal } from "./PlanManagerModal";

export const PlanesTab = ({ plans, isLoading, permisos, onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    return (
        <>
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-accent" />
                    <p>Cargando información de planes...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    {plans.map((plan) => {
                        return (
                            <div
                                key={plan._id}
                                className="bg-card rounded-2xl border border-white/5 shadow-xl hover:shadow-2xl transition-all group relative flex flex-col overflow-hidden max-w-full"
                            >
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-3xl shrink-0 flex items-center justify-center text-white shadow-lg bg-indigo-600">
                                            <LayoutDashboard size={28} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-black text-foreground truncate uppercase tracking-tight">
                                                {plan.name}
                                            </h3>
                                            <p className="text-xs text-muted-foreground truncate font-mono uppercase tracking-widest opacity-60">
                                                {plan.usageCount || 0} Empresas Asignadas
                                            </p>
                                            {plan.price !== undefined && (
                                                <p className="text-sm font-bold text-indigo-500 mt-1">
                                                    ${Math.floor(plan.price).toLocaleString('es-CL')} <span className="text-[10px] text-muted-foreground font-normal"> + IVA / mes</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 pl-1 mb-6">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground" title="Usuarios Máximos">
                                            <Users size={14} />
                                            <span>{plan.planLimits?.users?.maxUsers || "∞"} <span className="text-xs opacity-70">usuarios</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground" title="Formularios Máximos">
                                            <FileText size={14} />
                                            <span>{plan.planLimits?.forms?.maxQuantity || "∞"} <span className="text-xs opacity-70">formularios</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground" title="Fecha de Creación">
                                            <Calendar size={14} />
                                            <span>{plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : "-"}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20`}>
                                            Plan Global
                                        </div>

                                        {permisos.edit_empresas && (
                                            <button
                                                onClick={() => {
                                                    setEditingPlan(plan);
                                                    setIsModalOpen(true);
                                                }}
                                                className="px-4 py-2 bg-muted/50 hover:bg-muted text-foreground text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 border border-white/10 flex items-center gap-2"
                                            >
                                                <Edit size={14} />
                                                Editar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {plans.length === 0 && (
                        <div className="col-span-full py-20 text-center text-muted-foreground">
                            No hay planes configurados. Crea uno nuevo para comenzar.
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Configuración de Plan */}
            {isModalOpen && (
                <PlanManagerModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingPlan(null);
                    }}
                    onSuccess={() => {
                        onRefresh();
                        setIsModalOpen(false);
                        setEditingPlan(null);
                    }}
                    plan={editingPlan}
                />
            )}
        </>
    );
};
