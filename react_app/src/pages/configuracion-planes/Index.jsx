import React, { useState, useEffect, useMemo } from "react";
import { Search, Database, Users, Trash2, CheckCircle2, Loader2, Play, HardDrive, LayoutDashboard, FileText, Bell, ShieldCheck, Activity, Lock, Calendar } from "lucide-react";

// Helpers y componentes de UI
import { apiFetch, API_BASE_URL } from "../../utils/api";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Button from "../../components/ui/Button";
import { PlanesModal } from "./components/PlanesModal";

const PlanesConfigView = ({ userPermissions = {} }) => {
    // --- ESTADOS DE DATOS ---
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- ESTADOS DE ESTRUCTURA ---
    const [isDesktopOpen, setIsDesktopOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobileScreen, setIsMobileScreen] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);

    // --- ESTADOS DE LÓGICA ---
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    const permisos = useMemo(
        () => ({
            create_empresas: userPermissions.includes("create_gestor_empresas"), // Reusing same permissions for now
            canAccess: userPermissions.includes("view_configuracion_planes"),
            edit_empresas: userPermissions.includes("edit_configuracion_planes"),
            delete_empresas: userPermissions.includes("delete_gestor_empresas"),
        }),
        [userPermissions],
    );

    // --- CARGA DE DATOS DESDE API ---
    const fetchCompanies = async () => {
        try {
            setIsLoading(true);
            const res = await apiFetch(`${API_BASE_URL}/sas/companies`);
            if (res.ok) {
                const data = await res.json();
                setCompanies(data);
            } else {
                console.error("Error loading companies for plans");
            }
        } catch (error) {
            console.error("Error loading companies for plans:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 768;
            setIsMobileScreen(isMobile);
            if (isMobile) setIsMobileOpen(false);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleSidebar = () => {
        if (isMobileScreen) setIsMobileOpen(!isMobileOpen);
        else setIsDesktopOpen(!isDesktopOpen);
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const filteredCompanies = companies.filter(
        (company) =>
            company.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const mainMarginClass = isMobileScreen ? "ml-0" : isDesktopOpen ? "lg:ml-64" : "lg:ml-16";

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <Sidebar
                isCollapsed={!isDesktopOpen}
                onToggleCollapse={toggleSidebar}
                isMobileOpen={isMobileOpen}
                onNavigate={() => isMobileScreen && setIsMobileOpen(false)}
            />

            {isMobileScreen && isMobileOpen && (
                <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={toggleSidebar}></div>
            )}

            {!isMobileOpen && isMobileScreen && (
                <div className="fixed bottom-4 left-4 z-50">
                    <Button
                        variant="default"
                        size="icon"
                        onClick={toggleSidebar}
                        iconName="Menu"
                        className="w-12 h-12 rounded-full shadow-brand-active"
                    />
                </div>
            )}

            <main className={`transition-all duration-300 ${mainMarginClass} pt-24 lg:pt-20`}>
                <div className="px-4 sm:px-6 lg:p-6 space-y-6 max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                                Configuración de Planes
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm lg:text-base">
                                Gestión de límites y capacidades por empresa
                            </p>
                        </div>
                    </div>

                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar empresa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Loader2 className="w-10 h-10 animate-spin mb-4 text-accent" />
                            <p>Cargando información de planes...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                            {filteredCompanies.map((company) => {
                                return (
                                    <div
                                        key={company._id || company.name}
                                        className="bg-card rounded-2xl border border-white/5 shadow-xl hover:shadow-2xl transition-all group relative flex flex-col overflow-hidden max-w-full"
                                    >


                                        <div className="p-6">
                                            <div className="flex items-center gap-4 mb-6">
                                                {/* ICON CONTAINER STYLE MATCH */}
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
                </div>
            </main>

            {/* Modal de Configuración de Plan */}
            {isModalOpen && (
                <PlanesModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingPlan(null);
                    }}
                    onSuccess={() => {
                        fetchCompanies();
                        setIsModalOpen(false);
                        setEditingPlan(null);
                    }}
                    company={editingPlan}
                />
            )}
        </div>
    );
};

export default PlanesConfigView;
