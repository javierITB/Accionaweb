import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import FormCard from "./components/FormCard";
import SearchBar from "./components/SearchBar";
import { API_BASE_URL, apiFetch } from "../../utils/api";
import { Navigate, useNavigate } from "react-router-dom";

const FormCenter = ({ userPermissions = [] }) => {
   const [searchQuery, setSearchQuery] = useState("");
   const [activeCategory, setActiveCategory] = useState("all");
   const [filters, setFilters] = useState({
      status: [],
      isRecent: false,
      priority: [],
      documentsRequired: false
   });
   const [filteredForms, setFilteredForms] = useState([]);
   const navigate = useNavigate();

   // CACHE PERSISTENTE EN MEMORIA
   const cache = useRef({});

   // UI State - RESPONSIVE
   const [isDesktopOpen, setIsDesktopOpen] = useState(true);
   const [isMobileOpen, setIsMobileOpen] = useState(false);
   const [isMobileScreen, setIsMobileScreen] = useState(
      typeof window !== "undefined" ? window.innerWidth < 768 : false
   );

   // Paginación y Datos
   const [currentPage, setCurrentPage] = useState(1);
   const [totalPages, setTotalPages] = useState(1);
   const [totalItems, setTotalItems] = useState(0);
   const [stats, setStats] = useState({
      total: 0,
      recent: 0,
      status: {},
      section: {},
   });
   const itemsPerPage = 15;

   const [allForms, setAllForms] = useState([]);
   const [isLoading, setIsLoading] = useState(true);

   const permisos = useMemo(
      () => ({
         view_formularios: userPermissions.includes("view_formularios"),
         create_formularios: userPermissions.includes("create_formularios"),
         edit_formularios: userPermissions.includes("edit_formularios"),
         delete_formularios: userPermissions.includes("delete_formularios"),
      }),
      [userPermissions],
   );

   // --- Lógica Maestra de Fetching ---
   const fetchData = useCallback(async (page, isPrefetch = false) => {
      const params = new URLSearchParams({
         page: page,
         limit: itemsPerPage,
         search: searchQuery,
         category: activeCategory !== "all" ? activeCategory : "",
         status: filters.status ? filters.status.join(",") : "",
      });

      const queryString = params.toString();
      if (isPrefetch && cache.current[queryString]) return null;

      try {
         const res = await apiFetch(`${API_BASE_URL}/forms/mini?${queryString}`);
         const result = await res.json();
         const rawForms = Array.isArray(result) ? result : result.data || [];

         const normalized = rawForms.map((f) => ({
            id: f._id,
            title: f.title || "Sin título",
            description: f.description || "",
            category: f.category || "general",
            icon: f.icon || "FileText",
            primaryColor: f.primaryColor || "#3B82F6",
            status: f.status || "borrador",
            priority: f.priority || "medium",
            estimatedTime: f.responseTime || "1-5 min",
            fields: f.fields !== undefined ? f.fields : (f.questions ? f.questions.length : 0),
            documentsRequired: f.documentsRequired ?? false,
            tags: f.tags || [],
            companies: f.companies || [],
            lastModified: f.updatedAt ? f.updatedAt.split("T")[0] : null,
            section: f.section,
         }));

         const pageData = {
            forms: normalized,
            totalPages: result.pages || 1,
            totalItems: result.total || normalized.length,
            stats: result.stats || { total: 0, recent: 0, status: {}, section: {} }
         };

         cache.current[queryString] = pageData;
         return pageData;
      } catch (err) {
         return null;
      }
   }, [searchQuery, activeCategory, filters.status]);

   // --- EFECTO DE CARGA ULTRA-RÁPIDA ---
   useEffect(() => {
      const loadData = async () => {
         const params = new URLSearchParams({
            page: currentPage,
            limit: itemsPerPage,
            search: searchQuery,
            category: activeCategory !== "all" ? activeCategory : "",
            status: filters.status ? filters.status.join(",") : "",
         });
         const currentKey = params.toString();

         // CAMBIO CLAVE: Si está en cache, actualizamos todo SIN poner isLoading(true)
         if (cache.current[currentKey]) {
            const cached = cache.current[currentKey];
            setAllForms(cached.forms);
            setTotalPages(cached.totalPages);
            setTotalItems(cached.totalItems);
            setStats(cached.stats);
            setIsLoading(false); // Nos aseguramos que esté en false inmediatamente

            // Actualización silenciosa de fondo
            fetchData(currentPage).then(fresh => {
               if (fresh) {
                  setAllForms(fresh.forms);
                  setStats(fresh.stats);
               }
            });
         } else {
            // Solo si NO está en cache mostramos el loading
            setIsLoading(true);
            const data = await fetchData(currentPage);
            if (data) {
               setAllForms(data.forms);
               setTotalPages(data.totalPages);
               setTotalItems(data.totalItems);
               setStats(data.stats);
            }
            setIsLoading(false);
         }
      };
      loadData();
   }, [currentPage, searchQuery, activeCategory, filters.status, fetchData]);

   // --- PREFETCH AGRESIVO (Sin delay) ---
   useEffect(() => {
      if (!isLoading && currentPage < totalPages) {
         fetchData(currentPage + 1, true);
      }
   }, [currentPage, totalPages, isLoading, fetchData]);

   // --- Responsive Handlers ---
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

   const toggleSidebar = () => isMobileScreen ? setIsMobileOpen(!isMobileOpen) : setIsDesktopOpen(!isDesktopOpen);

   // --- Handlers de Filtros ---
   const handleSearch = (query) => {
      cache.current = {}; // Reset cache al buscar
      setSearchQuery(query);
      setCurrentPage(1);
   };

   const handleStatusFilter = (statusValue) => {
      setFilters(prev => ({
         ...prev,
         status: prev.status.includes(statusValue) ? [] : [statusValue],
         isRecent: false
      }));
      setCurrentPage(1);
   };

   const handleRecentFilter = () => {
      setFilters(prev => ({ ...prev, isRecent: !prev.isRecent, status: [] }));
      setCurrentPage(1);
   };

   // Filtro local adicional (Priority, etc)
   useEffect(() => {
      let filtered = [...allForms];
      if (filters.isRecent) {
         filtered = filtered.filter(f => {
            if (!f.lastModified) return false;
            return (new Date() - new Date(f.lastModified)) <= 7 * 24 * 60 * 60 * 1000;
         });
      }
      setFilteredForms(filtered);
   }, [filters.isRecent, allForms]);

   if (!permisos.view_formularios) return <Navigate to="/panel" replace />;

   const categories = [
      { id: "all", name: "Todos", count: stats.total || 0 },
      { id: "Remuneraciones", name: "Remuneraciones", count: stats.section["Remuneraciones"] || 0 },
      { id: "Anexos", name: "Anexos", count: stats.section["Anexos"] || 0 },
      { id: "Finiquitos", name: "Finiquitos", count: stats.section["Finiquitos"] || 0 },
      { id: "Otras", name: "Otras", count: stats.section["Otras"] || 0 },
   ];

   const mainMarginClass = isMobileScreen ? "ml-0" : isDesktopOpen ? "lg:ml-64" : "lg:ml-16";

   return (
      <div className="min-h-screen bg-background text-foreground">
         <Header />

         {/* Sidebar y Overlay Móvil */}
         {(isMobileOpen || !isMobileScreen) && (
            <>
               <Sidebar
                  isCollapsed={!isDesktopOpen}
                  onToggleCollapse={toggleSidebar}
                  isMobileOpen={isMobileOpen}
                  onNavigate={() => isMobileScreen && setIsMobileOpen(false)}
               />
               {isMobileScreen && isMobileOpen && (
                  <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={toggleSidebar} />
               )}
            </>
         )}

         {/* Botón flotante móvil */}
         {!isMobileOpen && isMobileScreen && (
            <div className="fixed bottom-6 left-6 z-50">
               <Button
                  variant="default"
                  size="icon"
                  onClick={toggleSidebar}
                  iconName="Menu"
                  className="w-14 h-14 rounded-full shadow-2xl"
               />
            </div>
         )}

         <main className={`transition-all duration-300 ${mainMarginClass} pt-4 lg:pt-2 pb-12`}>
            <div className="px-4 sm:px-6 lg:p-6 space-y-6 lg:space-y-8 max-w-7xl mx-auto">

               {/* Header de Sección */}
               <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
                  <div className="min-w-0 flex-1">
                     <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Formularios</h1>
                     <p className="text-muted-foreground mt-1 text-sm sm:text-base">Administra y previsualiza tus formularios.</p>
                  </div>
               </div>

               {/* Stats Cards - RESPONSIVE GRID */}
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div
                     className={`p-4 bg-card border rounded-xl cursor-pointer transition-all ${!filters.status?.length && !filters.isRecent ? 'ring-2 ring-primary shadow-lg' : 'hover:border-primary'}`}
                     onClick={() => setFilters({ status: [], isRecent: false })}
                  >
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg"><Icon name="FileText" size={20} className="text-primary" /></div>
                        <div><p className="text-xl font-bold">{stats.total || 0}</p><p className="text-xs text-muted-foreground">Total</p></div>
                     </div>
                  </div>

                  <div
                     className={`p-4 bg-card border rounded-xl cursor-pointer transition-all ${filters.status?.includes("borrador") ? 'ring-2 ring-warning shadow-lg' : 'hover:border-warning'}`}
                     onClick={() => handleStatusFilter("borrador")}
                  >
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-warning/10 rounded-lg"><Icon name="Edit" size={20} className="text-warning" /></div>
                        <div><p className="text-xl font-bold">{stats.status["borrador"] || 0}</p><p className="text-xs text-muted-foreground">Borradores</p></div>
                     </div>
                  </div>

                  <div
                     className={`p-4 bg-card border rounded-xl cursor-pointer transition-all ${filters.status?.includes("publicado") ? 'ring-2 ring-secondary shadow-lg' : 'hover:border-secondary'}`}
                     onClick={() => handleStatusFilter("publicado")}
                  >
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary/10 rounded-lg"><Icon name="Clock" size={20} className="text-secondary" /></div>
                        <div><p className="text-xl font-bold">{stats.status["publicado"] || 0}</p><p className="text-xs text-muted-foreground">Publicados</p></div>
                     </div>
                  </div>

                  <div
                     className={`p-4 bg-card border rounded-xl cursor-pointer transition-all ${filters.isRecent ? 'ring-2 ring-success shadow-lg' : 'hover:border-success'}`}
                     onClick={handleRecentFilter}
                  >
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-success/10 rounded-lg"><Icon name="CheckCircle" size={20} className="text-success" /></div>
                        <div><p className="text-xl font-bold">{stats.recent || 0}</p><p className="text-xs text-muted-foreground">Recientes</p></div>
                     </div>
                  </div>
               </div>

               {/* Barra de Búsqueda y Categorías */}
               <div className="space-y-4">
                  <SearchBar onSearch={handleSearch} permisos={permisos} />

               </div>

               {/* Grid de Contenido */}
               <div className="min-h-[400px]">
                  {isLoading && allForms.length === 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                           <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl" />
                        ))}
                     </div>
                  ) : (
                     <>
                        {filteredForms.length === 0 ? (
                           <div className="text-center py-20">
                              <Icon name="Search" size={48} className="mx-auto text-muted-foreground mb-4" />
                              <h3 className="text-lg font-medium">No hay formularios encontrados</h3>
                              <p className="text-muted-foreground mb-6">Prueba a ajustar tus filtros de búsqueda.</p>
                              <Button variant="outline" onClick={() => handleSearch("")}>Limpiar Búsqueda</Button>
                           </div>
                        ) : (
                           <div className={"grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"}>
                              {filteredForms.map((form) => (
                                 <FormCard
                                    key={form.id}
                                    form={form}
                                    permisos={permisos}
                                    onSelect={(f) => console.log("Seleccionado:", f.title)}
                                 />
                              ))}
                           </div>
                        )}
                     </>
                  )}
               </div>

               {/* Paginación - RESPONSIVE */}
               {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 py-8">
                     <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 1}
                        iconName="ChevronLeft"
                     >
                        Anterior
                     </Button>
                     <span className="text-sm font-semibold px-4 py-2 bg-muted rounded-lg">
                        {currentPage} / {totalPages}
                     </span>
                     <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage === totalPages}
                        iconName="ChevronRight"
                        iconPosition="right"
                     >
                        Siguiente
                     </Button>
                  </div>
               )}
            </div>
         </main>
      </div>
   );
};

export default FormCenter;