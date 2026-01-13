import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

// Usar componentes locales de Domicilio Virtual
import RequestCard from './components/RequestCard';
import FilterPanel from './components/FilterPanel';
import RequestDetails from './components/RequestDetails';
import StatsOverview from './components/StatsOverview';

const DomicilioVirtualIndex = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams?.get('id');

    // --- ESTADOS DE UI (Mantener idénticos) ---
    const [isDesktopOpen, setIsDesktopOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobileScreen, setIsMobileScreen] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);

    // --- ESTADOS DE DATOS (Mantener idénticos) ---
    const [resp, setResp] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showRequestDetails, setShowRequestDetails] = useState(false);

    // --- ESTADOS DE PAGINACIÓN Y FILTROS ---
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [archivedCountServer, setArchivedCountServer] = useState(0);
    const [serverStats, setServerStats] = useState(null);
    const requestsPerPage = 30;

    const loadedPages = useRef(new Set());

    // CAMBIO 1: Añadido 'submittedBy' para que el FilterPanel pueda controlarlo
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        category: '',
        dateRange: '',
        startDate: '',
        endDate: '',
        company: '',     // Este es el RUT
        submittedBy: ''  // Nuevo campo para el nombre
    });

    // --- EFECTOS DE REDIMENSIONAMIENTO (Sin cambios) ---
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

    // --- LÓGICA DE CARGA DE DATOS ---
    const fetchData = async (pageNumber, isBackground = false, overrideFilters = filters) => {
        if (isBackground && loadedPages.current.has(pageNumber)) return;

        try {
            if (!isBackground) setIsLoading(true);

            const endpoint = 'domicilio-virtual/mini';

            // CAMBIO 2: Incluir submittedBy en los parámetros enviados a la API
            const params = new URLSearchParams({
                page: pageNumber,
                limit: requestsPerPage,
                search: overrideFilters.search || '',
                status: overrideFilters.status || '',
                company: overrideFilters.company || '', 
                submittedBy: overrideFilters.submittedBy || '', // Nuevo parámetro
                startDate: overrideFilters.startDate || '',
                endDate: overrideFilters.endDate || ''
            });

            const url = `${API_BASE_URL}/${endpoint}?${params.toString()}`;
            const res = await apiFetch(url);

            if (!res.ok) throw new Error('Error al obtener datos');
            const result = await res.json();

            if (result.archivedTotal !== undefined) setArchivedCountServer(result.archivedTotal);
            if (result.stats) setServerStats(result.stats);

            // CAMBIO 3: Mantenemos tu lógica de normalización pero aseguramos el mapeo correcto
            const normalized = result.data.map(r => ({
                _id: r._id,
                formId: r.formId,
                title: r.formTitle || "Formulario",
                formTitle: r.formTitle,
                description: "Domicilio Virtual",
                submittedAt: r.submittedAt || r.createdAt || null,
                createdAt: r.createdAt,
                status: r.status,
                tuNombre: r.tuNombre || "",
                rutEmpresa: r.rutEmpresa || "",
                // Asignamos para que la RequestCard los muestre bien
                submittedBy: r.tuNombre || 'Sin nombre',
                company: r.rutEmpresa || 'Sin RUT',      
                hasMessages: r.adjuntosCount > 0,
                updatedAt: r.updatedAt
            }));

            setResp(prev => {
                const combined = (pageNumber === 1 && !isBackground)
                    ? normalized
                    : [...prev, ...normalized];
                const unique = Array.from(new Map(combined.map(item => [item._id, item])).values());
                return unique.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            });

            setTotalPages(result.pagination.totalPages);
            setTotalItems(result.pagination.total);
            loadedPages.current.add(pageNumber);

        } catch (err) {
            console.error(`Error en fetch:`, err);
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    };

    // --- EFECTOS DE CONTROL (Sin cambios de lógica) ---
    useEffect(() => { fetchData(1); }, []);
    useEffect(() => { if (currentPage > 1) fetchData(currentPage); }, [currentPage]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (filters.status !== 'archivado') fetchData(1, true);
        }, 45000);
        return () => clearInterval(interval);
    }, [filters.status]);

    useEffect(() => {
        if (!formId || resp.length === 0) return;
        const found = resp.find(r => String(r._id) === formId || String(r.formId) === formId);
        if (found) {
            setSelectedRequest(found);
            setShowRequestDetails(true);
        }
    }, [formId, resp]);

    const handleApplyFilters = () => {
        setResp([]);
        loadedPages.current.clear();
        setCurrentPage(1);
        fetchData(1);
    };

    const handleStatusFilter = (status) => {
        const newStatus = filters.status === status ? '' : status;
        const newFilters = { ...filters, status: newStatus };
        setFilters(newFilters);
        setResp([]);
        loadedPages.current.clear();
        setCurrentPage(1);
        fetchData(1, false, newFilters);
    };

    const handleClearFilters = () => {
        // CAMBIO 4: Limpiamos también el campo submittedBy
        const cleared = { 
            search: '', 
            status: '', 
            category: '', 
            dateRange: '', 
            startDate: '', 
            endDate: '', 
            company: '',
            submittedBy: '' 
        };
        setFilters(cleared);
        setResp([]);
        loadedPages.current.clear();
        setCurrentPage(1);
        fetchData(1, false, cleared);
    };

    // --- RESTO DE FUNCIONES (Sin cambios) ---
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
        alert("Funcionalidad de eliminar pendiente de implementación");
    };

    const currentRequests = useMemo(() => resp, [resp]);

    const mockStats = serverStats || {
        total: totalItems,
        pending: resp.filter(r => r.status === 'pendiente').length,
        inReview: resp.filter(r => r.status === 'en_revision').length,
        approved: resp.filter(r => r.status === 'aprobado').length,
        rejected: resp.filter(r => r.status === 'firmado').length,
        finalized: resp.filter(r => r.status === 'finalizado').length,
        archived: archivedCountServer
    };

    const mainMarginClass = isMobileScreen ? 'ml-0' : isDesktopOpen ? 'lg:ml-64' : 'lg:ml-16';

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <Sidebar 
                isCollapsed={!isDesktopOpen} 
                onToggleCollapse={() => setIsDesktopOpen(!isDesktopOpen)} 
                isMobileOpen={isMobileOpen} 
                onNavigate={() => isMobileScreen && setIsMobileOpen(false)} 
            />

            {isMobileScreen && isMobileOpen && (
                <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)}></div>
            )}

            <main className={`transition-all duration-300 ${mainMarginClass} pt-24 lg:pt-20`}>
                <div className="px-4 sm:px-6 lg:p-6 space-y-6 max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center min-w-8 h-8 px-2 rounded-full text-sm font-bold bg-accent text-accent-foreground shadow-sm">
                                {totalItems}
                            </span>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                                Domicilio Virtual
                            </h1>
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
                        {isLoading && resp.length === 0 ? (
                            <div className="col-span-full py-12 text-center">
                                <Icon name="Loader2" size={32} className="mx-auto text-accent animate-spin mb-4" />
                                <p className="text-muted-foreground">Buscando solicitudes...</p>
                            </div>
                        ) : currentRequests.length > 0 ? (
                            currentRequests.map(request => (
                                <RequestCard
                                    key={request._id}
                                    request={request}
                                    onRemove={handleRemove}
                                    onViewDetails={(req) => { setSelectedRequest(req); setShowRequestDetails(true); }}
                                />
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center bg-card border border-border rounded-xl">
                                <Icon name="Search" size={40} className="mx-auto text-muted-foreground opacity-20 mb-4" />
                                <p className="text-muted-foreground">No se encontraron solicitudes</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <RequestDetails
                request={selectedRequest}
                isVisible={showRequestDetails}
                onClose={handleCloseRequestDetails}
                onUpdate={updateRequest}
                endpointPrefix="domicilio-virtual"
            />
        </div>
    );
};

export default DomicilioVirtualIndex;