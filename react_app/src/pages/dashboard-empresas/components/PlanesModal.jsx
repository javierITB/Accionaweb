import React, { useState, useEffect } from "react";
import { X, Check, Loader2, ShieldCheck, Activity, ChevronUp, ChevronDown, LayoutGrid, FileText, Ticket, Users, Building, Settings } from "lucide-react";
import { apiFetch } from "../../../utils/api";

export function PlanesModal({ isOpen, onClose, onSuccess, company = null }) {
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState("solicitudes");

    const [formData, setFormData] = useState({
        requests: {
            maxTotal: "",
            maxMonthly: "",
            maxYearly: "",
            maxArchived: "",
            deleteArchivedFiles: false
        },
        tickets: {
            maxQuantity: "",
            maxCategories: "" // Agrupamos configTickets aquí visualmente
        },
        resources: {
            users: "",
            forms: "",
            templates: "",
            roles: ""
        },
        companies: {
            maxQuantity: ""
        }
    });

    useEffect(() => {
        if (isOpen) setIsSuccess(false);
        if (company) {
            const limits = company.planLimits || {};

            // Helper para obtener valor seguro
            const getVal = (val, def = "") => (val !== undefined && val !== null) ? val : def;

            // Requests: puede ser objeto o numero legacy
            const reqLimit = limits.requests ?? limits.solicitudes;
            const reqObj = (typeof reqLimit === 'object') ? reqLimit : { maxTotal: reqLimit };

            setFormData({
                requests: {
                    maxTotal: getVal(reqObj.maxTotal),
                    maxMonthly: getVal(reqObj.maxMonthly),
                    maxYearly: getVal(reqObj.maxYearly),
                    maxArchived: getVal(reqObj.maxArchived),
                    deleteArchivedFiles: reqObj.deleteArchivedFiles === true || reqObj.deleteArchivedFiles === "true"
                },
                tickets: {
                    maxQuantity: getVal(limits.tickets?.maxQuantity),
                    maxCategories: getVal(limits.configTickets?.maxCategories)
                },
                resources: {
                    users: getVal(limits.users?.maxUsers),
                    forms: getVal(limits.forms?.maxQuantity),
                    templates: getVal(limits.templates?.maxQuantity),
                    roles: getVal(limits.roles?.maxRoles)
                },
                companies: {
                    maxQuantity: getVal(limits.companies?.maxQuantity)
                }
            });
        }
    }, [isOpen, company]);

    if (!isOpen) return null;
    if (company?.dbName === 'formsdb' || company?.isSystem) return null;

    const handleRequestChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            requests: { ...prev.requests, [field]: value }
        }));
    };

    const handleTicketChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            tickets: { ...prev.tickets, [field]: value }
        }));
    };

    const handleResourceChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            resources: { ...prev.resources, [field]: value }
        }));
    };

    const handleCompanyChange = (value) => {
        setFormData(prev => ({
            ...prev,
            companies: { ...prev.companies, maxQuantity: value }
        }));
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            // Helper para convertir vacío a null (sin límite) en lugar de 0
            const parseIntOrNull = (val) => {
                if (val === "" || val === null || val === undefined) return null;
                const parsed = parseInt(val);
                return isNaN(parsed) ? null : parsed;
            };

            const payload = {
                planLimits: {
                    requests: {
                        maxTotal: parseIntOrNull(formData.requests.maxTotal),
                        maxMonthly: parseIntOrNull(formData.requests.maxMonthly),
                        maxYearly: parseIntOrNull(formData.requests.maxYearly),
                        maxArchived: parseIntOrNull(formData.requests.maxArchived),
                        deleteArchivedFiles: formData.requests.deleteArchivedFiles
                    },
                    tickets: { maxQuantity: parseIntOrNull(formData.tickets.maxQuantity) },
                    configTickets: { maxCategories: parseIntOrNull(formData.tickets.maxCategories) },
                    users: { maxUsers: parseIntOrNull(formData.resources.users) },
                    forms: { maxQuantity: parseIntOrNull(formData.resources.forms) },
                    templates: { maxQuantity: parseIntOrNull(formData.resources.templates) },
                    roles: { maxRoles: parseIntOrNull(formData.resources.roles) },
                    companies: { maxQuantity: parseIntOrNull(formData.companies.maxQuantity) }
                }
            };

            // Limpiar valores 0 si queremos que signifiquen "sin limite" o manejarlos como tal. 
            // Por ahora asumimos que el input vacio es "" y parseInt es NaN -> 0.
            // Si el backend trata 0 como bloqueo, perfecto. Si 0 es infinito, hay que ajustar.
            // Asumimos: backend compara >= limit. Si limit es 0, nadie puede crear. Correcto.

            const res = await apiFetch(`/sas/companies/${company._id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
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
            console.error("Error saving plan limits:", error);
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: "solicitudes", label: "Solicitudes", icon: FileText },
        { id: "tickets", label: "Tickets", icon: Ticket },
        { id: "recursos", label: "Recursos", icon: LayoutGrid },
        { id: "empresas", label: "Sub-Empresas", icon: Building },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl h-[650px] max-h-[90vh] flex flex-col border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* HEADER */}
                <div className="relative h-24 bg-gradient-to-r from-indigo-600 to-indigo-800 flex items-center px-8 shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/50 hover:text-white p-1.5 hover:bg-white/10 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                            <ShieldCheck size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Configuración de Plan</h2>
                            <p className="text-white/70 text-xs font-bold">{company?.name}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* SIDEBAR TABS */}
                    <div className="w-48 bg-muted/20 border-r border-border p-4 space-y-2 shrink-0 overflow-y-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${activeTab === tab.id
                                    ? "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* CONTENT AREA */}
                    <div className="flex-1 overflow-y-auto p-6">

                        {/* TAB SOLICITUDES */}
                        {activeTab === "solicitudes" && (
                            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest border-b border-border pb-2">Límites de Cantidad</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <InputGroup label="Máximo Total" value={formData.requests.maxTotal} onChange={(v) => handleRequestChange("maxTotal", v)} />
                                        <InputGroup label="Máximo Mensual" value={formData.requests.maxMonthly} onChange={(v) => handleRequestChange("maxMonthly", v)} />
                                        <InputGroup label="Máximo Anual" value={formData.requests.maxYearly} onChange={(v) => handleRequestChange("maxYearly", v)} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest border-b border-border pb-2">Archivado y Limpieza</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <InputGroup label="Límite en Archivados" value={formData.requests.maxArchived} onChange={(v) => handleRequestChange("maxArchived", v)} />
                                    </div>
                                    <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.requests.deleteArchivedFiles}
                                            onChange={(e) => handleRequestChange("deleteArchivedFiles", e.target.checked)}
                                            className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500 bg-background"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-foreground">Eliminar archivos al archivar</span>
                                            <span className="text-[10px] text-muted-foreground">Elimina permanentemente los adjuntos de la solicitud al cambiar estado a "Archivado".</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* TAB TICKETS */}
                        {activeTab === "tickets" && (
                            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest border-b border-border pb-2">Gestión de Tickets</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <InputGroup label="Máximo de Tickets Activos" value={formData.tickets.maxQuantity} onChange={(v) => handleTicketChange("maxQuantity", v)} />
                                        <InputGroup label="Máximo de Categorías" value={formData.tickets.maxCategories} onChange={(v) => handleTicketChange("maxCategories", v)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB RECURSOS */}
                        {activeTab === "recursos" && (
                            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest border-b border-border pb-2">Límites Generales</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <InputGroup label="Usuarios Máximos" value={formData.resources.users} onChange={(v) => handleResourceChange("users", v)} />
                                        <InputGroup label="Roles Personalizados" value={formData.resources.roles} onChange={(v) => handleResourceChange("roles", v)} />
                                        <InputGroup label="Formularios Activos" value={formData.resources.forms} onChange={(v) => handleResourceChange("forms", v)} />
                                        <InputGroup label="Plantillas de Documentos" value={formData.resources.templates} onChange={(v) => handleResourceChange("templates", v)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB EMPRESAS */}
                        {activeTab === "empresas" && (
                            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest border-b border-border pb-2">Multi-Empresa</h3>
                                    <InputGroup label="Sub-Empresas Permitidas" value={formData.companies.maxQuantity} onChange={(v) => handleCompanyChange(v)} />
                                </div>
                            </div>
                        )}
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

// Componente Helper para Inputs
function InputGroup({ label, value, onChange }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">{label}</label>
            <div className="flex items-center bg-background border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all h-10">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-full px-3 bg-transparent text-sm font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/30"
                    placeholder="∞"
                />
                <div className="flex flex-col border-l border-border divide-y divide-border bg-muted/20 w-8 h-full shrink-0">
                    <button
                        type="button"
                        onClick={() => onChange(Math.max(0, (parseInt(value) || 0) + 1).toString())}
                        className="flex-1 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95"
                    >
                        <ChevronUp size={10} strokeWidth={3} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange(Math.max(0, (parseInt(value) || 0) - 1).toString())}
                        className="flex-1 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95"
                    >
                        <ChevronDown size={10} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    );
}
