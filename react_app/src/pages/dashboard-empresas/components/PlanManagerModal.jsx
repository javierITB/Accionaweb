import React, { useState, useEffect } from "react";
import { X, Check, Loader2, ShieldCheck, LayoutGrid, FileText, Ticket, Users, Building, Database, Save, Trash2, FolderOpen } from "lucide-react";
import { apiFetch, API_BASE_URL } from "../../../utils/api";
import { PERMISSION_GROUPS } from "../../../config/permissionGroups";

export function PlanManagerModal({ isOpen, onClose, onSuccess, plan = null }) {
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState("info"); // info, permissions, limits

    // State for Basic Info
    const [name, setName] = useState("");

    // State for Permissions
    const [permissions, setPermissions] = useState([]);
    const [permTab, setPermTab] = useState("admin");

    // State for Limits
    const [limits, setLimits] = useState({
        requests: { maxTotal: "", maxMonthly: "", maxYearly: "", maxArchived: "", deleteArchivedFiles: false },
        tickets: { maxQuantity: "", maxCategories: "" },
        resources: { users: "", forms: "", templates: "", roles: "" },
        companies: { maxQuantity: "" }
    });

    useEffect(() => {
        if (isOpen) {
            setIsSuccess(false);
            setActiveTab("info");
            if (plan) {
                setName(plan.name);
                setPermissions(plan.permissions || []);

                // Cargar limites
                const l = plan.planLimits || {};
                const getVal = (val) => (val !== undefined && val !== null) ? val : "";
                const reqLimit = l.requests ?? l.solicitudes;
                const reqObj = (typeof reqLimit === 'object') ? reqLimit : { maxTotal: reqLimit };

                setLimits({
                    requests: {
                        maxTotal: getVal(reqObj.maxTotal),
                        maxMonthly: getVal(reqObj.maxMonthly),
                        maxYearly: getVal(reqObj.maxYearly),
                        maxArchived: getVal(reqObj.maxArchived),
                        deleteArchivedFiles: reqObj.deleteArchivedFiles === true || reqObj.deleteArchivedFiles === "true"
                    },
                    tickets: {
                        maxQuantity: getVal(l.tickets?.maxQuantity),
                        maxCategories: getVal(l.configTickets?.maxCategories)
                    },
                    resources: {
                        users: getVal(l.users?.maxUsers),
                        forms: getVal(l.forms?.maxQuantity),
                        templates: getVal(l.templates?.maxQuantity),
                        roles: getVal(l.roles?.maxRoles)
                    },
                    companies: {
                        maxQuantity: getVal(l.companies?.maxQuantity)
                    }
                });
            } else {
                setName("");
                setPermissions([]);
                setLimits({
                    requests: { maxTotal: "", maxMonthly: "", maxYearly: "", maxArchived: "", deleteArchivedFiles: false },
                    tickets: { maxQuantity: "", maxCategories: "" },
                    resources: { users: "", forms: "", templates: "", roles: "" },
                    companies: { maxQuantity: "" }
                });
            }
        }
    }, [isOpen, plan]);

    if (!isOpen) return null;

    // --- HANDLERS ---

    const handleLimitChange = (category, field, value) => {
        setLimits(prev => ({
            ...prev,
            [category]: { ...prev[category], [field]: value }
        }));
    };

    const togglePermission = (permId) => {
        setPermissions(prev => {
            const hasPerm = prev.includes(permId);
            let newPerms = hasPerm ? prev.filter(p => p !== permId) : [...prev, permId];

            // Logica de dependencias
            if (hasPerm) {
                // Eliminar padre elimina hijos
                const dependentPerms = Object.values(PERMISSION_GROUPS)
                    .flatMap(g => g.permissions)
                    .filter(p => p.dependency === permId)
                    .map(p => p.id);

                if (dependentPerms.length > 0) {
                    newPerms = newPerms.filter(p => !dependentPerms.includes(p));
                }
            } else {
                // Agregar hijo agrega padre
                const permObj = Object.values(PERMISSION_GROUPS).flatMap(g => g.permissions).find(p => p.id === permId);
                if (permObj && permObj.dependency && !newPerms.includes(permObj.dependency)) {
                    newPerms.push(permObj.dependency);
                }
            }
            return newPerms;
        });
    };

    const toggleAllInPermTab = () => {
        const permsInTab = Object.values(PERMISSION_GROUPS)
            .filter(g => g.tagg === permTab)
            .flatMap(g => g.permissions);

        const availablePerms = permsInTab
            .filter(p => !p.dependency || permissions.includes(p.dependency))
            .map(p => p.id);

        const allSelected = availablePerms.every(id => permissions.includes(id));

        setPermissions(prev => {
            if (allSelected) {
                return prev.filter(p => !availablePerms.includes(p));
            } else {
                return [...new Set([...prev, ...availablePerms])];
            }
        });
    };

    const handleSubmit = async () => {
        if (!name) return;
        setIsSaving(true);
        try {
            const parseIntOrNull = (val) => {
                if (val === "" || val === null || val === undefined) return null;
                const parsed = parseInt(val);
                return isNaN(parsed) ? null : parsed;
            };

            const payload = {
                name,
                permissions,
                planLimits: {
                    requests: {
                        maxTotal: parseIntOrNull(limits.requests.maxTotal),
                        maxMonthly: parseIntOrNull(limits.requests.maxMonthly),
                        maxYearly: parseIntOrNull(limits.requests.maxYearly),
                        maxArchived: parseIntOrNull(limits.requests.maxArchived),
                        deleteArchivedFiles: limits.requests.deleteArchivedFiles
                    },
                    tickets: { maxQuantity: parseIntOrNull(limits.tickets.maxQuantity) },
                    configTickets: { maxCategories: parseIntOrNull(limits.tickets.maxCategories) },
                    users: { maxUsers: parseIntOrNull(limits.resources.users) },
                    forms: { maxQuantity: parseIntOrNull(limits.resources.forms) },
                    templates: { maxQuantity: parseIntOrNull(limits.resources.templates) },
                    roles: { maxRoles: parseIntOrNull(limits.resources.roles) },
                    companies: { maxQuantity: parseIntOrNull(limits.companies.maxQuantity) }
                }
            };

            const url = `${API_BASE_URL}/sas/plans${plan ? `/${plan._id}` : ''}`;
            const method = plan ? "PUT" : "POST";

            const res = await apiFetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setIsSuccess(true);
                if (data.propagatedTo > 0) {
                    console.log(`Plan propagado a ${data.propagatedTo} empresas.`);
                }
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1000);
            } else {
                const err = await res.json();
                alert(err.error || "Error al guardar el plan");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("¿Seguro que deseas eliminar este plan?")) return;
        setIsDeleting(true);
        try {
            const res = await apiFetch(`${API_BASE_URL}/sas/plans/${plan._id}`, { method: "DELETE" });
            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const err = await res.json();
                alert(err.error || "Error al eliminar");
            }
        } catch (e) {
            alert("Error de conexión");
        } finally {
            setIsDeleting(false);
        }
    };

    const mainTabs = [
        { id: "info", label: "Información", icon: FileText },
        { id: "permissions", label: "Permisos", icon: ShieldCheck },
        { id: "limits", label: "Límites", icon: LayoutGrid },
    ];

    const isAdminPanelEnabled = permissions.includes("view_panel_admin");
    const isClientPanelEnabled = permissions.includes("view_panel_cliente");

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl h-[700px] max-h-[90vh] flex flex-col border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* HEADER */}
                <div className="relative h-20 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                            <FolderOpen size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">
                                {plan ? "Editar Plan" : "Nuevo Plan"}
                            </h2>
                            <p className="text-white/70 text-xs font-bold">{plan ? plan.name : "Configuración Global"}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* SIDEBAR TABS */}
                    <div className="w-56 bg-muted/20 border-r border-border p-4 space-y-2 shrink-0">
                        {mainTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${activeTab === tab.id
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
                    <div className="flex-1 overflow-y-auto p-8">

                        {/* TAB INFO */}
                        {activeTab === "info" && (
                            <div className="space-y-6 max-w-lg">
                                <div>
                                    <label className="text-sm font-bold text-muted-foreground mb-2 block uppercase">Nombre del Plan</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Plan Básico, Plan Gold..."
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                                    />
                                </div>
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                    <p className="text-xs text-blue-600 leading-relaxed">
                                        <strong>Nota:</strong> Los cambios realizados en este plan se propagarán automáticamente a todas las empresas asignadas.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* TAB PERMISSIONS */}
                        {activeTab === "permissions" && (
                            <div className="h-full flex flex-col">
                                {/* Sub-tabs */}
                                <div className="flex p-1 bg-muted rounded-xl space-x-1 mb-6 shrink-0">
                                    <button onClick={() => setPermTab("admin")} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${permTab === "admin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Administración</button>
                                    <button onClick={() => setPermTab("cliente")} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${permTab === "cliente" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Cliente</button>
                                </div>

                                <button onClick={toggleAllInPermTab} className="mb-4 w-full py-2 border border-dashed border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/5 rounded-lg text-xs font-bold uppercase">
                                    Seleccionar / Desmarcar Todo
                                </button>

                                <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                                    {/* HABILITADOR ROOT */}
                                    {Object.entries(PERMISSION_GROUPS)
                                        .filter(([_, g]) => g.tagg === "root" && g.label.toLowerCase().includes(permTab))
                                        .map(([key, group]) => {
                                            const isEnabled = permissions.includes(group.permissions[0].id);
                                            return (
                                                <div key={key} onClick={() => togglePermission(group.permissions[0].id)} className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isEnabled ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500" : "border-border bg-muted/20 opacity-60"}`}>
                                                    <span className="text-sm font-bold text-foreground">{group.label}</span>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isEnabled ? "bg-indigo-500 border-indigo-500" : "border-muted-foreground"}`}>
                                                        {isEnabled && <Check size={12} strokeWidth={4} className="text-white" />}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                    {/* GRUPOS */}
                                    {((permTab === "admin" && isAdminPanelEnabled) || (permTab === "cliente" && isClientPanelEnabled)) &&
                                        Object.entries(PERMISSION_GROUPS)
                                            .filter(([_, g]) => g.tagg === permTab)
                                            // Filter out system-only groups
                                            .filter(([key, _]) => key !== 'gestor_empresas' && key !== 'configuracion_planes')
                                            .map(([groupId, group]) => {
                                                const ids = group.permissions.map(p => p.id);
                                                const isAllSelected = ids.every(id => permissions.includes(id));
                                                return (
                                                    <div key={groupId} className="rounded-xl border border-border bg-muted/10 overflow-hidden">
                                                        <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                                                            <span className="text-xs font-bold text-foreground">{group.label}</span>
                                                            <div className={`w-3 h-3 rounded-full ${isAllSelected ? "bg-indigo-500" : "bg-muted-foreground/30"}`} />
                                                        </div>
                                                        <div className="p-3 grid grid-cols-1 gap-1">
                                                            {group.permissions.map(perm => {
                                                                if (perm.dependency && !permissions.includes(perm.dependency)) return null;
                                                                const isSelected = permissions.includes(perm.id);
                                                                return (
                                                                    <label key={perm.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer">
                                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-border"}`}>
                                                                            {isSelected && <Check size={10} strokeWidth={3} />}
                                                                        </div>
                                                                        <span className="text-xs text-muted-foreground">{perm.label}</span>
                                                                        <input type="checkbox" className="hidden" checked={isSelected} onChange={() => togglePermission(perm.id)} />
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                    }
                                </div>
                            </div>
                        )}

                        {/* TAB LIMITS */}
                        {activeTab === "limits" && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <section>
                                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-4">Solicitudes</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="Total Histórico" value={limits.requests.maxTotal} onChange={(v) => handleLimitChange("requests", "maxTotal", v)} />
                                        <InputGroup label="Mensual" value={limits.requests.maxMonthly} onChange={(v) => handleLimitChange("requests", "maxMonthly", v)} />
                                        <InputGroup label="Anual" value={limits.requests.maxYearly} onChange={(v) => handleLimitChange("requests", "maxYearly", v)} />
                                        <InputGroup label="Archivados" value={limits.requests.maxArchived} onChange={(v) => handleLimitChange("requests", "maxArchived", v)} />
                                    </div>
                                    <label className="flex items-center gap-3 mt-4 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 cursor-pointer">
                                        <input type="checkbox" checked={limits.requests.deleteArchivedFiles} onChange={(e) => handleLimitChange("requests", "deleteArchivedFiles", e.target.checked)} className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500 bg-background" />
                                        <span className="text-xs font-bold text-foreground">Eliminar archivos al archivar</span>
                                    </label>
                                </section>

                                <section>
                                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2 mb-4">Recursos y Tickets</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="Tickets Activos" value={limits.tickets.maxQuantity} onChange={(v) => handleLimitChange("tickets", "maxQuantity", v)} />
                                        <InputGroup label="Categorías Tickets" value={limits.tickets.maxCategories} onChange={(v) => handleLimitChange("tickets", "maxCategories", v)} />
                                        <InputGroup label="Usuarios" value={limits.resources.users} onChange={(v) => handleLimitChange("resources", "users", v)} />
                                        <InputGroup label="Roles" value={limits.resources.roles} onChange={(v) => handleLimitChange("resources", "roles", v)} />
                                        <InputGroup label="Formularios" value={limits.resources.forms} onChange={(v) => handleLimitChange("resources", "forms", v)} />
                                        <InputGroup label="Plantillas" value={limits.resources.templates} onChange={(v) => handleLimitChange("resources", "templates", v)} />
                                        <InputGroup label="Sub-Empresas" value={limits.companies.maxQuantity} onChange={(v) => handleLimitChange("companies", "maxQuantity", v)} />
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="px-8 py-5 border-t border-border flex justify-between items-center bg-muted/10 shrink-0">
                    <div>
                        {plan && (
                            <button onClick={handleDelete} disabled={isDeleting} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all">
                                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 text-xs font-bold uppercase text-muted-foreground hover:text-foreground tracking-widest transition-colors">Cancelar</button>
                        <button onClick={handleSubmit} disabled={isSaving || isSuccess || !name} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : isSuccess ? <Check size={14} /> : <Save size={14} />}
                            {isSuccess ? "Guardado" : "Guardar Plan"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper Component (Same as PlanesModal but simplified prop drill)
function InputGroup({ label, value, onChange }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{label}</label>
            <div className="flex items-center bg-background border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all h-9">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-full px-3 bg-transparent text-sm font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/30"
                    placeholder="∞"
                />
            </div>
        </div>
    );
}
