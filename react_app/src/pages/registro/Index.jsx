import React, { useState, useEffect } from "react";
import { apiFetch, API_BASE_URL } from "../../utils/api";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";

// const createDataURL = (logoObj) => {
//   if (logoObj && logoObj.fileData && logoObj.mimeType) {
//     return `data:${logoObj.mimeType};base64,${logoObj.fileData}`;
//   }
//   return null;
// };

const CompanyReg = () => {
   const [registros, setRegistros] = useState([]);
   //   const [formData, setFormData] = useState({
   //     nombre: '',
   //     rut: '',
   //     direccion: '',
   //     encargado: '',
   //     rut_encargado: '',
   //     logo: null,
   //     logoUrl: null
   //   });
   //   const [isLoading, setIsLoading] = useState(false);
   //   const [activeTab, setActiveTab] = useState('register');

   // ESTADOS DEL SIDEBAR - ACTUALIZADOS
   const [isDesktopOpen, setIsDesktopOpen] = useState(true);
   const [isMobileOpen, setIsMobileOpen] = useState(false);
   const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

   // EFECTO PARA MANEJAR REDIMENSIONAMIENTO - ACTUALIZADO
   useEffect(() => {
      const handleResize = () => {
         const isMobile = window.innerWidth < 768;
         setIsMobileScreen(isMobile);

         if (isMobile) {
            setIsMobileOpen(false);
         }
      };

      window.addEventListener("resize", handleResize);
      handleResize();
      return () => window.removeEventListener("resize", handleResize);
   }, []);

   const toggleSidebar = () => {
      if (isMobileScreen) {
         setIsMobileOpen(!isMobileOpen);
      } else {
         setIsDesktopOpen(!isDesktopOpen);
      }
   };

   const handleNavigation = () => {
      if (isMobileScreen) {
         setIsMobileOpen(false);
      }
   };

   const fetchRegistros = async () => {
      try {
         const response = await apiFetch(`${API_BASE_URL}/auth/registros/todos`);
         if (response.ok) {
            const registrosData = await response.json();
            setRegistros(registrosData);
         }
      } catch (error) {
         console.error("Error cargando registros:", error);
         console.error("No se pudo cargar la lista de registrosData");
      }
   };

   useEffect(() => {
      fetchRegistros();
   }, []);

   const getTabContent = () => {
      return (
         <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Eventos registrados</h3>
            {registros.reverse().length === 0 ? (
               <p className="text-muted-foreground">No hay Eventos registrados.</p>
            ) : (
               <div className="overflow-x-auto">
                  <table className="min-w-full border border-border rounded-lg">
                     <thead className="bg-muted text-sm text-muted-foreground">
                        <tr>
                           <th className="px-4 py-2 text-left">Codigo</th>
                           <th className="px-4 py-2 text-left">Descripción</th>
                           <th className="px-4 py-2 text-left">Actor</th>
                           <th className="px-4 py-2 text-left">Afectado</th>
                           <th className="px-4 py-2 text-left">resultado</th>
                           <th className="px-4 py-2 text-left">Fecha</th>
                           <th className="px-4 py-2 text-left">Extra</th>
                        </tr>
                     </thead>
                     <tbody>
                        {registros.map(
                           (registro, index) =>
                              registro.action != "Todas" && (
                                 <tr key={index} className="border-t hover:bg-muted/30 transition">
                                    <td className="px-4 py-2 font-medium text-sm">{registro.description}</td>
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">{registro.actor.role}</td>
                                    <td className="px-4 py-2 text-sm">{registro.target.type || "—"}</td>
                                    <td className="px-4 py-2 text-sm">{registro.result || "—"}</td>
                                    <td className="px-4 py-2 text-sm">{registro.createdAt || "—"}</td>
                                    <td className="px-4 py-2 text-sm">{JSON.stringify(registro.extra) || "—"}</td>
                                
                                 </tr>
                              ),
                        )}
                     </tbody>
                  </table>
               </div>
            )}
         </div>
      );
   };

   // CLASE DE MARGEN - ACTUALIZADA
   const mainMarginClass = isMobileScreen ? "ml-0" : isDesktopOpen ? "ml-64" : "ml-16";

   return (
      <div className="min-h-screen bg-background">
         <Header />

         {(isMobileOpen || !isMobileScreen) && (
            <>
               <Sidebar
                  isCollapsed={!isDesktopOpen}
                  onToggleCollapse={toggleSidebar}
                  isMobileOpen={isMobileOpen}
                  onNavigate={handleNavigation}
               />

               {isMobileScreen && isMobileOpen && (
                  <div className="fixed inset-0 bg-foreground/50 z-40" onClick={toggleSidebar}></div>
               )}
            </>
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

         {/* CONTENIDO PRINCIPAL - ACTUALIZADO */}
         <main className={`transition-all duration-300 ${mainMarginClass} pt-20 md:pt-16`}>
            <div className="p-6 space-y-6 container-main">
               {/* HEADER CON BOTÓN DE TOGGLE - AGREGADO */}
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-3">
                  <div className="mb-4 md:mb-0">
                     <h1 className="text-2xl md:text-3xl font-bold text-foreground">Registro de Eventos</h1>
                     <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Verifica el registro e información de Eventos en la plataforma
                     </p>
                  </div>

                  <div className="flex items-center space-x-3">
                     {/* BOTÓN DE TOGGLE DEL SIDEBAR - AGREGADO */}
                     <div className="hidden md:flex items-center">
                        <Button
                           variant="ghost"
                           size="icon"
                           onClick={toggleSidebar}
                           iconName={isDesktopOpen ? "PanelLeftClose" : "PanelLeftOpen"}
                           iconSize={20}
                        />
                     </div>
                  </div>
               </div>

               <div className="bg-card border border-border rounded-lg">
                  <div className="p-6">{getTabContent()}</div>
               </div>
            </div>
         </main>
      </div>
   );
};

export default CompanyReg;
