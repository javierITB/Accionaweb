import React, { useState, useEffect, useMemo } from "react";
import { Search, Database, Users, Trash2, CheckCircle2, Loader2, Play, HardDrive, LayoutDashboard, FileText, Bell, ShieldCheck, Activity } from "lucide-react";

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
            canAccess: userPermissions.includes("view_gestor_empresas"),
            edit_empresas: userPermissions.includes("edit_gestor_empresas"),
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
                                        className="bg-card rounded-2xl border border-border shadow-sm p-6 hover:shadow-md transition-all group relative flex flex-col overflow-hidden"
                                    >
                                        {/* Decoración superior */}
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {permisos.edit_empresas && (
                                                <button
                                                    onClick={() => {
                                                        setEditingPlan(company);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all"
                                                    title="Configurar Plan"
                                                >
                                                    <ShieldCheck size={20} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br from-indigo-600 to-purple-700 shrink-0">
                                                <LayoutDashboard size={28} />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-lg font-bold text-foreground truncate">
                                                    {company.name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground font-mono truncate">
                                                    {company.dbName}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 mb-6">
                                            <div className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                                        <FileText size={16} />
                                                    </div>
                                                    <span className="text-sm font-medium">Solicitudes</span>
                                                </div>
                                                <span className="font-bold text-sm">{(company.limits?.solicitudes) || "Naranjo"}</span>
                                            </div>

                                            <div className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                                                        <Bell size={16} />
                                                    </div>
                                                    <span className="text-sm font-medium">Tickets</span>
                                                </div>
                                                <span className="font-bold text-sm">{(company.limits?.tickets) || "50"}</span>
                                            </div>

                                            <div className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                                                        <Users size={16} />
                                                    </div>
                                                    <span className="text-sm font-medium">Usuarios</span>
                                                </div>
                                                <span className="font-bold text-sm">{(company.limits?.usuarios) || "10"}</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Activity size={14} className="text-emerald-500" />
                                                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Plan Activo</span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-1 rounded-lg">
                                                Standard
                                            </span>
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
                        // fetchCompanies(); // For now just close, no real back update
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
