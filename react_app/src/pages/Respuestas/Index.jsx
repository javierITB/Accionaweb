import React, { useState, useEffect, useMemo, useRef } from "react";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import { apiFetch, API_BASE_URL } from "../../utils/api";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import RequestCard from "./components/RequestCard";
import FilterPanel from "./components/FilterPanel";
import MessageModal from "./components/MessageModal";
import RequestDetails from "./components/RequestDetails";
import StatsOverview from "./components/StatsOverview";
import { Navigate } from "react-router-dom";

const RequestTracking = ({ userPermissions = {} }) => {
   const urlParams = new URLSearchParams(window.location.search);
   const formId = urlParams?.get("id");

   // --- ESTADOS DE UI ---
   const [isDesktopOpen, setIsDesktopOpen] = useState(true);
   const [isMobileOpen, setIsMobileOpen] = useState(false);
   const [isMobileScreen, setIsMobileScreen] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
   const [viewMode, setViewMode] = useState("grid");
   const [showFilters, setShowFilters] = useState(false);

   // --- ESTADOS DE DATOS ---
   const [resp, setResp] = useState([]);
   const [selectedRequest, setSelectedRequest] = useState(null);
   const [messageRequest, setMessageRequest] = useState(null);
   const [isLoading, setIsLoading] = useState(false);
   const [showMessageModal, setShowMessageModal] = useState(false);
   const [showRequestDetails, setShowRequestDetails] = useState(false);

   // --- ESTADOS DE PAGINACIÓN Y FILTROS ---
   const [currentPage, setCurrentPage] = useState(1);
   const [totalPages, setTotalPages] = useState(1);
   const [totalItems, setTotalItems] = useState(0);
   const [itemsPerPage, setItemsPerPage] = useState(30);
   const [isLimitOpen, setIsLimitOpen] = useState(false);
   const [archivedCountServer, setArchivedCountServer] = useState(0);
   const [serverStats, setServerStats] = useState(null);
   const requestsPerPage = 30;

   // NUEVO: Estado para el valor del input de página
   const [pageInputValue, setPageInputValue] = useState("1");

   const [filters, setFilters] = useState({
      search: "",
      status: "",
      category: "",
      dateRange: "",
      startDate: "",
      endDate: "",
      company: "",
   });

   // --- PERMISOS DE USUARIO ---
   const [permissions, setPermissions] = useState({
      view: false,
      delete: false,
      viewDetails: false,
      editState: false,
      edit: false, // General edit (files, etc)
      regenerate: false,
   });

   const checkPermissions = async () => {
      try {
         const role = sessionStorage.getItem("cargo")?.toLowerCase();
         let perms = [];
         let hasAll = false;
   
         // --- NUEVO: Consultar configuración de limpieza de archivos del plan ---
         let planDeletesFiles = false;
         try {
            const configRes = await apiFetch(`${API_BASE_URL}/config_plan`);
            if (configRes.ok) {
               const configData = await configRes.json();
               const reqLimits = configData?.planLimits?.requests ?? configData?.planLimits?.solicitudes;
               // Verificamos si es booleano true o string "true"
               planDeletesFiles = reqLimits?.deleteArchivedFiles === true || reqLimits?.deleteArchivedFiles === "true";
            }
         } catch (e) {
            console.warn("[Permissions] No se pudo cargar config_plan:", e.message);
         }
   
         const res = await apiFetch(`${API_BASE_URL}/roles/name/${role}`);
         if (res.ok) {
            const roleData = await res.json();
            perms = roleData.permissions || [];
            hasAll = perms.includes("all");
   
            setPermissions({
               // Vistas Base
               view: hasAll || perms.includes("view_solicitudes_clientes"),
               delete: hasAll || perms.includes("delete_solicitudes_clientes"),
               viewDetails: hasAll || perms.includes("view_solicitudes_clientes_details"),
               viewAnswers: hasAll || perms.includes("view_solicitudes_clientes_answers"),
               viewShared: hasAll || perms.includes("view_solicitudes_clientes_shared"),
               viewMessages: hasAll || perms.includes("view_solicitudes_clientes_messages"),
   
               // Estados
               editState: hasAll || perms.includes("edit_solicitudes_clientes_state"),
               finalize: hasAll || perms.includes("edit_solicitudes_clientes_finalize"),
               archive: hasAll || perms.includes("edit_solicitudes_clientes_archive"),
               
               // PROPIEDAD DINÁMICA DEL PLAN (Para mostrar la mini carta en el front)
               deleteArchivedFiles: planDeletesFiles,
   
               // Adjuntos
               viewAttachments: hasAll || perms.includes("view_solicitudes_clientes_attach"),
               downloadAttachment: hasAll || perms.includes("download_solicitudes_clientes_attach"),
               previewAttachment: hasAll || perms.includes("preview_solicitudes_clientes_attach"),
               deleteAttachment: hasAll || perms.includes("delete_solicitudes_clientes_attach"),
   
               // Documentos Generado
               viewGenerated: hasAll || perms.includes("view_solicitudes_clientes_generated"),
               downloadGenerated: hasAll || perms.includes("download_solicitudes_clientes_generated"),
               previewGenerated: hasAll || perms.includes("preview_solicitudes_clientes_generated"),
               regenerate: hasAll || perms.includes("regenerate_solicitudes_clientes_generated"),
   
               // Enviado/Corregido
               viewSent: hasAll || perms.includes("view_solicitudes_clientes_send"),
               downloadSent: hasAll || perms.includes("download_solicitudes_clientes_send"),
               previewSent: hasAll || perms.includes("preview_solicitudes_clientes_send"),
               deleteSent: hasAll || perms.includes("delete_solicitudes_clientes_send"),
               create_solicitudes_clientes_send: hasAll || perms.includes("create_solicitudes_clientes_send"),
   
               // Firmado
               viewSigned: hasAll || perms.includes("view_solicitudes_clientes_signed"),
               downloadSigned: hasAll || perms.includes("download_solicitudes_clientes_signed"),
               previewSigned: hasAll || perms.includes("preview_solicitudes_clientes_signed"),
               deleteSignature: hasAll || perms.includes("delete_solicitudes_clientes_signed"),
   
               // Mensajes
               createMessages: hasAll || perms.includes("create_solicitudes_clientes_messages"),
               createMessagesMail: hasAll || perms.includes("create_solicitudes_clientes_messages_mail"),
               viewMessagesAdmin: hasAll || perms.includes("view_solicitudes_clientes_messages_admin"),
               createMessagesAdmin: hasAll || perms.includes("create_solicitudes_clientes_messages_admin"),
            });
         }
      } catch (error) {
         console.error("Error checking permissions:", error);
      }
   };

   useEffect(() => {
      checkPermissions();
   }, []);

   const limitRef = useRef(null);

   useEffect(() => {
      const handleClickOutside = (event) => {
         if (limitRef.current && !limitRef.current.contains(event.target)) {
            setIsLimitOpen(false);
         }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);

   // NUEVO: Sincronizar el input cuando cambia la página (por botones o carga)
   useEffect(() => {
      setPageInputValue(currentPage.toString());
   }, [currentPage]);

   // --- EFECTOS DE REDIMENSIONAMIENTO ---
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

   // --- LOGICA DE SIDEBAR ---
   const toggleSidebar = () => {
      if (isMobileScreen) {
         setIsMobileOpen(!isMobileOpen);
      } else {
         setIsDesktopOpen(!isDesktopOpen);
      }
   };

   const handleNavigation = () => {
      if (isMobileScreen) setIsMobileOpen(false);
   };

   // --- FUNCIÓN DE NORMALIZACIÓN ---
   const normalizeData = (data) => {
      return data.map((r) => ({
         _id: r._id,
         formId: r.formId,
         title: r.formTitle || r.title || "Formulario",
         formTitle: r.formTitle || r.title,
         description: r.formTitle || "Formulario de solicitud",
         submittedAt: r.submittedAt || r.createdAt || null,
         createdAt: r.createdAt,
         status: r.status,
         trabajador: r.trabajador || "",
         rutTrabajador: r.rutTrabajador || "",
         submittedBy: r.user?.nombre || r.submittedBy || "Usuario Desconocido",
         company: r.user?.empresa || r.company || "Empresa Desconocida",
         hasMessages: r.adjuntosCount > 0,
         updatedAt: r.updatedAt,
      }));
   };

   // --- LÓGICA DE CARGA DE DATOS ---
   const fetchData = async (pageNumber, isBackground = false, overrideFilters = filters) => {
      try {
         if (!isBackground) setIsLoading(true);

         const params = new URLSearchParams({
            page: pageNumber,
            limit: itemsPerPage,
            search: overrideFilters.search || "",
            status: overrideFilters.status || "",
            company: overrideFilters.company || "",
            submittedBy: overrideFilters.submittedBy || "",
            startDate: overrideFilters.startDate || "",
            endDate: overrideFilters.endDate || "",
         });

         const url = `${API_BASE_URL}/respuestas/filtros?${params.toString()}`;
         const res = await apiFetch(url);

         if (!res.ok) throw new Error("Error al obtener datos");
         const result = await res.json();

         setResp(normalizeData(result.data));
         setTotalPages(result.pagination.totalPages || 1);
         setTotalItems(result.pagination.total || 0);

         if (result.stats) {
            setServerStats((prevStats) => {
               const isFilteringByStatus = overrideFilters.status && overrideFilters.status !== "";
               if (isFilteringByStatus && prevStats) return prevStats;
               return result.stats;
            });
         }

         if (!isBackground) window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
         console.error(`Error en fetch:`, err);
      } finally {
         if (!isBackground) setIsLoading(false);
      }
   };

   // --- BÚSQUEDA GLOBAL ---
   const findRequestGlobally = async (idToFind) => {
      setIsLoading(true);
      let page = 1;
      let maxPages = totalPages || 1;
      try {
         while (page <= maxPages) {
            const params = new URLSearchParams({ page, limit: itemsPerPage });
            const url = `${API_BASE_URL}/respuestas/filtros?${params.toString()}`;
            const res = await apiFetch(url);
            const result = await res.json();
            const found = result.data.find((r) => String(r._id) === idToFind || String(r.formId) === idToFind);
            if (found) {
               const normalizedPage = normalizeData(result.data);
               const normalizedTarget = normalizedPage.find(
                  (r) => String(r._id) === idToFind || String(r.formId) === idToFind,
               );
               setResp(normalizedPage);
               setSelectedRequest(normalizedTarget);
               setShowRequestDetails(true);
               setCurrentPage(page);
               setTotalPages(result.pagination.totalPages);
               break;
            }
            maxPages = result.pagination.totalPages;
            page++;
            if (page > maxPages) break;
         }
      } catch (err) {
         console.error("Error en búsqueda global:", err);
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      fetchData(currentPage);
   }, [currentPage, itemsPerPage]);

   useEffect(() => {
      if (!formId) return;
      const foundInState = resp.find((r) => String(r._id) === formId || String(r.formId) === formId);
      if (foundInState) {
         setSelectedRequest(foundInState);
         setShowRequestDetails(true);
      } else {
         findRequestGlobally(formId);
      }
   }, [formId]);

   const canAccess = userPermissions.includes("view_solicitudes_clientes");
   if (!canAccess) return <Navigate to="/panel" replace />;

   // NUEVO: Handlers para cambio de página manual
   const handlePageInputChange = (e) => {
      const value = e.target.value;
      if (value === "" || /^[0-9]+$/.test(value)) {
         setPageInputValue(value);
      }
   };

   const handlePageInputBlurOrSubmit = () => {
      let page = parseInt(pageInputValue);
      if (isNaN(page) || page < 1) {
         page = 1;
      } else if (page > totalPages) {
         page = totalPages;
      }
      setCurrentPage(page);
      setPageInputValue(page.toString());
   };

   const handlePageInputKeyDown = (e) => {
      if (e.key === "Enter") {
         handlePageInputBlurOrSubmit();
      }
   };

   // --- HANDLERS ---
   const handleApplyFilters = () => {
      setCurrentPage(1);
      fetchData(1);
   };

   const handleLimitChange = (limit) => {
      setItemsPerPage(limit);
      setCurrentPage(1);
      setIsLimitOpen(false);
   };

   const handleStatusFilter = (status) => {
      const newStatus = filters.status === status ? "" : status;
      const newFilters = { ...filters, status: newStatus };
      setFilters(newFilters);
      setCurrentPage(1);
      fetchData(1, false, newFilters);
   };

   const handleClearFilters = () => {
      const cleared = {
         search: "",
         status: "",
         category: "",
         dateRange: "",
         startDate: "",
         endDate: "",
         company: "",
         submittedBy: "",
      };
      setFilters(cleared);
      setCurrentPage(1);
      fetchData(1, false, cleared);
   };

   const updateRequest = (updatedRequest) => {
      setResp((prev) => prev.map((req) => (req._id === updatedRequest._id ? updatedRequest : req)));
      setSelectedRequest(updatedRequest);
   };

   const handleCloseRequestDetails = () => {
      setShowRequestDetails(false);
      setSelectedRequest(null);
      const url = new URL(window.location.href);
      url.searchParams.delete("id");
      window.history.replaceState({}, document.title, url.pathname + url.search);
   };

   const handleRemove = async (request) => {
      if (!permissions.delete) return;
      if (!window.confirm("¿Seguro que deseas eliminar esta solicitud?")) return;
      try {
         const res = await apiFetch(`${API_BASE_URL}/respuestas/${request._id}`, { method: "DELETE" });
         if (res.ok) setResp((prev) => prev.filter((r) => r._id !== request._id));
      } catch (err) {
         alert("Error al eliminar.");
      }
   };

   const currentRequests = useMemo(() => {
      return resp;
   }, [resp]);

   const mockStats = serverStats || {
      total: totalItems,
      pendiente: 0,
      en_revision: 0,
      aprobado: 0,
      firmado: 0,
      finalizado: 0,
      archivado: 0,
   };

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
                  <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileOpen(false)}></div>
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
                  className="w-12 h-12 rounded-full shadow-lg"
               />
            </div>
         )}

         <main className={`transition-all duration-300 ${mainMarginClass} pt-24 lg:pt-20`}>
            <div className="px-4 sm:px-6 lg:p-6 space-y-6 max-w-7xl mx-auto">
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                     <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center min-w-8 h-8 px-2 rounded-full text-sm font-bold bg-accent text-accent-foreground shadow-sm">
                           {filters.status === "archivado" ? serverStats?.archivado || 0 : totalItems}
                        </span>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                           Seguimiento de Solicitudes
                        </h1>
                     </div>
                     <p className="text-muted-foreground mt-1 text-sm lg:text-base ml-11">
                        {filters.status === "archivado"
                           ? "Historial de solicitudes archivadas"
                           : "Monitorea el estado de tus solicitudes activas"}
                     </p>
                  </div>

                  <div className="flex items-center justify-center md:justify-end w-full md:w-auto space-x-4">
                     <div ref={limitRef} className="relative">
                        <button
                           onClick={() => setIsLimitOpen(!isLimitOpen)}
                           className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none border border-border rounded-lg px-3 py-1 bg-card h-8"
                        >
                           <span>{itemsPerPage}</span>
                           <Icon name={isLimitOpen ? "ChevronDown" : "ChevronUp"} size={14} />
                        </button>

                        {isLimitOpen && (
                           <div className="absolute right-0 top-full mt-2 w-16 bg-card border border-border shadow-md rounded-md z-50 overflow-hidden">
                              {[15, 30, 45, 60].map((limit) => (
                                 <button
                                    key={limit}
                                    onClick={() => handleLimitChange(limit)}
                                    className={`w-full text-center py-1 text-sm hover:bg-muted ${itemsPerPage === limit ? "font-bold text-primary" : "text-muted-foreground"}`}
                                 >
                                    {limit}
                                 </button>
                              ))}
                           </div>
                        )}
                     </div>

                     <div className="flex items-center space-x-2 text-sm text-muted-foreground border border-border rounded-lg p-1 bg-card">
                        <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                           disabled={currentPage === 1 || isLoading}
                           iconName="ChevronLeft"
                        />

                        {/* NUEVO: Diseño x/y Compacto Superior */}
                        <div className="flex items-center gap-0 text-muted-foreground">
                           <input
                              type="text"
                              value={pageInputValue}
                              onChange={handlePageInputChange}
                              onBlur={handlePageInputBlurOrSubmit}
                              onKeyDown={handlePageInputKeyDown}
                              className="w-6 h-7 text-right bg-transparent border-none text-muted-foreground font-medium focus:ring-0 outline-none p-0"
                           />
                           <span className="font-medium mx-0.5">/</span>
                           <span className="font-medium text-left min-w-[1.5rem]">{totalPages}</span>
                        </div>

                        <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                           disabled={currentPage === totalPages || isLoading}
                           iconName="ChevronRight"
                        />
                     </div>
                     <div className="flex items-center border border-border rounded-lg bg-card">
                        <Button
                           variant={viewMode === "grid" ? "default" : "ghost"}
                           size="sm"
                           onClick={() => setViewMode("grid")}
                           iconName="Grid3X3"
                           className="rounded-r-none"
                        />
                        <Button
                           variant={viewMode === "list" ? "default" : "ghost"}
                           size="sm"
                           onClick={() => setViewMode("list")}
                           iconName="List"
                           className="rounded-l-none border-l"
                        />
                     </div>
                  </div>
               </div>

               <StatsOverview stats={mockStats} allForms={resp} filters={filters} onFilterChange={handleStatusFilter} />

               <FilterPanel
                  filters={filters}
                  onFilterChange={setFilters}
                  onClearFilters={handleClearFilters}
                  onApplyFilters={handleApplyFilters}
                  isVisible={showFilters}
                  onToggle={() => setShowFilters(!showFilters)}
               />

               <div
                  className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}
               >
                  {isLoading ? (
                     <div className="col-span-full py-12 text-center">
                        <Icon name="Loader2" size={32} className="mx-auto text-accent animate-spin mb-4" />
                        <p className="text-muted-foreground">Buscando solicitud...</p>
                     </div>
                  ) : currentRequests.length > 0 ? (
                     currentRequests.map((request) => (
                        <RequestCard
                           key={request._id}
                           request={request}
                           onRemove={handleRemove}
                           onViewDetails={(req) => {
                              setSelectedRequest(req);
                              setShowRequestDetails(true);
                           }}
                           onSendMessage={(req) => {
                              setMessageRequest(req);
                              setShowMessageModal(true);
                           }}
                           userPermissions={permissions}
                        />
                     ))
                  ) : (
                     <div className="col-span-full py-12 text-center bg-card border border-border rounded-xl">
                        <Icon name="Search" size={40} className="mx-auto text-muted-foreground opacity-20 mb-4" />
                        <p className="text-muted-foreground">No se encontraron solicitudes</p>
                     </div>
                  )}
               </div>

               {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4 py-8 border-t border-border mt-6">
                     <div className="flex items-center space-x-4">
                        <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                           disabled={currentPage === 1 || isLoading}
                           className="w-28 sm:w-auto"
                        >
                           <Icon name="ChevronLeft" size={16} className="mr-2" />
                           Anterior
                        </Button>

                        {/* NUEVO: Diseño x/y Compacto Inferior */}
                        <div className="flex items-center gap-0 bg-muted px-4 py-1.5 rounded-full text-muted-foreground">
                           <input
                              type="text"
                              value={pageInputValue}
                              onChange={handlePageInputChange}
                              onBlur={handlePageInputBlurOrSubmit}
                              onKeyDown={handlePageInputKeyDown}
                              className="w-6 bg-transparent border-none text-right font-medium text-muted-foreground focus:outline-none p-0"
                           />
                           <span className="font-medium mx-0.5">/</span>
                           <span className="font-medium text-left min-w-[1.5rem]">{totalPages}</span>
                        </div>

                        <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                           disabled={currentPage === totalPages || isLoading}
                           className="w-28 sm:w-auto"
                        >
                           Siguiente
                           <Icon name="ChevronRight" size={16} className="ml-2" />
                        </Button>
                     </div>
                  </div>
               )}
            </div>
         </main>

         <MessageModal
            isOpen={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            request={messageRequest}
            formId={formId}
            onSendMessage={console.log}
            userPermissions={permissions}
         />
         <RequestDetails
            request={selectedRequest}
            isVisible={showRequestDetails}
            onClose={handleCloseRequestDetails}
            onUpdate={updateRequest}
            onSendMessage={(req) => {
               setMessageRequest(req);
               setShowMessageModal(true);
            }}
            userPermissions={permissions}
         />
      </div>
   );
};

export default RequestTracking;
