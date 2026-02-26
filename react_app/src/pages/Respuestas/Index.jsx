import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { usePermissions } from "../../context/PermissionsContext";

const RequestTracking = () => {
   const urlParams = new URLSearchParams(window.location.search);
   const formId = urlParams?.get("id");

   // --- CACHE PERSISTENTE ---
   const cache = useRef({});

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
   const [serverStats, setServerStats] = useState(null);

   const [pageInputValue, setPageInputValue] = useState("1");

   const [filters, setFilters] = useState({
      search: "",
      status: "",
      category: "",
      dateRange: "",
      startDate: "",
      endDate: "",
      company: "",
      submittedBy: "",
   });

   // --- PERMISOS DE USUARIO ---
   const { userPermissions, isLoading: isPermissionsLoading } = usePermissions();

   const permissions = useMemo(() => {
      const perms = userPermissions || [];
      const hasAll = perms.includes("all");

      return {
         view: hasAll || perms.includes("view_solicitudes_clientes"),
         delete: hasAll || perms.includes("delete_solicitudes_clientes"),
         viewDetails: hasAll || perms.includes("view_solicitudes_clientes_details"),
         viewAnswers: hasAll || perms.includes("view_solicitudes_clientes_answers"),
         viewShared: hasAll || perms.includes("view_solicitudes_clientes_shared"),
         viewMessages: hasAll || perms.includes("view_solicitudes_clientes_messages"),
         editState: hasAll || perms.includes("edit_solicitudes_clientes_state"),
         finalize: hasAll || perms.includes("edit_solicitudes_clientes_finalize"),
         archive: hasAll || perms.includes("edit_solicitudes_clientes_archive"),
         viewAttachments: hasAll || perms.includes("view_solicitudes_clientes_attach"),
         downloadAttachment: hasAll || perms.includes("download_solicitudes_clientes_attach"),
         previewAttachment: hasAll || perms.includes("preview_solicitudes_clientes_attach"),
         deleteAttachment: hasAll || perms.includes("delete_solicitudes_clientes_attach"),
         viewGenerated: hasAll || perms.includes("view_solicitudes_clientes_generated"),
         downloadGenerated: hasAll || perms.includes("download_solicitudes_clientes_generated"),
         previewGenerated: hasAll || perms.includes("preview_solicitudes_clientes_generated"),
         regenerate: hasAll || perms.includes("regenerate_solicitudes_clientes_generated"),
         viewSent: hasAll || perms.includes("view_solicitudes_clientes_send"),
         downloadSent: hasAll || perms.includes("download_solicitudes_clientes_send"),
         previewSent: hasAll || perms.includes("preview_solicitudes_clientes_send"),
         deleteSent: hasAll || perms.includes("delete_solicitudes_clientes_send"),
         create_solicitudes_clientes_send: hasAll || perms.includes("create_solicitudes_clientes_send"),
         viewSigned: hasAll || perms.includes("view_solicitudes_clientes_signed"),
         downloadSigned: hasAll || perms.includes("download_solicitudes_clientes_signed"),
         previewSigned: hasAll || perms.includes("preview_solicitudes_clientes_signed"),
         deleteSignature: hasAll || perms.includes("delete_solicitudes_clientes_signed"),
         createMessages: hasAll || perms.includes("create_solicitudes_clientes_messages"),
         createMessagesMail: hasAll || perms.includes("create_solicitudes_clientes_messages_mail"),
         viewMessagesAdmin: hasAll || perms.includes("view_solicitudes_clientes_messages_admin"),
         createMessagesAdmin: hasAll || perms.includes("create_solicitudes_clientes_messages_admin"),
      };
   }, [userPermissions]);

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

   useEffect(() => {
      setPageInputValue(currentPage.toString());
   }, [currentPage]);

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

   // --- FUNCIÓN MAESTRA FETCH CON CACHE Y PRE-CARGA ---
   const fetchData = useCallback(async (pageNumber, isPrefetch = false, overrideFilters = filters) => {
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

      const queryString = params.toString();

      // Evitar prefetch si ya está en cache
      if (isPrefetch && cache.current[queryString]) return null;

      try {
         const url = `${API_BASE_URL}/respuestas/filtros?${queryString}`;
         const res = await apiFetch(url);
         if (!res.ok) throw new Error("Error al obtener datos");
         const result = await res.json();

         const pageData = {
            data: normalizeData(result.data),
            totalPages: result.pagination.totalPages || 1,
            totalItems: result.pagination.total || 0,
            stats: result.stats || null
         };

         // Guardar en cache
         cache.current[queryString] = pageData;
         return pageData;
      } catch (err) {
         console.error(`Error en fetch:`, err);
         return null;
      }
   }, [itemsPerPage, filters]);

   // EFECTO PRINCIPAL: Carga de página actual (Instantánea con Cache)
   useEffect(() => {
      const loadPage = async () => {
         const params = new URLSearchParams({
            page: currentPage,
            limit: itemsPerPage,
            search: filters.search || "",
            status: filters.status || "",
            company: filters.company || "",
            submittedBy: filters.submittedBy || "",
            startDate: filters.startDate || "",
            endDate: filters.endDate || "",
         });
         const currentKey = params.toString();

         // 1. Si existe en cache, inyectar inmediatamente
         if (cache.current[currentKey]) {
            const cached = cache.current[currentKey];
            setResp(cached.data);
            setTotalPages(cached.totalPages);
            setTotalItems(cached.totalItems);
            if (cached.stats) setServerStats(cached.stats);
            setIsLoading(false);

            // Revalidación silenciosa
            fetchData(currentPage).then(fresh => {
               if (fresh) {
                  setResp(fresh.data);
                  setTotalPages(fresh.totalPages);
                  if (fresh.stats) setServerStats(fresh.stats);
               }
            });
         } else {
            // 2. Si no hay cache, mostrar loading
            setIsLoading(true);
            const data = await fetchData(currentPage);
            if (data) {
               setResp(data.data);
               setTotalPages(data.totalPages);
               setTotalItems(data.totalItems);
               if (data.stats) setServerStats(data.stats);
            }
            setIsLoading(false);
         }
         window.scrollTo({ top: 0, behavior: "smooth" });
      };

      loadPage();
   }, [currentPage, itemsPerPage, fetchData]);

   // EFECTO DE PRE-CARGA: Siguiente página
   useEffect(() => {
      if (!isLoading && currentPage < totalPages) {
         fetchData(currentPage + 1, true);
      }
   }, [currentPage, totalPages, isLoading, fetchData]);

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

               // Inyectar en cache para que no se pierda
               cache.current[params.toString()] = {
                  data: normalizedPage,
                  totalPages: result.pagination.totalPages,
                  totalItems: result.pagination.total,
                  stats: result.stats
               };

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
      if (!formId) return;
      const foundInState = resp.find((r) => String(r._id) === formId || String(r.formId) === formId);
      if (foundInState) {
         setSelectedRequest(foundInState);
         setShowRequestDetails(true);
      } else {
         findRequestGlobally(formId);
      }
   }, [formId]);

   if (isPermissionsLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-background"><Icon name="Loader2" className="animate-spin text-primary" size={40} /></div>;
   }

   if (!permissions.view && userPermissions.length > 0) return <Navigate to="/panel" replace />;

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

   const handleApplyFilters = () => {
      cache.current = {}; // Limpiar cache al aplicar nuevos filtros
      setCurrentPage(1);
   };

   const handleLimitChange = (limit) => {
      cache.current = {}; // Limpiar cache al cambiar límite
      setItemsPerPage(limit);
      setCurrentPage(1);
      setIsLimitOpen(false);
   };

   const handleStatusFilter = (status) => {
      cache.current = {};
      const newStatus = filters.status === status ? "" : status;
      setFilters(prev => ({ ...prev, status: newStatus }));
      setCurrentPage(1);
   };

   const handleClearFilters = () => {
      cache.current = {};
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
         if (res.ok) {
            setResp((prev) => prev.filter((r) => r._id !== request._id));
            cache.current = {}; // Limpiar cache para forzar refresco de datos tras borrar
         }
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

         <main className={`transition-all duration-300 ${mainMarginClass} pt-8 lg:pt-4`}>
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
               </div>

               <StatsOverview stats={mockStats} allForms={resp} filters={filters} onFilterChange={handleStatusFilter} />

               <FilterPanel
                  filters={filters}
                  onFilterChange={setFilters}
                  onClearFilters={handleClearFilters}
                  onApplyFilters={handleApplyFilters}
                  isVisible={showFilters}
                  onToggle={() => setShowFilters(!showFilters)}
                  paginationProps={{
                     currentPage,
                     totalPages,
                     itemsPerPage,
                     isLoading,
                     pageInputValue,
                     isLimitOpen,
                     setIsLimitOpen,
                     setCurrentPage,
                     handlePageInputChange,
                     handlePageInputBlurOrSubmit,
                     handlePageInputKeyDown,
                     handleLimitChange,
                     limitRef
                  }}
                  viewModeProps={{
                     viewMode,
                     setViewMode
                  }}
               />

               <div
                  className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}
               >
                  {isLoading && currentRequests.length === 0 ? (
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