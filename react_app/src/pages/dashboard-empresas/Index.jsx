import React, { useState, useEffect, useMemo } from "react";
import { Search, Database, Users, Trash2, CheckCircle2, Server, Loader2, Play, HardDrive } from "lucide-react";

// Helpers y componentes de UI
import { apiFetch, API_BASE_URL } from "../../utils/api";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Button from "../../components/ui/Button";
import { EmpresaModal } from "./components/EmpresaModal";

const EmpresasView = ({ userPermissions = {} }) => {
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
   const [editingCompany, setEditingCompany] = useState(null);

   const permisos = useMemo(
      () => ({
         create_empresas: userPermissions.includes("create_gestor_roles") || userPermissions.includes("create_empresas") || true, // fallback temporal
         delete_empresas: userPermissions.includes("delete_gestor_roles") || userPermissions.includes("delete_empresas") || true,
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
      fetchCompanies();
   }, []);

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

   const handleDelete = async (companyName) => {
      if (window.confirm(`¿Estás seguro de ELIMINAR la empresa (Base de Datos) "${companyName}"? \n\n⚠️ ESTA ACCIÓN BORRA TODOS LOS DATOS Y NO SE PUEDE DESHACER.`)) {
         try {
            const res = await apiFetch(`${API_BASE_URL}/sas/companies/${companyName}`, {
               method: "DELETE",
            });

            if (res.ok) {
               setCompanies((prev) => prev.filter((c) => c.name !== companyName));
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
                        Empresas y Funcionalidades
                     </h1>
                     <p className="text-muted-foreground mt-1 text-sm lg:text-base">
                        Configuración de empresas y funcionalidades
                     </p>
                  </div>

                  {permisos.create_empresas && (
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

               <div className="relative max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                     type="text"
                     placeholder="Buscar empresas (db)..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
               </div>

               {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                     <Loader2 className="w-10 h-10 animate-spin mb-4 text-accent" />
                     <p>Cargando empresas del cluster...</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                     {filteredCompanies.map((company) => {
                        return (
                           <div
                              key={company.name}
                              className="bg-card rounded-xl border border-border shadow-sm p-6 hover:shadow-md transition-all group relative flex flex-col"
                           >
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                 {permisos.delete_empresas && (
                                    <button
                                       onClick={() => handleDelete(company.name)}
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
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                 <HardDrive size={14} />
                                 <span>{formatBytes(company.sizeOnDisk)}</span>
                              </div>

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
                  fetchCompanies(); // Recargar data y mantener modal abierto
                  setIsModalOpen(false);
               }}
               company={editingCompany}
            />
         )}
      </div>
   );
};

export default EmpresasView;
