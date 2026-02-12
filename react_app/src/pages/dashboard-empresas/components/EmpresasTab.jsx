import React, { useState } from "react";
import { Database, Trash2, HardDrive, Calendar, Loader2 } from "lucide-react";
import { apiFetch, API_BASE_URL } from "../../../utils/api";

export const EmpresasTab = ({ companies, isLoading, permisos, onRefresh, onEdit }) => {

    const handleDelete = async (company) => {
        if (window.confirm(`¿Estás seguro de ELIMINAR la empresa (Base de Datos) "${company.name}"? \n\n ESTA ACCIÓN BORRA TODOS LOS DATOS Y NO SE PUEDE DESHACER.`)) {
            try {
                const res = await apiFetch(`${API_BASE_URL}/sas/companies/${company._id}`, {
                    method: "DELETE",
                });

                if (res.ok) {
                    onRefresh();
                } else {
                    const err = await res.json();
                    alert(err.error || "Error al eliminar la empresa");
                }
            } catch (error) {
                alert("Error de conexión con el servidor");
            }
        }
    };

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
                    <p>Cargando empresas del cluster...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    {companies.map((company) => {
                        return (
                            <div
                                key={company._id || company.name}
                                className="bg-card rounded-xl border border-border shadow-sm p-6 hover:shadow-md transition-all group relative flex flex-col"
                            >
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">


                                    {/* Botón de Editar */}
                                    {permisos.create_empresas && company.dbName !== 'formsdb' && !company.isSystem && (
                                        <button
                                            onClick={() => onEdit(company)}
                                            className="p-1.5 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            title="Editar Permisos"
                                        >
                                            <Database size={16} />
                                        </button>
                                    )}

                                    {permisos.delete_empresas && company.dbName !== 'formsdb' && !company.isSystem && (
                                        <button
                                            onClick={() => handleDelete(company)}
                                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                            title="Eliminar Base de Datos"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg bg-indigo-600"
                                    >
                                        <Database size={24} />
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2 break-all">
                                    {company.name}
                                </h3>
                                {company.dbName && (
                                    <p className="text-xs text-muted-foreground mb-2 font-mono">
                                        {company.dbName}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                    <HardDrive size={14} />
                                    <span>{formatBytes(company.sizeOnDisk || 0)}</span>
                                </div>
                                {company.dbName !== 'formsdb' && !company.isSystem && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                        <Calendar size={14} />
                                        <span>{company.createdAt ? new Date(company.createdAt).toLocaleDateString() : "-"}</span>
                                    </div>
                                )}

                                <div className="mt-auto space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-foreground bg-muted/50 px-3 py-2 rounded-lg">
                                        {company.empty ? (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                <span>Vacía</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                <span>Activa</span>
                                            </>
                                        )}
                                    </div>

                                    <div className="h-px bg-border" />

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                                            MongoDB Database
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}


        </>
    );
};
