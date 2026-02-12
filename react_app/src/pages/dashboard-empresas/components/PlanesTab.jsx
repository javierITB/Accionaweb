import React, { useState } from "react";
import { LayoutDashboard, Users, FileText, Calendar, HardDrive, Lock, ShieldCheck, Loader2 } from "lucide-react";
import { PlanesModal } from "./PlanesModal";

export const PlanesTab = ({ companies, isLoading, permisos, onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    return (
        <>
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-accent" />
                    <p>Cargando información de planes...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    {companies.map((company) => {
                        return (
                            <div
                                key={company._id || company.name}
                                className="bg-card rounded-2xl border border-white/5 shadow-xl hover:shadow-2xl transition-all group relative flex flex-col overflow-hidden max-w-full"
                            >
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-3xl shrink-0 flex items-center justify-center text-white shadow-lg bg-indigo-600">
                                            <LayoutDashboard size={28} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-black text-foreground truncate uppercase tracking-tight">
                                                {company.name}
                                            </h3>
                                            <p className="text-xs text-muted-foreground truncate font-mono uppercase tracking-widest opacity-60">
                                                {company.dbName || "no-db"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 pl-1 mb-6">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <HardDrive size={14} />
                                            <span>{formatBytes(company.sizeOnDisk || 0)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground" title="Usuarios Máximos">
                                            <Users size={14} />
                                            <span>{company.planLimits?.users?.maxUsers || "∞"} <span className="text-xs opacity-70">usuarios</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground" title="Formularios Máximos">
                                            <FileText size={14} />
                                            <span>{company.planLimits?.forms?.maxQuantity || "∞"} <span className="text-xs opacity-70">formularios</span></span>
                                        </div>
                                        {company.dbName !== 'formsdb' && !company.isSystem && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground" title="Fecha de Creación">
                                                <Calendar size={14} />
                                                <span>{company.createdAt ? new Date(company.createdAt).toLocaleDateString() : "-"}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${company.empty
                                            ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                                            : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${company.empty ? "bg-orange-500 animate-pulse" : "bg-emerald-500"}`} />
                                            {company.empty ? "Vacía" : "Activa"}
                                        </div>

                                        {permisos.edit_empresas && (
                                            (company.dbName === 'formsdb' || company.isSystem) ? (
                                                <div className="px-4 py-2 bg-muted/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 cursor-not-allowed border border-white/5 opacity-50">
                                                    <Lock size={14} />
                                                    Sistema
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setEditingPlan(company);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                                                >
                                                    <ShieldCheck size={14} />
                                                    Límites
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de Configuración de Plan */}
            {isModalOpen && (
                <PlanesModal
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
                    company={editingPlan}
                />
            )}
        </>
    );
};
