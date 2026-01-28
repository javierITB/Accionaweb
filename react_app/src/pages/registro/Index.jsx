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
   const [modalOpen, setModalOpen] = useState(false);
   const [selectedRegistro, setSelectedRegistro] = useState(null);

   const openModal = (registro) => {
      setSelectedRegistro(registro);
      setModalOpen(true);
   };

   const closeModal = () => {
      setSelectedRegistro(null);
      setModalOpen(false);
   };
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
         const response = await apiFetch(`${API_BASE_URL}/registro/todos`);
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

   const formatDate = (dateString) => {
      if (!dateString) return "—";

      const date = new Date(dateString);
      const pad = (n) => n.toString().padStart(2, "0");

      const day = pad(date.getDate());
      const month = pad(date.getMonth() + 1);
      const year = date.getFullYear();

      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      const seconds = pad(date.getSeconds());

      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
   };

   const formatDateSplit = (dateString) => {
      if (!dateString) return "—";

      const full = formatDate(dateString); // "27/01/2026 14:56:26"
      const [datePart, timePart] = full.split(" "); // separar en fecha y hora

      return (
         <div className="flex flex-col items-center text-sm">
            <span>{datePart}</span>
            <span>{timePart}</span>
         </div>
      );
   };

   const getTabContent = () => {
      return (
         <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Eventos registrados</h3>
            {registros.length === 0 ? (
               <p className="text-muted-foreground">No hay Eventos registrados.</p>
            ) : (
               <div className="overflow-x-auto">
                  <table className="min-w-full border border-border rounded-lg">
                     <thead className="bg-muted text-sm text-muted-foreground">
                        <tr>
                           <th className="px-4 py-2 text-left">Código</th>
                           <th className="px-4 py-2 text-center">Actor</th>
                           <th className="px-4 py-2 text-left">Descripción</th>
                           <th className="px-4 py-2 text-center">Afectado</th>
                           <th className="px-4 py-2 text-center">Fecha</th>
                           <th className="px-4 py-2 text-center">Detalles</th>
                        </tr>
                     </thead>
                     <tbody>
                        {registros.map((registro, index) => (
                           <tr key={index} className="border-t hover:bg-muted/30 transition">
                              <td className="px-4 py-2 text-[11px] ">{registro.code}</td>
                              <td className="px-4 py-2 text-sm text-center">{registro.actor.name}</td>
                              <td className="px-4 py-2 text-sm">{registro.description}</td>
                              <td className="px-4 py-2 text-sm text-center">{registro.target.type || "—"}</td>
                              <td className="px-4 py-2 text-sm">{formatDateSplit(registro.createdAt) || "—"}</td>
                              <td className="px-4 py-2 text-sm">
                                 <Button variant="outlineTeal" size="sm" onClick={() => openModal(registro)}>
                                    Ver más
                                 </Button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}

            {modalOpen && selectedRegistro && (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="bg-background rounded-lg shadow-2xl w-11/12 max-w-lg p-6 relative overflow-y-auto max-h-[90vh]">
                     <button
                        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-2xl font-bold"
                        onClick={closeModal}
                     >
                        ×
                     </button>
                     <div className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-3">
                          <Icon name="CheckCircle" size={28} className="text-success" />

                           <h2 className="text-2xl font-bold  ">Detalles del Evento</h2>
                        </div>

                        <p className="pr-4">{formatDate(selectedRegistro.createdAt)}</p>
                     </div>

                     <div className="flex flex-col gap-4 divide-y divide-border text-sm">
                        <div className="pt-4 ">
                           <p>
                              <span className="font-semibold text-foreground">Código:</span> {selectedRegistro.code}
                           </p>
                        </div>

                        <div className="pt-4">
                           <p>
                              <span className="font-semibold text-foreground">Descripción:</span>{" "}
                              {selectedRegistro.description}
                           </p>
                        </div>

                        <div className="pt-4 ">
                           <p className="font-semibold pb-1 text-foreground text-base">Actor:</p>
                           <p>
                              <span className="font-semibold pl-2">Nombre:</span> {selectedRegistro.actor.name + " " + selectedRegistro.actor.last_name}
                           </p>
                           <p>
                              <span className="font-semibold pl-2">Cargo:</span> {selectedRegistro.actor.cargo}
                           </p>
                           <p>
                              <span className="font-semibold pl-2">Rol:</span> {selectedRegistro.actor.role}
                           </p>
                           <p>
                              <span className="font-semibold pl-2">Email:</span> {selectedRegistro.actor.email}
                           </p>
                           <p>
                              <span className="font-semibold pl-2">Empresa:</span> {selectedRegistro.actor.empresa}
                           </p>
                           <p>
                              <span className="font-semibold pl-2">Estado:</span> {selectedRegistro.actor.estado}
                           </p>
                        </div>

                        <div className="pt-4 ">
                           <p className="font-semibold  text-foreground">
                              Afectado: <span className="font-normal">{selectedRegistro.target.type}</span>
                           </p>
                        </div>

                        <div className="pt-4 ">
                           {Object.entries(selectedRegistro.metadata).map(([key, value]) =>  { 
                              const keyFormatted = key.replace(/_/g, " ").charAt(0).toUpperCase() + key.replace(/_/g, " ").slice(1);
                              const valueFormatted = value.replace(/_/g, " ").charAt(0).toUpperCase() + value.replace(/_/g, " ").slice(1);
                              return(
                              <p key={key} className="mb-1 text-foreground">
                                 <span className="font-semibold first-letter:uppercase">
                                    {keyFormatted}:
                                 </span>{" "}
                                 "{valueFormatted}"
                              </p>
                           )})
                           
                           }
                        </div>
                     </div>
                  </div>
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
