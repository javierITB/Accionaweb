import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import RequestCard from './components/RequestCard';
import FilterPanel from './components/FilterPanel';
import RequestDetails from './components/RequestDetails';
import StatsOverview from './components/StatsOverview';

const RequestTracking = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const formId = urlParams?.get('id');

  // ESTADOS DEL SIDEBAR
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Estados de la Aplicación
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [resp, setResp] = useState([]);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [isLoading, setIsLoading] = useState(false);

  // --- NUEVOS ESTADOS DE PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 30; // Máximo de solicitudes por página

  const [filters, setFilters] = useState({
    search: '',
    status: '', // Se mantiene como string para filtro único
    category: '',
    dateRange: '',
    startDate: '',
    endDate: '',
    company: '',
    submittedBy: ''
  });

  // EFECTO DE RESIZE
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileScreen(isMobile);

      if (isMobile) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobileScreen) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsDesktopOpen(!isDesktopOpen);
    }
  };

  const removeUrlParameter = () => {
    // 1. Obtiene la URL actual y la elimina de la historia del navegador
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('id');

    // 2. Usa history.replaceState para actualizar la URL sin recargar
    window.history.replaceState({}, document.title, currentUrl.pathname + currentUrl.search);
  };


  const handleCloseRequestDetails = () => {
    setShowRequestDetails(false);
    setSelectedRequest(null); // Limpiar la solicitud seleccionada
    removeUrlParameter();    // Eliminar el parámetro 'id' de la URL
  };

  const handleNavigation = (path) => {
    if (isMobileScreen) {
      setIsMobileOpen(false);
    }
    console.log(`Navegando a: ${path}`);
  };

  const updateRequest = (updatedRequest) => {
    setResp(prevResp =>
      prevResp.map(req =>
        req._id === updatedRequest._id ? updatedRequest : req
      )
    );
    setSelectedRequest(updatedRequest);
  };

  useEffect(() => {
    if (!formId || resp.length === 0) return;

    const found = resp.find(
      (r) => String(r._id) === formId || String(r.formId) === formId
    );

    if (found) {
      setSelectedRequest(found);
      setShowRequestDetails(true);
    }
  }, [formId, resp]);

  useEffect(() => {
    // 1. Definimos la función con la lógica (fuera del intervalo)
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const resResp = await apiFetch(`${API_BASE_URL}/soporte/mini`);

        if (!resResp.ok) {
          throw new Error('Error al obtener datos del servidor');
        }

        const responses = await resResp.json();

        const normalized = responses.map(r => {
          return {
            _id: r._id,
            formId: r.formId,
            title: r.title || r.formTitle || "formulario",
            submittedAt: r.submittedAt || r.createdAt || null,
            createdAt: r.createdAt,
            reviewedAt: r.reviewedAt,
            approvedAt: r.approvedAt,
            finalizedAt: r.finalizedAt,
            formTitle: r.formTitle,
            status: r.status,
            trabajador: r.trabajador,
            rutTrabajador: r.rutTrabajador,
            submittedBy: r.user?.nombre || 'Usuario Desconocido',
            lastUpdated: r.updatedAt || null,
            assignedTo: r.updatedAt || " - ",
            hasMessages: false,
            company: r.user?.empresa || 'desconocida'
          };
        });

        setResp(normalized);

      } catch (err) {
        console.error('Error cargando formularios:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);

  }, []);

  const mockStats = {
    total: resp?.length || 0,
    pending: resp?.filter(r => r.status === 'pendiente')?.length || 0,
    inReview: resp?.filter(r => r.status === 'en_revision')?.length || 0,
    approved: resp?.filter(r => r.status === 'aprobado')?.length || 0,
    rejected: resp?.filter(r => r.status === 'firmado')?.length || 0, // Ajustado 'rechazado' a 'firmado' según tu StatsOverview
    finalized: resp?.filter(r => r.status === 'finalizado')?.length || 0,
    archived: resp?.filter(r => r.status === 'archivado')?.length || 0,
  };

  // --- NUEVA LÓGICA: Manejo de filtro desde las tarjetas de estadísticas ---
  const handleStatusFilter = (statusValue) => {
    // Si es null (click en tarjeta Total), limpiamos el filtro de estado
    if (statusValue === null) {
      setFilters(prev => ({ ...prev, status: '' }));
    } else {
      setFilters(prev => ({
        ...prev,
        // Toggle: Si ya está seleccionado, lo quitamos. Si no, lo ponemos.
        status: prev.status === statusValue ? '' : statusValue
      }));
    }
    setCurrentPage(1); // Resetear a la página 1 al cambiar el filtro
  };

  // --- LÓGICA DE FILTRADO (Ahora con useMemo para optimización) ---
  const filteredRequests = useMemo(() => {
    // Es buena práctica revertir el array antes de filtrar para que el nuevo aparezca primero
    // Y luego aplicar el filtro
    const requestsToFilter = [...resp].reverse();

    return requestsToFilter.filter(request => {
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch =
          request?.title?.toLowerCase()?.includes(searchTerm) ||
          request?.company?.toLowerCase()?.includes(searchTerm) ||
          request?.submittedBy?.toLowerCase()?.includes(searchTerm) ||
          request?.trabajador?.toLowerCase()?.includes(searchTerm) ||
          request?.rutTrabajador?.toLowerCase()?.includes(searchTerm) ||
          request?.userEmail?.toLowerCase()?.includes(searchTerm) ||
          request?._id?.toLowerCase()?.includes(searchTerm) ||
          request?.detalles?.toLowerCase()?.includes(searchTerm) ||
          request?.searchData?.includes(searchTerm);

        if (!matchesSearch) return false;
      }

      // Filtro de Status
      // Si el filtro de estado está vacío, mostramos todos (incluyendo 'archivado' si no hay otro filtro)
      if (filters?.status) {
        if (request?.status !== filters?.status) return false;
      } else {
        // Por defecto, si no hay filtro de estado, no mostramos 'archivado'
        if (request.status === 'archivado') return false;
      }


      if (filters?.category) {
        const requestCategory = request?.form?.category || '';
        if (requestCategory.toLowerCase() !== filters.category.toLowerCase()) return false;
      }

      if (filters?.company && (!request?.company || !request?.company?.toLowerCase()?.includes(filters?.company?.toLowerCase()))) {
        return false;
      }

      if (filters?.submittedBy && (!request?.submittedBy || !request?.submittedBy?.toLowerCase()?.includes(filters?.submittedBy?.toLowerCase()))) {
        return false;
      }

      const requestDate = new Date(request.submittedAt || request.createdAt);

      if (filters?.dateRange) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startPeriod, endPeriod;

        switch (filters.dateRange) {
          case 'today':
            startPeriod = new Date(today);
            endPeriod = new Date(today);
            endPeriod.setHours(23, 59, 59, 999);
            break;
          case 'week':
            startPeriod = new Date(today);
            startPeriod.setDate(today.getDate() - today.getDay());
            endPeriod = new Date(today);
            endPeriod.setDate(today.getDate() + (6 - today.getDay()));
            endPeriod.setHours(23, 59, 59, 999);
            break;
          case 'month':
            startPeriod = new Date(today.getFullYear(), today.getMonth(), 1);
            endPeriod = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            endPeriod.setHours(23, 59, 59, 999);
            break;
          case 'quarter':
            const quarter = Math.floor(today.getMonth() / 3);
            startPeriod = new Date(today.getFullYear(), quarter * 3, 1);
            endPeriod = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
            endPeriod.setHours(23, 59, 59, 999);
            break;
          case 'year':
            startPeriod = new Date(today.getFullYear(), 0, 1);
            endPeriod = new Date(today.getFullYear(), 11, 31);
            endPeriod.setHours(23, 59, 59, 999);
            break;
          default:
            startPeriod = null;
            endPeriod = null;
        }

        if (startPeriod && endPeriod && (requestDate < startPeriod || requestDate > endPeriod)) {
          return false;
        }
      }

      if (filters?.startDate) {
        const startDate = new Date(filters.startDate);
        if (requestDate < startDate) return false;
      }

      if (filters?.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (requestDate > endDate) return false;
      }

      return true;
    });
  }, [resp, filters]); // Se recalcula si resp o filters cambian

  const handleRemove = async (request) => {
    const requestId = request?._id
    if (!requestId) return alert("ID no válido para eliminar.");

    const confirmDelete = window.confirm("¿Seguro que deseas eliminar esta solicitud?");
    if (!confirmDelete) return;

    try {
      setIsLoading(true);
      const res = await apiFetch(`${API_BASE_URL}/soporte/${requestId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar la solicitud.');

      setResp((prev) => prev.filter((r) => r._id !== requestId));

    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar la solicitud.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowRequestDetails(true);
  };



  const handleClearFilters = () => {
    setFilters({
      search: '',
      trabajador: '',
      rutTrabajador: '',
      status: '',
      category: '',
      dateRange: '',
      startDate: '',
      endDate: '',
      company: '',
      submittedBy: ''
    });
    setCurrentPage(1); // Resetear a la página 1 al limpiar filtros
  };

  // --- LÓGICA DE PAGINACIÓN ---

  // Calcula el total de páginas
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);

  // Calcula los índices de inicio y fin para la página actual
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;

  // Aplica la paginación para obtener las solicitudes actuales a mostrar
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);

  // Funciones para cambiar de página
  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const nextPage = () => paginate(currentPage + 1);
  const prevPage = () => paginate(currentPage - 1);


  const mainMarginClass = isMobileScreen
    ? 'ml-0'
    : isDesktopOpen ? 'lg:ml-64' : 'lg:ml-16';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* SIDEBAR - RESPONSIVE */}
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
              className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
              onClick={toggleSidebar}
            ></div>
          )}
        </>
      )}

      {/* BOTÓN FLOTANTE MÓVIL */}
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

      {/* CONTENIDO PRINCIPAL */}
      <main className={`transition-all duration-300 ${mainMarginClass} pt-24 lg:pt-20`}>
        <div className="px-4 sm:px-6 lg:p-6 space-y-4 lg:space-y-6 max-w-7xl mx-auto">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="min-w-0 flex-1 mb-3 md:mb-0">
              <div className="flex flex-col">
                {/* Contenedor del Título y el Badge alineados */}
                <div className="flex items-center gap-3">
                  {/* Badge Circular */}
                  <span className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-accent text-accent-foreground shadow-sm">
                    {filteredRequests.length}
                  </span>

                  {/* Título */}
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                    Administración de Tickets
                  </h1>
                </div>

                {/* Subtítulo (opcional, para que quede igual a tu foto) */}
                <p className="text-muted-foreground mt-1 text-sm lg:text-base ml-11">
                  Gestiona todos los tickets de soporte de los usuarios
                </p>
              </div>
            </div>

            {/* BOTONES DE CONTROL (Paginación + Vista) */}
            <div className="hidden lg:flex items-center space-x-4">

              {/* CONTROL DE PAGINACIÓN */}
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
              </div>

              {/* VISTA GRID/LISTA */}
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Vista:</span>
                <div className="flex items-center border border-border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    iconName="Grid3X3"
                    iconSize={14}
                    className="rounded-r-none px-2 sm:px-3"
                  />
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    iconName="List"
                    iconSize={14}
                    className="rounded-l-none border-l px-2 sm:px-3"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* STATS OVERVIEW (Ahora con filtros) */}
          <StatsOverview
            stats={mockStats}
            allForms={resp}
            filters={filters} // Pasamos los filtros actuales
            onFilterChange={handleStatusFilter} // Pasamos la función de cambio
          />

          {/* FILTER PANEL */}
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={handleClearFilters}
            isVisible={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
          />

          {/* LISTA DE SOLICITUDES (PAGINADAS) */}
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6'
              : 'space-y-2 lg:space-y-4 '
          }>
            {isLoading && (
              <div className="text-center py-8 lg:py-12 col-span-full">
                <Icon name="Loader2" size={32} className="mx-auto mb-3 lg:mb-4 text-accent animate-spin" />
                <h3 className="text-lg font-semibold text-foreground">Cargando Solicitudes...</h3>
              </div>
            )}

            {!isLoading && currentRequests?.length > 0 ? (
              currentRequests?.map((request) => (
                <RequestCard
                  key={request?._id || request?.id}
                  request={request}
                  onRemove={handleRemove}
                  onViewDetails={handleViewDetails}
                  viewMode={viewMode}
                />
              ))
            ) : (
              !isLoading && (
                <div className="text-center py-8 lg:py-12 bg-card border border-border rounded-lg col-span-full">
                  <Icon name="Search" size={32} className="mx-auto mb-3 lg:mb-4 text-muted-foreground opacity-50 sm:w-12 sm:h-12" />
                  <h3 className="text-base lg:text-lg font-semibold text-foreground mb-2">No se encontraron solicitudes</h3>
                  <p className="text-muted-foreground mb-4 text-sm lg:text-base px-4">
                    Intenta ajustar los filtros o crear una nueva solicitud
                  </p>
                </div>
              ))}
          </div>

          {/* CONTROL DE PAGINACIÓN INFERIOR (Opcional) */}
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

      {/* MODALES */}
      {/* MODALES */}
      <RequestDetails
        request={selectedRequest}
        isVisible={showRequestDetails}
        onClose={handleCloseRequestDetails}
        onUpdate={updateRequest}
      />
    </div>
  );
};

export default RequestTracking;