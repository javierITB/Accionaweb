import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import RequestCard from './components/RequestCard';
import FilterPanel from './components/FilterPanel';
import MessageModal from './components/MessageModal';
import RequestDetails from './components/RequestDetails';
import StatsOverview from './components/StatsOverview';

const RequestTracking = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const formId = urlParams?.get('id');

  // --- ESTADOS DE UI ---
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [viewMode, setViewMode] = useState('grid');
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

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    dateRange: '',
    startDate: '',
    endDate: '',
    company: '',
    submittedBy: ''
  });

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

  // --- EFECTOS DE REDIMENSIONAMIENTO ---
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileScreen(isMobile);
      if (isMobile) setIsMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- FUNCIÓN DE NORMALIZACIÓN ---
  const normalizeData = (data) => {
    return data.map(r => ({
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
      submittedBy: r.user?.nombre || r.submittedBy || 'Usuario Desconocido',
      company: r.user?.empresa || r.company || 'Empresa Desconocida',
      hasMessages: r.adjuntosCount > 0,
      updatedAt: r.updatedAt
    }));
  };

  // --- LÓGICA DE CARGA DE DATOS ---
  const fetchData = async (pageNumber, isBackground = false, overrideFilters = filters) => {
    try {
      if (!isBackground) setIsLoading(true);

      const params = new URLSearchParams({
        page: pageNumber,
        limit: itemsPerPage, // Usar estado dinámico
        search: overrideFilters.search || '',
        status: overrideFilters.status || '',
        company: overrideFilters.company || '',
        submittedBy: overrideFilters.submittedBy || '',
        startDate: overrideFilters.startDate || '',
        endDate: overrideFilters.endDate || ''
      });

      const url = `${API_BASE_URL}/respuestas/filtros?${params.toString()}`;
      const res = await apiFetch(url);

      if (!res.ok) throw new Error('Error al obtener datos');
      const result = await res.json();

      setResp(normalizeData(result.data));
      setTotalPages(result.pagination.totalPages || 1);
      setTotalItems(result.pagination.total || 0);

      if (result.stats) {
        setServerStats(prevStats => {
          const isFilteringByStatus = overrideFilters.status && overrideFilters.status !== '';
          if (isFilteringByStatus && prevStats) return prevStats;
          return result.stats;
        });
      }

      if (!isBackground) window.scrollTo({ top: 0, behavior: 'smooth' });

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
        const found = result.data.find(r => String(r._id) === idToFind || String(r.formId) === idToFind);
        if (found) {
          const normalizedPage = normalizeData(result.data);
          const normalizedTarget = normalizedPage.find(r => String(r._id) === idToFind || String(r.formId) === idToFind);
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
  }, [currentPage, itemsPerPage]); // 

  useEffect(() => {
    if (!formId) return;
    const foundInState = resp.find(r => String(r._id) === formId || String(r.formId) === formId);
    if (foundInState) {
      setSelectedRequest(foundInState);
      setShowRequestDetails(true);
    } else {
      findRequestGlobally(formId);
    }
  }, [formId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (filters.status !== 'archivado') fetchData(currentPage, true);
    }, 45000);
    return () => clearInterval(interval);
  }, [filters.status, currentPage, itemsPerPage]);

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
    const newStatus = filters.status === status ? '' : status;
    const newFilters = { ...filters, status: newStatus };
    setFilters(newFilters);
    setCurrentPage(1);
    fetchData(1, false, newFilters);
  };

  const handleClearFilters = () => {
    const cleared = {
      search: '', status: '', category: '',
      dateRange: '', startDate: '', endDate: '',
      company: '', submittedBy: ''
    };
    setFilters(cleared);
    setCurrentPage(1);
    fetchData(1, false, cleared);
  };

  const updateRequest = (updatedRequest) => {
    setResp(prev => prev.map(req => req._id === updatedRequest._id ? updatedRequest : req));
    setSelectedRequest(updatedRequest);
  };

  const handleCloseRequestDetails = () => {
    setShowRequestDetails(false);
    setSelectedRequest(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.replaceState({}, document.title, url.pathname + url.search);
  };

  const handleRemove = async (request) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta solicitud?")) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/respuestas/${request._id}`, { method: 'DELETE' });
      if (res.ok) setResp(prev => prev.filter(r => r._id !== request._id));
    } catch (err) {
      alert("Error al eliminar.");
    }
  };

  // --- CORRECCIÓN SOLICITADA: Filtrado de archivados en Front ---
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
    archivado: 0
  };

  const mainMarginClass = isMobileScreen ? 'ml-0' : isDesktopOpen ? 'lg:ml-64' : 'lg:ml-16';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar isCollapsed={!isDesktopOpen} onToggleCollapse={() => setIsDesktopOpen(!isDesktopOpen)} isMobileOpen={isMobileOpen} onNavigate={() => isMobileScreen && setIsMobileOpen(false)} />

      {isMobileScreen && isMobileOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)}></div>
      )}

      {!isMobileOpen && isMobileScreen && (
        <div className="fixed bottom-4 left-4 z-50">
          <Button variant="default" size="icon" onClick={() => setIsMobileOpen(true)} iconName="Menu" className="w-12 h-12 rounded-full shadow-lg" />
        </div>
      )}

      <main className={`transition-all duration-300 ${mainMarginClass} pt-24 lg:pt-20`}>
        <div className="px-4 sm:px-6 lg:p-6 space-y-6 max-w-7xl mx-auto">

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center min-w-8 h-8 px-2 rounded-full text-sm font-bold bg-accent text-accent-foreground shadow-sm">
                  {filters.status === 'archivado' ? totalItems : (totalItems - (serverStats?.archivado || 0))}
                </span>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                  Seguimiento de Solicitudes
                </h1>
              </div>
              <p className="text-muted-foreground mt-1 text-sm lg:text-base ml-11">
                {filters.status === 'archivado' ? 'Historial de solicitudes archivadas' : 'Monitorea el estado de tus solicitudes activas'}
              </p>
            </div>

            <div className="flex items-center space-x-4">
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
                    {[15, 30, 45, 60].map(limit => (
                      <button
                        key={limit}
                        onClick={() => handleLimitChange(limit)}
                        className={`w-full text-center py-1 text-sm hover:bg-muted ${itemsPerPage === limit ? 'font-bold text-primary' : 'text-muted-foreground'}`}
                      >
                        {limit}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground border border-border rounded-lg p-1 bg-card">
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || isLoading} iconName="ChevronLeft" />
                <span className="font-medium">{currentPage} / {totalPages}</span>
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || isLoading} iconName="ChevronRight" />
              </div>
              <div className="flex items-center border border-border rounded-lg bg-card">
                <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} iconName="Grid3X3" className="rounded-r-none" />
                <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} iconName="List" className="rounded-l-none border-l" />
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

          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
            {isLoading ? (
              <div className="col-span-full py-12 text-center">
                <Icon name="Loader2" size={32} className="mx-auto text-accent animate-spin mb-4" />
                <p className="text-muted-foreground">Buscando solicitud...</p>
              </div>
            ) : currentRequests.length > 0 ? (
              currentRequests.map(request => (
                <RequestCard
                  key={request._id}
                  request={request}
                  onRemove={handleRemove}
                  onViewDetails={(req) => { setSelectedRequest(req); setShowRequestDetails(true); }}
                  onSendMessage={(req) => { setMessageRequest(req); setShowMessageModal(true); }}
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
            <div className="flex justify-center items-center space-x-4 py-8">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || isLoading}>
                Anterior
              </Button>
              <span className="text-sm font-medium">Página {currentPage} de {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || isLoading}>
                Siguiente
              </Button>
            </div>
          )}
        </div>
      </main>

      <MessageModal isOpen={showMessageModal} onClose={() => setShowMessageModal(false)} request={messageRequest} formId={formId} onSendMessage={console.log} />
      <RequestDetails request={selectedRequest} isVisible={showRequestDetails} onClose={handleCloseRequestDetails} onUpdate={updateRequest} onSendMessage={(req) => { setMessageRequest(req); setShowMessageModal(true); }} />
    </div>
  );
};

export default RequestTracking;