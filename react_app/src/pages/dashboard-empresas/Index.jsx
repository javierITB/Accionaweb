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
import { PlanManagerModal } from "./components/PlanManagerModal";

const EmpresasView = ({ userPermissions = [] }) => {
   // --- ESTADOS DE DATOS ---
   const [companies, setCompanies] = useState([]);
   const [plans, setPlans] = useState([]);
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
   const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
   const [editingCompany, setEditingCompany] = useState(null);
   // Inicializar activeTab basado en permisos y ruta
   const [activeTab, setActiveTab] = useState(() => {
      if (location.pathname === "/config-planes" && canViewPlanes) return "funcionalidades";
      if (canViewEmpresas) return "empresas";
      if (canViewPlanes) return "funcionalidades";
      return "";
   });

   const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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
            console.error("Error loading companies");
         }
      } catch (error) {
         console.error("Error loading companies:", error);
      } finally {
         setIsLoading(false);
      }
   };

   const fetchPlans = async () => {
      try {
         setIsLoading(true);
         const res = await apiFetch(`${API_BASE_URL}/sas/plans`);
         if (res.ok) {
            const data = await res.json();
            setPlans(data);
         } else {
            console.error("Error loading plans");
         }
      } catch (error) {
         console.error("Error loading plans:", error);
      } finally {
         setIsLoading(false);
      }
   };

   // Efecto inicial y por tab
   useEffect(() => {
      if (activeTab === "empresas" && canViewEmpresas) {
         fetchCompanies();
         // También fetch plans para el modal de empresas (dropdown)
         fetchPlans();
      } else if (activeTab === "funcionalidades" && canViewPlanes) {
         fetchPlans();
      } else {
         setIsLoading(false);
      }
   }, [activeTab, canViewEmpresas, canViewPlanes]);

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

   const filteredPlans = plans.filter(
      (plan) =>
         plan.name?.toLowerCase().includes(searchQuery.toLowerCase())
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

         <main className={`transition-all duration-300 ${mainMarginClass} pt-8 lg:pt-4`}>
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



               {/* Contenedor principal para alinear búsqueda y botones */}
               <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                     <div className="min-w-0 flex-1">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                           {activeTab === "empresas" ? "Empresas y Funcionalidades" : "Gestión de Planes Globales"}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm lg:text-base">
                           {activeTab === "empresas"
                              ? "Gestión de bases de datos y empresas del sistema"
                              : "Configuración centralizada de planes y límites"}
                        </p>
                     </div>
                  </div>
                  {/* Lógica de Barra de Búsqueda (Izquierda) */}
                  {/* Contenedor principal para alinear búsqueda y botones */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
                     
                     {/* Grupo de búsqueda y botones (Derecha) */}
                     <div className="flex items-center gap-2 w-full sm:w-auto justify-end">

                        {/* Buscador Expandible */}
                        {(canViewEmpresas || canViewPlanes) && (
                           <div className={`relative flex items-center transition-all duration-300 ease-in-out ${isSearchExpanded ? 'w-full sm:w-64 md:w-80' : 'w-10'}`}>
                              <button
                                 onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                                 className={`z-10 flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${isSearchExpanded ? 'absolute left-0 text-muted-foreground' : 'bg-card border border-border text-foreground hover:bg-muted'}`}
                                 title="Buscar"
                              >
                                 <Search size={18} />
                              </button>

                              <input
                                 type="text"
                                 placeholder={activeTab === "empresas" ? "Buscar empresas..." : "Buscar planes..."}
                                 value={searchQuery}
                                 onChange={(e) => setSearchQuery(e.target.value)}
                                 className={`
                  bg-card border border-border rounded-lg text-sm transition-all duration-300 outline-none
                  ${isSearchExpanded
                                       ? 'w-full pl-10 pr-4 py-2 opacity-100 focus:ring-2 focus:ring-accent'
                                       : 'w-0 p-0 opacity-0 pointer-events-none'
                                    }
               `}
                                 onBlur={() => !searchQuery && setIsSearchExpanded(false)}
                                 autoFocus={isSearchExpanded}
                              />
                           </div>
                        )}

                        {/* Lógica de Botones Dinámicos */}
                        <div className="flex-shrink-0">
                           {activeTab === "empresas" && canViewEmpresas && permisosEmpresas.create_empresas && (
                              <Button
                                 variant="default"
                                 iconName="Plus"
                                 className="shadow-sm whitespace-nowrap h-10"
                                 onClick={() => {
                                    setEditingCompany(null);
                                    setIsModalOpen(true);
                                 }}
                              >
                                 Nueva Empresa
                              </Button>
                           )}

                           {activeTab === "funcionalidades" && canViewPlanes && permisosPlanes.edit_empresas && (
                              <Button
                                 variant="default"
                                 iconName="Plus"
                                 className="shadow-sm whitespace-nowrap h-10"
                                 onClick={() => { setIsPlanModalOpen(true); }}
                              >
                                 Nuevo Plan
                              </Button>
                           )}
                        </div>
                     </div>
                  </div>
               </div>


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
                              plans={filteredPlans}
                              isLoading={isLoading}
                              permisos={permisosPlanes}
                              onRefresh={fetchPlans}
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
               plans={plans} // Pasar planes para el dropdown
            />
         )}

         {/* Modal de Planes */}
         {isPlanModalOpen && (
            <PlanManagerModal
               isOpen={isPlanModalOpen}
               onClose={() => setIsPlanModalOpen(false)}
               onSuccess={() => {
                  fetchPlans(); // Recargar planes
                  setIsPlanModalOpen(false);
               }}
            />
         )}
      </div>
   );
};

export default EmpresasView;
