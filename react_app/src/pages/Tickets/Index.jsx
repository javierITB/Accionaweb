import React, { useState, useEffect, useMemo } from "react";
import { apiFetch, API_BASE_URL } from "../../utils/api";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import RequestCard from "./components/RequestCard";
import FilterPanel from "./components/FilterPanel";
import RequestDetails from "./components/RequestDetails";
import StatsOverview from "./components/StatsOverview";
import { Navigate } from "react-router-dom";
const RequestTracking = ({ userPermissions = [] }) => {
   const urlParams = new URLSearchParams(window.location.search);
   const formId = urlParams?.get("id");

   const permisos = useMemo(
      () => ({
         eliminar: userPermissions.includes("delete_tickets"),
         verDetalles: userPermissions.includes("view_tickets_details"),
         verRespuestas: userPermissions.includes("view_tickets_answers"),
         aceptarRespuestas: userPermissions.includes("accept_tickets_answers"),
         verAdjuntos: userPermissions.includes("view_tickets_attach"),
         descargarAdjuntos: userPermissions.includes("download_tickets_attach"),
         previsualizarAdjuntos: userPermissions.includes("preview_tickets_attach"),
         cambiarEstado: userPermissions.includes("edit_tickets_state"),
      }),
      [userPermissions],
   );

   // ESTADOS DEL SIDEBAR
   const [isDesktopOpen, setIsDesktopOpen] = useState(true);
   const [isMobileOpen, setIsMobileOpen] = useState(false);
   const [isMobileScreen, setIsMobileScreen] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);

   // Estados de la Aplicación
   const [selectedRequest, setSelectedRequest] = useState(null);
   const [showFilters, setShowFilters] = useState(false);
   const [resp, setResp] = useState([]); // Todos los tickets (sin filtrar)
   const [showRequestDetails, setShowRequestDetails] = useState(false);
   const [viewMode, setViewMode] = useState("grid");
   const [isLoading, setIsLoading] = useState(false);
   const [ticketConfigs, setTicketConfigs] = useState([]);
   // --- PAGINACIÓN Y FILTROS SERVER-SIDE ---
   const [currentPage, setCurrentPage] = useState(1);
   const [totalPages, setTotalPages] = useState(1);
   const [totalItems, setTotalItems] = useState(0);
   const [serverStats, setServerStats] = useState(null);
   const requestsPerPage = 30;

   // ESTADO 1: Filtros Aplicados (Para Fetch)
   const [appliedFilters, setAppliedFilters] = useState({
      search: "",
      status: "",
      category: "",
      dateRange: "",
      startDate: "",
      endDate: "",
      company: "",
      submittedBy: "",
   });

   // ESTADO 2: Filtros Temporales (UI)
   const [tempFilters, setTempFilters] = useState(appliedFilters);

   // EFECTO DE RESIZE
   useEffect(() => {
      const handleResize = () => {
         const isMobile = window.innerWidth < 768;
         setIsMobileScreen(isMobile);
         if (isMobile) setIsMobileOpen(false);
      };
      window.addEventListener("resize", handleResize);
      handleResize();
      return () => window.removeEventListener("resize", handleResize);
   }, []);

   const canAccess = userPermissions.includes("view_tickets");
   if (!canAccess) return <Navigate to="/panel" replace />;

   const toggleSidebar = () => {
      if (isMobileScreen) setIsMobileOpen(!isMobileOpen);
      else setIsDesktopOpen(!isDesktopOpen);
   };

   const removeUrlParameter = () => {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete("id");
      window.history.replaceState({}, document.title, currentUrl.pathname + currentUrl.search);
   };

   const handleCloseRequestDetails = () => {
      setShowRequestDetails(false);
      setSelectedRequest(null);
      removeUrlParameter();
   };

   const handleNavigation = (path) => {
      if (isMobileScreen) setIsMobileOpen(false);
      console.log(`Navegando a: ${path}`);
   };

   const updateRequest = (updatedData) => {
      setResp((prevResp) => prevResp.map((req) => (req._id === updatedData._id ? { ...req, ...updatedData } : req)));
      setSelectedRequest((prev) => (prev?._id === updatedData._id ? { ...prev, ...updatedData } : prev));
   };

   // FETCH DATA SERVER-SIDE
   const fetchData = async (page = 1, isBackground = false, overrideFilters = null) => {
      try {
         if (!isBackground) setIsLoading(true);

         if (!isBackground && ticketConfigs.length === 0) {
            try {
               const resConfig = await apiFetch(`${API_BASE_URL}/config-tickets`);
               if (resConfig.ok) {
                  const configs = await resConfig.json();
                  setTicketConfigs(configs);
               }
            } catch (e) {
               console.warn("Error loading configs", e);
            }
         }

         // Preparar Query Params
         const activeFilters = overrideFilters || appliedFilters;

         // Determine if any filter is active
         const hasActiveFilters = [
            "search",
            "status",
            "category",
            "company",
            "submittedBy",
            "startDate",
            "endDate",
         ].some((key) => activeFilters[key] && activeFilters[key].trim() !== "");

         let endpoint = "";
         let params = new URLSearchParams({
            page: page,
            limit: requestsPerPage,
         });

         if (hasActiveFilters) {
            endpoint = `${API_BASE_URL}/soporte/filtros`;
            // Append filter params
            Object.keys(activeFilters).forEach((key) => {
               if (activeFilters[key]) params.append(key, activeFilters[key]);
            });
         } else {
            endpoint = `${API_BASE_URL}/soporte/mini`;
         }

         const res = await apiFetch(`${endpoint}?${params.toString()}`);
         if (!res.ok) throw new Error("Error al obtener tickets");

         const result = await res.json();

         setResp(result.data || []);
         setTotalItems(result.pagination?.total || 0);
         setTotalPages(result.pagination?.totalPages || 1);

         if (result.stats) setServerStats(result.stats);

         if (formId && !selectedRequest) {
            // Si estamos buscando un ID específico que podría no estar en esta página,
            // idealmente deberíamos hacer un fetch específico por ID, pero por ahora:
            const found = (result.data || []).find((r) => r._id === formId || r.formId === formId);
            if (found) {
               setSelectedRequest(found);
               setShowRequestDetails(true);
            }
         }
      } catch (err) {
         console.error("Error cargando tickets:", err);
      } finally {
         if (!isBackground) setIsLoading(false);
      }
   };

   // --- PAGINACIÓN DE LOS FILTRADOS ---
   // Ahora manejada por el backend. 'resp' contiene solo los items de la página actual.

   const currentRequests = useMemo(() => {
      return resp; // Ya viene paginado del servidor
   }, [resp]);

   // --- HANDLERS ---

   const handleTempFilterChange = (newTempFilters) => {
      setTempFilters(newTempFilters);
   };

   const handleApplyFilters = () => {
      setAppliedFilters(tempFilters);
      setCurrentPage(1); // Reset page
      fetchData(1, false, tempFilters); // Force fetch with new filters immediately
   };

   const handleClearFilters = () => {
      const empty = {
         search: "",
         status: "",
         category: "",
         dateRange: "",
         startDate: "",
         endDate: "",
         company: "",
         submittedBy: "",
      };
      setTempFilters(empty);
      setAppliedFilters(empty);
      setCurrentPage(1);
      fetchData(1, false, empty);
   };

   const handleStatusFilter = (statusValue) => {
      const newStatus = statusValue === null || appliedFilters.status === statusValue ? "" : statusValue;
      const newFilters = { ...appliedFilters, status: newStatus };
      setAppliedFilters(newFilters);
      setTempFilters(newFilters);
      setCurrentPage(1);
      fetchData(1, false, newFilters);
   };

   const handleRemove = async (request) => {
      if (!permisos.eliminar) {
         alert("No tienes permisos para eliminar tickets.");
         return;
      }
      const requestId = request?._id;
      if (!requestId) return alert("ID no válido para eliminar.");
      if (!window.confirm("¿Seguro que deseas eliminar esta solicitud?")) return;

      try {
         setIsLoading(true);
         const res = await apiFetch(`${API_BASE_URL}/soporte/${requestId}`, { method: "DELETE" });
         if (!res.ok) throw new Error("Error al eliminar.");

         setResp((prev) => prev.filter((r) => r._id !== requestId));
         // No necesitamos setTotalItems manual porque es derivado
      } catch (err) {
         console.error(err);
         alert("No se pudo eliminar la solicitud.");
      } finally {
         setIsLoading(false);
      }
   };

   const handleViewDetails = (request) => {
      if (!permisos.verDetalles) return;
      setSelectedRequest(request);
      setShowRequestDetails(true);
   };

   const nextPage = () => {
      if (currentPage < totalPages) setCurrentPage((c) => c + 1);
   };

   const prevPage = () => {
      if (currentPage > 1) setCurrentPage((c) => c - 1);
   };

   // Carga inicial
   useEffect(() => {
      fetchData(currentPage);
   }, [currentPage]); // Recargar al cambiar página

   // Polling
   useEffect(() => {
      const intervalId = setInterval(() => {
         if (!showRequestDetails) {
            // Polling usa filtros actuales
            fetchData(currentPage, true);
         }
      }, 30000);
      return () => clearInterval(intervalId);
   }, [showRequestDetails, currentPage, appliedFilters]);

   // MOCK STATS FALLBACK (O usar serverStats directamente)
   const mockStats = serverStats || {
      total: totalItems,
      // Si no tenemos stats del server aun, mostrar 0 para evitar confusión
      pendiente: 0,
      en_revision: 0,
      aprobado: 0,
      firmado: 0,
      finalizado: 0,
      archivado: 0,
      // O intentar inferir de resp actual si es muy poco
   };

   const customCards = useMemo(() => {
      if (!ticketConfigs || ticketConfigs.length === 0) return null;

      const aggregatedStatuses = {};
      ticketConfigs.forEach((config) => {
         if (config.statuses) {
            config.statuses.forEach((statusDef) => {
               if (!aggregatedStatuses[statusDef.value]) {
                  aggregatedStatuses[statusDef.value] = { ...statusDef };
               }
            });
         }
      });

      const flowIndices = {};
      ticketConfigs.forEach((config) => {
         if (config.statuses) {
            config.statuses.forEach((s, idx) => {
               if (flowIndices[s.value] === undefined || idx < flowIndices[s.value]) {
                  flowIndices[s.value] = idx;
               }
            });
         }
      });

      if (!aggregatedStatuses["archivado"]) {
         aggregatedStatuses["archivado"] = { value: "archivado", label: "Archivado", color: "#64748b", icon: "Folder" };
      }

      const statusKeys = Object.keys(aggregatedStatuses);

      const sortedKeys = statusKeys.sort((a, b) => {
         if (a === "pendiente") return -1;
         if (b === "pendiente") return 1;
         if (a === "archivado") return 1;
         if (b === "archivado") return -1;
         const idxA = flowIndices[a] !== undefined ? flowIndices[a] : 50;
         const idxB = flowIndices[b] !== undefined ? flowIndices[b] : 50;
         return idxA - idxB;
      });

      return sortedKeys.map((key) => {
         const statusDef = aggregatedStatuses[key];

         const lookupKey = key.toLowerCase();
         const count =
            serverStats && serverStats[lookupKey] !== undefined
               ? serverStats[lookupKey]
               : resp.filter((r) => (r.status || "pendiente") === key).length;

         return {
            title: statusDef.label,
            value: count,
            icon: statusDef.icon,
            iconColor: statusDef.color,
            bgColor: statusDef.color + "20",
            borderColor: "border-transparent",
            change: (() => {
               if (!serverStats?.changes) return 0;
               switch (lookupKey) {
                  case "pendiente":
                     return serverStats.changes.submitted || 0;
                  case "aprobado":
                     return serverStats.changes.approved || 0;
                  case "en_revision":
                     return serverStats.changes.reviewed || 0;
                  case "finalizado":
                     return serverStats.changes.finalized || 0;
                  default:
                     return 0;
               }
            })(),
            changeType: "positive",
            filterKey: key,
         };
      });
   }, [ticketConfigs, resp]);

   const mainMarginClass = isMobileScreen ? "ml-0" : isDesktopOpen ? "lg:ml-64" : "lg:ml-16";

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
                  <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={toggleSidebar}></div>
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

         <main className={`transition-all duration-300 ${mainMarginClass} pt-24 lg:pt-20`}>
            <div className="px-4 sm:px-6 lg:p-6 space-y-4 lg:space-y-6 max-w-7xl mx-auto">
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                  <div className="min-w-0 flex-1 mb-3 md:mb-0">
                     <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                           <span className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-accent text-accent-foreground shadow-sm">
                              {totalItems}
                           </span>
                           <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                              Administración de Tickets
                           </h1>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm lg:text-base ml-11">
                           Gestiona todos los tickets de soporte de los usuarios
                        </p>
                     </div>
                  </div>

                  <div className="hidden lg:flex items-center space-x-4">
                     <div className="flex items-center space-x-2 text-sm text-muted-foreground border border-border rounded-lg p-1">
                        <Button
                           variant="ghost"
                           size="sm"
                           onClick={prevPage}
                           disabled={currentPage === 1}
                           iconName="ChevronLeft"
                           iconSize={14}
                           className="px-2"
                        />
                        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                           Página {currentPage} de {totalPages}
                        </span>
                        <Button
                           variant="ghost"
                           size="sm"
                           onClick={nextPage}
                           disabled={currentPage === totalPages || totalPages === 0}
                           iconName="ChevronRight"
                           iconSize={14}
                           className="px-2"
                        />
                        <Button
                           variant="default"
                           size="sm"
                           iconName="Plus"
                           iconPosition="left"
                           iconSize={16}
                           onClick={() => (window.location.href = "/ticket-builder")}
                           className="mb-2 md:mb-0 text-xs sm:text-sm"
                        >
                           Crear Ticket
                        </Button>
                     </div>
                  </div>
               </div>

               <StatsOverview
                  stats={serverStats}
                  allForms={resp}
                  filters={appliedFilters} // Use active filters for highlighting
                  onFilterChange={handleStatusFilter}
                  customCards={customCards}
               />

               <FilterPanel
                  filters={tempFilters} // Bind to temporary state
                  onFilterChange={handleTempFilterChange}
                  onClearFilters={handleClearFilters}
                  onApplyFilters={handleApplyFilters} // Trigger commit
                  isVisible={showFilters}
                  onToggle={() => setShowFilters(!showFilters)}
                  ticketConfigs={ticketConfigs}
               />

               <div
                  className={
                     viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6"
                        : "space-y-2 lg:space-y-4 "
                  }
               >
                  {isLoading && (
                     <div className="text-center py-8 lg:py-12 col-span-full">
                        <Icon name="Loader2" size={32} className="mx-auto mb-3 lg:mb-4 text-accent animate-spin" />
                        <h3 className="text-lg font-semibold text-foreground">Cargando Solicitudes...</h3>
                     </div>
                  )}

                  {!isLoading && currentRequests?.length > 0
                     ? currentRequests?.map((request) => (
                          <RequestCard
                             key={request?._id || request?.id}
                             request={request}
                             ticketConfigs={ticketConfigs}
                             onRemove={handleRemove}
                             onViewDetails={handleViewDetails}
                             viewMode={viewMode}
                             permisos={permisos}
                          />
                       ))
                     : !isLoading && (
                          <div className="text-center py-8 lg:py-12 bg-card border border-border rounded-lg col-span-full">
                             <Icon
                                name="Search"
                                size={32}
                                className="mx-auto mb-3 lg:mb-4 text-muted-foreground opacity-50 sm:w-12 sm:h-12"
                             />
                             <h3 className="text-base lg:text-lg font-semibold text-foreground mb-2">
                                No se encontraron solicitudes
                             </h3>
                             <p className="text-muted-foreground mb-4 text-sm lg:text-base px-4">
                                Intenta ajustar los filtros o crear una nueva solicitud
                             </p>
                          </div>
                       )}
               </div>

               {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-4 pt-4 pb-8">
                     <Button
                        variant="outline"
                        size="sm"
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        iconName="ChevronLeft"
                        iconSize={16}
                     >
                        Anterior
                     </Button>
                     <span className="text-sm font-medium text-foreground">
                        Página {currentPage} de {totalPages}
                     </span>
                     <Button
                        variant="outline"
                        size="sm"
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        iconName="ChevronRight"
                        iconSize={16}
                        iconPosition="right"
                     >
                        Siguiente
                     </Button>
                  </div>
               )}
            </div>
         </main>

         <RequestDetails
            request={selectedRequest}
            ticketConfigs={ticketConfigs}
            isVisible={showRequestDetails}
            onClose={handleCloseRequestDetails}
            onUpdate={updateRequest}
            permisos={permisos}
         />
      </div>
   );
};

export default RequestTracking;
