import React, { useState, useEffect } from "react";
import { X, Check, Loader2, ShieldCheck, LayoutGrid, FileText, Ticket, Users, Building, Database, Save, Trash2, FolderOpen, MoreHorizontal, Layers, ChevronRight, UserCircle, Lock, Monitor, Shield } from "lucide-react";
import { apiFetch, API_BASE_URL } from "../../../utils/api";
import { PERMISSION_GROUPS } from "../../../config/permissionGroups";

export function PlanManagerModal({ isOpen, onClose, onSuccess, plan = null }) {
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState("permissions"); // permissions, limits

    // State for Basic Info
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");

    // State for Permissions
    const [permissions, setPermissions] = useState([]);
    const [permTab, setPermTab] = useState("admin");

    // State for Limits
    const [limits, setLimits] = useState({
        requests: { maxTotal: "", maxMonthly: "", maxYearly: "", maxArchived: "", deleteArchivedFiles: false },
        tickets: { maxQuantity: "", maxCategories: "" },
        resources: { users: "", forms: "", templates: "", roles: "" },
        companies: { maxQuantity: "" },
        chatbot: { maxQuantity: "" }
    });

    useEffect(() => {
        if (isOpen) {
            setIsSuccess(false);
            setActiveTab("permissions");
            if (plan) {
                setName(plan.name);
                setPrice(plan.price || "");
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
                    },
                    chatbot: {
                        maxQuantity: getVal(l.chatbot?.maxQuantity)
                    }
                });
            } else {
                setName("");
                setPrice("");
                setPermissions([
                    "view_panel_cliente",
                    "view_home",
                    "view_perfil",
                    "view_mis_solicitudes",
                    "share_mis_solicitudes",
                    "unshare_mis_solicitudes",
                    "view_formulario",
                    "view_formularios_cliente",
                    "view_panel_admin",
                    "view_usuarios",
                    "edit_usuarios",
                    "delete_usuarios",
                    "create_usuarios",
                    "view_empresas",
                    "edit_empresas",
                    "delete_empresas",
                    "create_empresas",
                    "view_empresas_permissions_list",
                    "view_gestor_roles",
                    "view_gestor_roles_details",
                    "create_gestor_roles",
                    "copy_gestor_roles",
                    "view_gestor_roles_details_admin",
                    "delete_gestor_roles",
                    "edit_gestor_roles",
                    "edit_gestor_roles_by_self",
                    "edit_gestor_roles_admin"
                ]);
                setLimits({
                    requests: { maxTotal: "", maxMonthly: "", maxYearly: "", maxArchived: "", deleteArchivedFiles: false },
                    tickets: { maxQuantity: "", maxCategories: "" },
                    resources: { users: "", forms: "", templates: "", roles: "" },
                    companies: { maxQuantity: "" },
                    chatbot: { maxQuantity: "" }
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

            // 1. Limpieza por Paneles Raíz (Simulando RoleModal logic)
            if (permId === "view_panel_admin" && hasPerm) {
                const adminIds = Object.values(PERMISSION_GROUPS)
                    .filter(g => g.tagg === "admin")
                    .flatMap(g => g.permissions.map(p => p.id));
                newPerms = newPerms.filter(p => !adminIds.includes(p));
            }
            if (permId === "view_panel_cliente" && hasPerm) {
                const clienteIds = Object.values(PERMISSION_GROUPS)
                    .filter(g => g.tagg === "cliente")
                    .flatMap(g => g.permissions.map(p => p.id));
                newPerms = newPerms.filter(p => !clienteIds.includes(p));
            }

            // 2. Lógica de Dependencias
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
                // Agregar hijo puede requerir padre? 
                // En RoleModal no fuerzan al padre al seleccionar hijo (el hijo queda deshabilitado/oculto en UI si no hay padre).
                // Pero aquí, si el usuario selecciona algo via código (si fuera posible), deberíamos consistencia.
            }
            return newPerms;
        });
    };

    // "Va de a poco seleccionando" logic
    const toggleGroup = (group) => {
        const ids = group.permissions.map(p => p.id);
        const isAllSelected = ids.every(id => permissions.includes(id));

        const availableIds = group.permissions
            .filter(p => !p.dependency || permissions.includes(p.dependency))
            .map(p => p.id);

        setPermissions(prev => {
            if (isAllSelected) {
                // Deseleccionar todo el grupo
                return prev.filter(p => !ids.includes(p));
            } else {
                // Seleccionar incrementalmente
                return [...new Set([...prev, ...availableIds])];
            }
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
                price: parseFloat(price) || 0,
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
                    companies: { maxQuantity: parseIntOrNull(limits.companies.maxQuantity) },
                    chatbot: { maxQuantity: parseIntOrNull(limits.chatbot.maxQuantity) }
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
        { id: "permissions", label: "Permisos", icon: ShieldCheck },
        { id: "limits", label: "Límites", icon: LayoutGrid },
    ];

    const isAdminPanelEnabled = permissions.includes("view_panel_admin");
    const isClientPanelEnabled = permissions.includes("view_panel_cliente");
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl h-[700px] max-h-[90vh] flex flex-col border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* HEADER */}
                {/* HEADER */}
                <div className="relative h-28 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-6 flex-1 pr-6">

                        {/* Name Input */}
                        <div className="flex-1 space-y-1.5 group">
                            <label className="text-[10px] font-bold text-blue-100 uppercase tracking-wider opacity-60 pl-1 group-hover:opacity-100 transition-opacity">
                                Nombre del Plan Global
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Plan Corp"
                                className="w-full h-12 bg-white/10 border border-white/10 rounded-xl px-4 text-white placeholder:text-white/30 font-bold focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/20 transition-all text-base"
                                autoFocus={!plan}
                            />
                        </div>

                        {/* Price Input with CLP prefix */}
                        <div className="w-56 space-y-1.5 group">
                            <label className="text-[10px] font-bold text-blue-100 uppercase tracking-wider opacity-60 pl-1 group-hover:opacity-100 transition-opacity">
                                Precio Neto
                            </label>
                            <div className="relative h-12 w-full">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="text-white font-bold text-xs opacity-50 tracking-wide">CLP</span>
                                </div>
                                <input
                                    type="text"
                                    value={price ? Number(price).toLocaleString('es-CL') : ""}
                                    onChange={(e) => {
                                        // Remove any dots or non-numeric chars to keep raw number
                                        const rawValue = e.target.value.replace(/\D/g, "");
                                        setPrice(rawValue);
                                    }}
                                    placeholder="0"
                                    className="w-full h-full bg-white/10 border border-white/10 rounded-xl pl-12 pr-14 text-white placeholder:text-white/30 font-bold focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/20 transition-all text-base text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                                    <span className="text-white font-black text-xs opacity-90 tracking-tighter -translate-y-[1px]">
                                        + IVA
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all self-start mt-6">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* SIDEBAR TABS */}
                    <div className="w-56 bg-muted/20 border-r border-border p-4 space-y-2 shrink-0 pt-8">
                        {mainTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${activeTab === tab.id
                                    ? "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 shadow-sm" // Active state
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* CONTENT AREA */}
                    <div className="flex-1 overflow-y-auto p-8 bg-background/50">

                        {/* TAB PERMISSIONS */}
                        {activeTab === "permissions" && (
                            <div className="h-full flex flex-col">
                                {/* Sub-tabs - High Contrast in Dark Mode */}
                                <div className="flex p-1 bg-muted rounded-xl space-x-1 mb-6 shrink-0 border border-border/50">
                                    <button
                                        onClick={() => setPermTab("admin")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${permTab === "admin"
                                            ? "bg-card text-foreground shadow-sm ring-1 ring-border/50"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        <Shield size={14} /> Administración
                                    </button>
                                    <button
                                        onClick={() => setPermTab("cliente")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${permTab === "cliente"
                                            ? "bg-card text-foreground shadow-sm ring-1 ring-border/50"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        <UserCircle size={14} /> Cliente
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <button
                                        type="button"
                                        onClick={toggleAllInPermTab}
                                        className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-dashed border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-xl text-xs font-bold transition-all"
                                    >
                                        <LayoutGrid size={14} />
                                        Seleccionar / Desmarcar disponibles en esta pestaña
                                    </button>
                                </div>

                                <div className="space-y-4 overflow-y-auto flex-1 pr-2 pb-4">
                                    {/* HABILITADOR ROOT */}
                                    {Object.entries(PERMISSION_GROUPS)
                                        .filter(([_, g]) => g.tagg === "root" && g.label.toLowerCase().includes(permTab))
                                        .map(([key, group]) => {
                                            const isEnabled = permissions.includes(group.permissions[0].id);
                                            return (
                                                <div key={key} onClick={() => togglePermission(group.permissions[0].id)} className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isEnabled ? "border-indigo-600 bg-indigo-600/5 ring-1 ring-indigo-600" : "border-border bg-muted/20 opacity-60"}`}>
                                                    <span className="text-sm font-bold text-foreground">{group.label}</span>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isEnabled ? "bg-indigo-600 border-indigo-600" : "border-muted-foreground"}`}>
                                                        {isEnabled && <Check size={12} strokeWidth={4} className="text-white" />}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                    {/* GRUPOS */}
                                    {((permTab === "admin" && isAdminPanelEnabled) || (permTab === "cliente" && isClientPanelEnabled)) ? (
                                        Object.entries(PERMISSION_GROUPS)
                                            .filter(([_, g]) => g.tagg === permTab)
                                            // Filter out system-only groups
                                            .filter(([key, _]) => !['gestor_empresas', 'configuracion_planes', 'registro_empresas', 'pagos'].includes(key))
                                            .map(([groupId, group]) => {
                                                const ids = group.permissions.map(p => p.id);
                                                const isAllSelected = ids.every(id => permissions.includes(id));
                                                return (
                                                    <div key={groupId} className="rounded-xl border border-border bg-muted/10 overflow-hidden">
                                                        <div
                                                            className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between group cursor-pointer hover:bg-muted/50"
                                                            onClick={() => toggleGroup(group)}
                                                        >
                                                            <span className="text-xs font-bold text-foreground uppercase tracking-wide">{group.label}</span>
                                                            <div
                                                                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isAllSelected
                                                                    ? "bg-indigo-600 text-white border-indigo-600"
                                                                    : "bg-background border-border"
                                                                    }`}
                                                            >
                                                                {isAllSelected && <Check size={12} strokeWidth={3} />}
                                                            </div>
                                                        </div>
                                                        <div className="p-3 grid grid-cols-1 gap-1">
                                                            {group.permissions.map(perm => {
                                                                // Show dependency only if parent is selected
                                                                if (perm.dependency && !permissions.includes(perm.dependency)) return null;

                                                                const isSelected = permissions.includes(perm.id);
                                                                const isChild = !!perm.dependency;

                                                                return (
                                                                    <label key={perm.id} className={`flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors ${isChild ? "ml-6 border-l border-border pl-4" : ""}`}>
                                                                        {isChild && <ChevronRight size={12} className="text-muted-foreground" />}
                                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-border bg-background"}`}>
                                                                            {isSelected && <Check size={10} strokeWidth={3} />}
                                                                        </div>
                                                                        <span className="text-xs text-muted-foreground font-medium">{perm.label}</span>
                                                                        <input type="checkbox" className="hidden" checked={isSelected} onChange={() => togglePermission(perm.id)} />
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                    ) : (
                                        <div className="py-10 text-center border border-dashed border-border rounded-xl">
                                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Lock size={20} className="text-muted-foreground opacity-50" />
                                            </div>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                Habilita el panel superior para configurar vistas
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB LIMITS */}
                        {activeTab === "limits" && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 pb-10">
                                {/* Section: Solicitudes */}
                                <div className="rounded-xl border border-border bg-card shadow-sm p-6">
                                    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shadow-sm">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-wide">Límites de Solicitudes</h3>
                                            <p className="text-[10px] text-muted-foreground font-medium">Controla el volumen de respuestas permitidas</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <InputGroup label="Total Histórico" value={limits.requests.maxTotal} onChange={(v) => handleLimitChange("requests", "maxTotal", v)} />
                                        <InputGroup label="Límite Mensual" value={limits.requests.maxMonthly} onChange={(v) => handleLimitChange("requests", "maxMonthly", v)} />
                                        <InputGroup label="Límite Anual" value={limits.requests.maxYearly} onChange={(v) => handleLimitChange("requests", "maxYearly", v)} />
                                        <InputGroup label="Max. Archivados" value={limits.requests.maxArchived} onChange={(v) => handleLimitChange("requests", "maxArchived", v)} />
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-dashed border-border flex justify-end">
                                        <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 cursor-pointer w-fit transition-all hover:border-indigo-300">
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${limits.requests.deleteArchivedFiles ? "bg-indigo-600 border-indigo-600 text-white" : "bg-background border-border"}`}>
                                                {limits.requests.deleteArchivedFiles && <Check size={14} />}
                                            </div>
                                            <input type="checkbox" className="hidden" checked={limits.requests.deleteArchivedFiles} onChange={(e) => handleLimitChange("requests", "deleteArchivedFiles", e.target.checked)} />
                                            <span className="text-xs font-bold text-foreground">Eliminar archivos permanentemente al archivar</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Section: Tickets */}
                                <div className="rounded-xl border border-border bg-card shadow-sm p-6">
                                    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 shadow-sm">
                                            <Ticket size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-wide">Configuración de Tickets</h3>
                                            <p className="text-[10px] text-muted-foreground font-medium">Gestión del soporte y categorías</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <InputGroup label="Tickets Simultáneos" value={limits.tickets.maxQuantity} onChange={(v) => handleLimitChange("tickets", "maxQuantity", v)} icon={<Ticket size={14} />} />
                                        <InputGroup label="Categorías Permitidas" value={limits.tickets.maxCategories} onChange={(v) => handleLimitChange("tickets", "maxCategories", v)} icon={<Layers size={14} />} />
                                    </div>
                                </div>

                                {/* Section: Recursos */}
                                <div className="rounded-xl border border-border bg-card shadow-sm p-6">
                                    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 shadow-sm">
                                            <Database size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-wide">Recursos Generales</h3>
                                            <p className="text-[10px] text-muted-foreground font-medium">Capacidad de usuarios y herramientas</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <InputGroup label="Usuarios Máximos" value={limits.resources.users} onChange={(v) => handleLimitChange("resources", "users", v)} icon={<Users size={14} />} />
                                        <InputGroup label="Roles Personalizados" value={limits.resources.roles} onChange={(v) => handleLimitChange("resources", "roles", v)} icon={<ShieldCheck size={14} />} />
                                        <InputGroup label="Formularios Activos" value={limits.resources.forms} onChange={(v) => handleLimitChange("resources", "forms", v)} icon={<FileText size={14} />} />
                                        <InputGroup label="Plantillas" value={limits.resources.templates} onChange={(v) => handleLimitChange("resources", "templates", v)} icon={<LayoutGrid size={14} />} />
                                        <div className="md:col-span-2">
                                            <InputGroup label="Sub-Empresas Permitidas" value={limits.companies.maxQuantity} onChange={(v) => handleLimitChange("companies", "maxQuantity", v)} icon={<Building size={14} />} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Chatbot / IA */}
                                <div className="rounded-xl border border-border bg-card shadow-sm p-6">
                                    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                                        <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 shadow-sm">
                                            <Monitor size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-wide">Chatbot</h3>
                                            <p className="text-[10px] text-muted-foreground font-medium">Límites para Chatbot</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <InputGroup label="Mensajes Chatbot (Total)" value={limits.chatbot.maxQuantity} onChange={(v) => handleLimitChange("chatbot", "maxQuantity", v)} icon={<Monitor size={14} />} />
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="px-8 py-5 border-t border-border flex justify-between items-center bg-muted/10 shrink-0">
                    <div>
                        {plan && (
                            <button onClick={handleDelete} disabled={isDeleting} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all" title="Eliminar Plan">
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

// Helper Component
function InputGroup({ label, value, onChange, icon }) {
    return (
        <div className="space-y-2 group">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-2 group-hover:text-indigo-500 transition-colors">
                {icon && <span className="opacity-70 text-indigo-500">{icon}</span>}
                {label}
            </label>
            <div className="flex items-center bg-background border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all h-11 shadow-sm">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-full px-4 bg-transparent text-sm font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/20"
                    placeholder="∞"
                />
            </div>
        </div>
    );
}
