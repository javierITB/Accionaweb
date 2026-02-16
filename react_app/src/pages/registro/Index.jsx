import React, { useState, useEffect, useMemo } from "react";
import { apiFetch, API_BASE_URL } from "../../utils/api";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import LoadingCard from "clientPages/components/LoadingCard";
import { Navigate } from "react-router-dom";

const CompanyReg = ({ userPermissions = [] }) => {
   const permisos = useMemo(
      () => ({
         ver: userPermissions.includes("view_registro_cambios_details"),
      }),
      [userPermissions],
   );

   const [registros, setRegistros] = useState([]);
   const [modalOpen, setModalOpen] = useState(false);
   const [selectedRegistro, setSelectedRegistro] = useState(null);

   const [page, setPage] = useState(1);
   const [limit] = useState(10);
   const [pagination, setPagination] = useState(null);
   const [loading, setLoading] = useState(false);

   const openModal = (registro) => {
      if (!permisos.ver) return;
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

   const fetchRegistros = async (currentPage = page) => {
      try {
         setLoading(true);

         const response = await apiFetch(`${API_BASE_URL}/registro/todos?page=${currentPage}&limit=${limit}`);

         if (response.ok) {
            const result = await response.json();
            setRegistros(result.data);
            setPagination(result.pagination);
         }
      } catch (error) {
         console.error("Error cargando registros:", error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchRegistros();
   }, [page]);

   const canAccess = userPermissions.includes("view_registro_cambios");
   if (!canAccess) return <Navigate to="/panel" replace />;

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

   function formatText(text) {
      const formatted = text.replace(/_/g, " ");
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
   }

   const renderMetadata = (data, level = 0) => {
      return Object.entries(data).map(([key, value]) => {
         const isObject = typeof value === "object" && value !== null && !Array.isArray(value);

         return (
            <div key={key} className={level > 0 ? "ml-4" : ""}>
               <p className="mb-1 text-foreground">
                  <span className="font-semibold">{formatText(key)}:</span>{" "}
                  {!isObject && `"${formatText(String(value))}"`}
               </p>

               {isObject && renderMetadata(value, level + 1)}
            </div>
         );
      });
   };
   const hasMetadata = selectedRegistro?.metadata && Object.keys(selectedRegistro?.metadata)?.length > 0;

   const getTabContent = () => {
      return (
         <div className="space-y-4">
            {pagination && (
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex gap-1 items-center">
                     <h3 className="text-lg font-semibold text-foreground">Eventos registrados</h3>
                     {pagination && <span className="text-sm text-muted-foreground">({pagination.total})</span>}
                  </div>

                  {pagination.totalPages > 1 && (
                     <div className="flex flex-col sm:flex-row justify-center items-center">
                        <div className="flex items-center space-x-4">
                           <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPage((p) => p - 1)}
                              disabled={!pagination.hasPrevPage || loading}
                              className="w-28 sm:w-auto"
                           >
                              <Icon name="ChevronLeft" size={16} className="mr-2" />
                              Anterior
                           </Button>

                           {/* NUEVO: Diseño x/y Compacto Inferior */}
                           <div className="flex items-center gap-0 bg-muted px-4 py-1.5 rounded-full text-muted-foreground">
                              <input
                                 type="text"
                                 value={pagination.page}
                                 readOnly
                                 className="w-6 bg-transparent border-none text-right font-medium text-muted-foreground focus:outline-none p-0"
                              />
                              <span className="font-medium mx-0.5">/</span>
                              <span className="font-medium text-left min-w-[1.5rem]">{pagination.totalPages}</span>
                           </div>

                           <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPage((p) => p + 1)}
                              disabled={!pagination.hasNextPage || loading}
                              className="w-28 sm:w-auto"
                           >
                              Siguiente
                              <Icon name="ChevronRight" size={16} className="ml-2" />
                           </Button>
                        </div>
                     </div>
                  )}
               </div>
            )}

            {loading ? (
               // <p className="text-muted-foreground text-sm">Cargando registros...</p>
               <LoadingCard text="Cargando registros..." />
            ) : registros.length === 0 ? (
               <p className="text-muted-foreground">No hay Eventos registrados.</p>
            ) : (
               <div className="overflow-x-auto w-full">
                  <table className="min-w-full border border-border rounded-lg">
                     <thead className="bg-muted text-sm text-muted-foreground">
                        <tr>
                           <th className="px-4 py-2 text-center whitespace-nowrap">Código</th>
                           <th className="px-4 py-2 text-center whitespace-nowrap">Rol</th>
                           <th className="px-4 py-2 text-left min-w-[200px]">Descripción</th>
                           <th className="px-4 py-2 text-center whitespace-nowrap">Afectado</th>
                           <th className="px-4 py-2 text-center whitespace-nowrap">Fecha</th>
                           {permisos.ver && <th className="px-4 py-2 text-center whitespace-nowrap">Detalles</th>}
                        </tr>
                     </thead>
                     <tbody>
                        {registros.map((registro, index) => (
                           <tr key={index} className="border-t hover:bg-muted/30 transition">
                              <td className="px-4 py-2 text-[11px] text-center whitespace-nowrap">{registro.code}</td>
                              <td className="px-4 py-2 text-sm text-center whitespace-nowrap">{registro.actor.role}</td>
                              <td className="px-4 py-2 text-sm">{registro.description}</td>
                              <td className="px-4 py-2 text-sm text-center whitespace-nowrap">
                                 {registro.target.type || "—"}
                              </td>
                              <td className="px-4 py-2 text-sm whitespace-nowrap">
                                 {formatDateSplit(registro.createdAt) || "—"}
                              </td>
                              {permisos.ver && (
                                 <td className="px-4 py-2 text-sm text-center whitespace-nowrap">
                                    <Button variant="outlineTeal" size="sm" onClick={() => openModal(registro)}>
                                       Ver más
                                    </Button>
                                 </td>
                              )}
                           </tr>
                        ))}
                     </tbody>
                  </table>

                  {pagination.totalPages > 1 && (
                     <div className="flex flex-col sm:flex-row justify-center items-center gap-4 py-8 mt-6">
                        <div className="flex items-center space-x-4">
                           <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPage((p) => p - 1)}
                              disabled={!pagination.hasPrevPage || loading}
                              className="w-28 sm:w-auto"
                           >
                              <Icon name="ChevronLeft" size={16} className="mr-2" />
                              Anterior
                           </Button>

                           {/* NUEVO: Diseño x/y Compacto Inferior */}
                           <div className="flex items-center gap-0 bg-muted px-4 py-1.5 rounded-full text-muted-foreground">
                              <input
                                 type="text"
                                 value={pagination.page}
                                 readOnly
                                 className="w-6 bg-transparent border-none text-right font-medium text-muted-foreground focus:outline-none p-0"
                              />
                              <span className="font-medium mx-0.5">/</span>
                              <span className="font-medium text-left min-w-[1.5rem]">{pagination.totalPages}</span>
                           </div>

                           <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPage((p) => p + 1)}
                              disabled={!pagination.hasNextPage || loading}
                              className="w-28 sm:w-auto"
                           >
                              Siguiente
                              <Icon name="ChevronRight" size={16} className="ml-2" />
                           </Button>
                        </div>
                     </div>
                  )}
               </div>
            )}

            {modalOpen && selectedRegistro && (
               <div
                  className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                  onClick={closeModal}
               >
                  <div
                     className="bg-background rounded-lg shadow-2xl w-full max-w-lg p-6 relative overflow-y-auto max-h-[90vh]"
                     onClick={(e) => e.stopPropagation()}
                  >
                     <button
                        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-2xl font-bold"
                        onClick={closeModal}
                     >
                        ×
                     </button>
                     <div className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-3">
                           <Icon name="CheckCircle" size={28} className="text-success" />

                           <h2 className="text-xl md:text-2xl font-bold">Detalles del Evento</h2>
                        </div>

                        <p className="pr-4 text-xs md:text-sm">{formatDate(selectedRegistro.createdAt)}</p>
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
                              <span className="font-semibold pl-2">Nombre:</span>{" "}
                              {selectedRegistro.actor.name + " " + selectedRegistro.actor.last_name}
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

                        {hasMetadata && <div className="pt-4">{renderMetadata(selectedRegistro.metadata)}</div>}
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
      <div className="min-h-screen bg-background flex flex-col">
         <Header />

         {/* SIDEBAR LOGIC INTEGRADA CON OVERLAY */}
         {(isMobileOpen || !isMobileScreen) && (
            <>
               <Sidebar
                  isCollapsed={!isDesktopOpen}
                  onToggleCollapse={toggleSidebar}
                  isMobileOpen={isMobileOpen}
                  onNavigate={handleNavigation}
               />

               {isMobileScreen && isMobileOpen && (
                  <div
                     className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
                     onClick={toggleSidebar}
                  ></div>
               )}
            </>
         )}

         {/* BOTÓN MÓVIL ESTÁTICO (FLOATING) */}
         {!isMobileOpen && isMobileScreen && (
            <div className="fixed bottom-4 left-4 z-50">
               <Button
                  variant="default"
                  size="icon"
                  onClick={toggleSidebar}
                  iconName="Menu"
                  className="w-12 h-12 rounded-full shadow-brand-active active:scale-95 transition-transform"
               />
            </div>
         )}

         {/* CONTENIDO PRINCIPAL - AJUSTADO PARA EVITAR DESBORDAMIENTO */}
         <main
            className={`transition-all duration-300 ${mainMarginClass} pt-20 md:pt-16 flex-1 flex flex-col overflow-x-hidden`}
         >
            <div className="pb-6 space-y-6 container-main w-full max-w-full overflow-x-hidden">
               {/* HEADER CON BOTÓN DE TOGGLE - AGREGADO */}
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-3 gap-4">
                  <div className="mb-4 md:mb-0">
                     <h1 className="text-2xl md:text-3xl font-bold text-foreground">Registro de Eventos</h1>
                     <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Verifica el registro e información de Eventos en la plataforma
                     </p>
                  </div>
               </div>

               <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 md:p-6">{getTabContent()}</div>
               </div>
            </div>
         </main>
      </div>
   );
};

export default CompanyReg;
