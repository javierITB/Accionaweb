import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";

// Helpers y componentes de UI
import { apiFetch, API_BASE_URL } from "../../utils/api";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Button from "../../components/ui/Button";
import { EmpresaModal } from "./components/EmpresaModal";

import { EmpresasTab } from "./components/EmpresasTab";
import { PlanesTab } from "./components/PlanesTab";

const EmpresasView = ({ userPermissions = [] }) => {
   // --- ESTADOS DE DATOS ---
   const [companies, setCompanies] = useState([]);
   const [isLoading, setIsLoading] = useState(true);

   // --- ESTADOS DE ESTRUCTURA ---
   const [isDesktopOpen, setIsDesktopOpen] = useState(true);
   const [isMobileOpen, setIsMobileOpen] = useState(false);
   const [isMobileScreen, setIsMobileScreen] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);

   const location = useLocation();

   // --- PERMISOS DE VISTA ---
   const canViewEmpresas = userPermissions.includes("view_gestor_empresas");
   const canViewPlanes = userPermissions.includes("view_configuracion_planes");

   // --- ESTADOS DE LÓGICA ---
   const [searchQuery, setSearchQuery] = useState("");
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingCompany, setEditingCompany] = useState(null);
   // Inicializar activeTab basado en permisos y ruta
   const [activeTab, setActiveTab] = useState(() => {
      if (location.pathname === "/config-planes" && canViewPlanes) return "funcionalidades";
      if (canViewEmpresas) return "empresas";
      if (canViewPlanes) return "funcionalidades";
      return "";
   });

   // Actualizar activeTab si cambian los permisos (por si acaso)
   useEffect(() => {
      if (activeTab === "empresas" && !canViewEmpresas) {
         if (canViewPlanes) setActiveTab("funcionalidades");
         else setActiveTab("");
      }
      else if (activeTab === "funcionalidades" && !canViewPlanes) {
         if (canViewEmpresas) setActiveTab("empresas");
         else setActiveTab("");
      }
      else if (!activeTab) {
         if (canViewEmpresas) setActiveTab("empresas");
         else if (canViewPlanes) setActiveTab("funcionalidades");
      }
   }, [canViewEmpresas, canViewPlanes, activeTab]);


   // --- CARGA DE DATOS DESDE API ---
   const fetchCompanies = async () => {
      try {
         setIsLoading(true);
         const res = await apiFetch(`${API_BASE_URL}/sas/companies`);
         if (res.ok) {
            const data = await res.json();
            setCompanies(data);
         } else {
            // Intentar leer el error del backend
            try {
               const errData = await res.json();
               console.error("Error backend:", errData);
               alert(`Error cargando empresas: ${errData.error || res.statusText}`);
            } catch (e) {
               alert(`Error ${res.status}: ${res.statusText}`);
            }
         }
      } catch (error) {
         console.error("Error cargando empresas:", error);
      } finally {
         setIsLoading(false);
      }
   };

   // Efecto inicial
   useEffect(() => {
      if (canViewEmpresas || canViewPlanes) {
         fetchCompanies();
      } else {
         setIsLoading(false);
      }
   }, [canViewEmpresas, canViewPlanes]);

   // --- RESPONSIVIDAD ---
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

   // --- LÓGICA DE NEGOCIO ---
   const filteredCompanies = companies.filter(
      (company) =>
         company.name?.toLowerCase().includes(searchQuery.toLowerCase())
   );

   const mainMarginClass = isMobileScreen ? "ml-0" : isDesktopOpen ? "lg:ml-64" : "lg:ml-16";

   // Permisos para cada tab
   const permisosEmpresas = useMemo(() => ({
      create_empresas: userPermissions.includes("create_gestor_empresas"),
      edit_empresas: userPermissions.includes("edit_gestor_empresas"),
      delete_empresas: userPermissions.includes("delete_gestor_empresas"),
   }), [userPermissions]);

   const permisosPlanes = useMemo(() => ({
      edit_empresas: userPermissions.includes("edit_configuracion_planes"),
   }), [userPermissions]);


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

         <main className={`transition-all duration-300 ${mainMarginClass} pt-10 lg:pt-20`}>
            <div className="px-4 sm:px-6 lg:p-6 space-y-6 max-w-7xl mx-auto">

               {/* Tabs Selector ABOVE Title */}
               {(canViewEmpresas || canViewPlanes) && (
                  <div className="flex space-x-1 rounded-xl bg-card p-1 shadow-sm border border-border w-fit mb-6">
                     {canViewEmpresas && (
                        <button
                           onClick={() => setActiveTab("empresas")}
                           className={`
                                    px-4 py-2 text-sm font-medium rounded-lg transition-all
                                    ${activeTab === "empresas"
                                 ? "bg-indigo-600 text-white shadow-md"
                                 : "text-muted-foreground hover:bg-muted hover:text-foreground"}
                                `}
                        >
                           Empresas y Funcionalidades
                        </button>
                     )}
                     {canViewPlanes && (
                        <button
                           onClick={() => setActiveTab("funcionalidades")}
                           className={`
                                    px-4 py-2 text-sm font-medium rounded-lg transition-all
                                    ${activeTab === "funcionalidades"
                                 ? "bg-indigo-600 text-white shadow-md"
                                 : "text-muted-foreground hover:bg-muted hover:text-foreground"}
                                `}
                        >
                           Configuración del Plan
                        </button>
                     )}
                  </div>
               )}

               <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                     <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                        {activeTab === "empresas" ? "Empresas y Funcionalidades" : "Configuración del Plan"}
                     </h1>
                     <p className="text-muted-foreground mt-1 text-sm lg:text-base">
                        {activeTab === "empresas"
                           ? "Gestión de bases de datos y empresas del sistema"
                           : "Gestión de límites y planes por empresa"}
                     </p>
                  </div>

                  {activeTab === "empresas" && canViewEmpresas && permisosEmpresas.create_empresas && (
                     <Button
                        variant="default"
                        iconName="Plus"
                        onClick={() => {
                           setEditingCompany(null);
                           setIsModalOpen(true);
                        }}
                     >
                        Nueva Empresa
                     </Button>
                  )}
               </div>

               {/* Common Search Bar */}
               {(canViewEmpresas || canViewPlanes) && (
                  <div className="relative max-w-md w-full mt-6">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                     <input
                        type="text"
                        placeholder="Buscar empresas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                     />
                  </div>
               )}


               {/* Tab Content */}
               {!canViewEmpresas && !canViewPlanes ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                     <p>No tienes permisos para ver esta sección.</p>
                  </div>
               ) : (
                  <>
                     {activeTab === "empresas" && canViewEmpresas && (
                        <div className="mt-6">
                           <EmpresasTab
                              companies={filteredCompanies}
                              isLoading={isLoading}
                              permisos={permisosEmpresas}
                              onRefresh={fetchCompanies}
                              onEdit={(company) => {
                                 setEditingCompany(company);
                                 setIsModalOpen(true);
                              }}
                           />
                        </div>
                     )}
                     {activeTab === "funcionalidades" && canViewPlanes && (
                        <div className="mt-6">
                           <PlanesTab
                              companies={filteredCompanies}
                              isLoading={isLoading}
                              permisos={permisosPlanes}
                              onRefresh={fetchCompanies}
                           />
                        </div>
                     )}
                  </>
               )}

            </div>
         </main>

         {/* Modal de Empresa */}
         {isModalOpen && (
            <EmpresaModal
               isOpen={isModalOpen}
               onClose={() => {
                  setIsModalOpen(false);
                  setEditingCompany(null);
               }}
               onSuccess={() => {
                  fetchCompanies(); // Recargar data
                  setIsModalOpen(false);
                  setEditingCompany(null);
               }}
               company={editingCompany}
            />
         )}
      </div>
   );
};

export default EmpresasView;
