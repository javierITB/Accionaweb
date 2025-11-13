import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
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

  // ESTADOS DEL SIDEBAR
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  
  // Estados de la Aplicación
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [forms, setAllForms] = useState([]);
  const [resp, setResp] = useState([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [messageRequest, setMessageRequest] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(false);
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
    const fetchForms = async () => {
      try {
        setIsLoading(true);

        const [resResp, resForms, resDocxs] = await Promise.all([
          fetch('https://accionaapi.vercel.app/api/respuestas/'),
          fetch('https://accionaapi.vercel.app/api/forms/'),
          fetch('https://accionaapi.vercel.app/api/generador/docxs')
        ]);

        if (!resResp.ok || !resForms.ok || !resDocxs.ok) {
          throw new Error('Error al obtener datos del servidor');
        }

        const responses = await resResp.json();
        const forms = await resForms.json();
        const docxs = await resDocxs.json();

        const formsMap = new Map();
        forms.forEach(f => {
          const keyA = f._id ? String(f._id) : null;
          const keyB = f.id ? String(f.id) : null;
          if (keyA) formsMap.set(keyA, f);
          if (keyB) formsMap.set(keyB, f);
        });

        const normalized = responses.map(r => {
          const formIdKey = r.formId ? String(r.formId) : null;
          const matchedForm = formIdKey ? formsMap.get(formIdKey) || null : null;

          const matchedDoc = docxs.find(doc =>
            doc.responseId === String(r._id)
          );

          const userName = r.user?.nombre || r.userId?.nombre || 'Usuario Desconocido';
          const userCompany = r.user?.empresa || r.userId?.empresa || 'desconocida';
          const userEmail = r.user?.mail || r.userId?.mail || '';

          return {
            _id: r._id,
            formId: r.formId,
            title: r.title || r.formTitle || (matchedForm ? matchedForm.title : ''),
            responses: r.responses || {},
            adjuntos: r.adjuntos || [],
            submittedAt: r.submittedAt || r.createdAt || null,
            createdAt: r.createdAt || null,
            updatedAt: r.updatedAt || null,
            status: r.status || 'pendiente',

            correctedFile: r.correctedFile,
            formTitle: r.formTitle,
            approvedAt: r.approvedAt,

            IDdoc: matchedDoc?.IDdoc,
            docxStatus: matchedDoc?.estado,
            docxCreatedAt: matchedDoc?.createdAt,
            submittedBy: userName,
            lastUpdated: r.updatedAt || matchedForm?.updatedAt || null,
            assignedTo: r.updatedAt || " - ",
            hasMessages: false,
            company: userCompany,
            userEmail: userEmail,
            form: matchedForm,
            searchData: JSON.stringify(r.responses).toLowerCase()
          };
        });

        setAllForms(forms);
        setResp(normalized);

      } catch (err) {
        console.error('Error cargando formularios:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForms();
  }, []);

  const mockStats = {
    total: resp?.length || 0,
    pending: resp?.filter(r => r.status === 'pendiente')?.length || 0,
    inReview: resp?.filter(r => r.status === 'en_revision')?.length || 0,
    approved: resp?.filter(r => r.status === 'aprobado')?.length || 0,
    rejected: resp?.filter(r => r.status === 'rechazado')?.length || 0,
    avgProcessingTime: 5.2
  };

  const filteredRequests = resp?.filter(request => {
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch =
        request?.title?.toLowerCase()?.includes(searchTerm) ||
        request?.company?.toLowerCase()?.includes(searchTerm) ||
        request?.submittedBy?.toLowerCase()?.includes(searchTerm) ||
        request?.userEmail?.toLowerCase()?.includes(searchTerm) ||
        request?._id?.toLowerCase()?.includes(searchTerm) ||
        request?.detalles?.toLowerCase()?.includes(searchTerm) ||
        request?.searchData?.includes(searchTerm);

      if (!matchesSearch) return false;
    }

    if (filters?.status && request?.status !== filters?.status) return false;

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
  })?.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'date':
        aValue = new Date(a.submittedAt || a.createdAt);
        bValue = new Date(b.submittedAt || b.createdAt);
        break;
      case 'title':
        aValue = a?.title?.toLowerCase();
        bValue = b?.title?.toLowerCase();
        break;
      case 'status':
        aValue = a?.status || '';
        bValue = b?.status || '';
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleRemove = async (request) => {
    const requestId = request?._id
    if (!requestId) return alert("ID no válido para eliminar.");

    const confirmDelete = window.confirm("¿Seguro que deseas eliminar esta solicitud?");
    if (!confirmDelete) return;

    try {
      setIsLoading(true);
      const res = await fetch(`https://accionaapi.vercel.app/api/respuestas/${requestId}`, {
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

  const handleSendMessage = (request) => {
    setMessageRequest(request);
    setShowMessageModal(true);
  };

  const handleSendMessageSubmit = async (messageData) => {
    console.log('Sending message:', messageData);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      category: '',
      dateRange: '',
      startDate: '',
      endDate: '',
      company: '',
      submittedBy: ''
    });
  };

  const sortOptions = [
    { value: 'date', label: 'Fecha' },
    { value: 'title', label: 'Título' },
    { value: 'status', label: 'Estado' }
  ];

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

      {/* BOTÓN FLOTANTE MÓVIL - MEJORADO */}
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

      {/* CONTENIDO PRINCIPAL - RESPONSIVE */}
      <main className={`transition-all duration-300 ${mainMarginClass} pt-16 lg:pt-20`}>
        <div className="px-4 sm:px-6 lg:p-6 space-y-4 lg:space-y-6 max-w-7xl mx-auto">
          
          {/* HEADER - RESPONSIVE */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="min-w-0 flex-1 mb-3 md:mb-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Seguimiento de Solicitudes</h1>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm lg:text-base">
                Monitorea el estado de todas tus solicitudes con cronología detallada
              </p>
            </div>

            {/* BOTÓN SIDEBAR DESKTOP - RESPONSIVE */}
            <div className="hidden lg:flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                iconName={isDesktopOpen ? "PanelLeftClose" : "PanelLeftOpen"}
                iconSize={20}
              />
            </div>
          </div>

          {/* STATS OVERVIEW */}
          <StatsOverview stats={mockStats} allForms={resp} />

          {/* FILTER PANEL */}
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={handleClearFilters}
            isVisible={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
          />

          {/* CONTROLES - RESPONSIVE */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-card border border-border rounded-lg p-3 sm:p-4 space-y-3 md:space-y-0">
            <div className="flex flex-col xs:flex-row xs:items-center space-y-2 xs:space-y-0 xs:space-x-3 sm:space-x-4 w-full md:w-auto">
              {/* VISTA */}
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

              {/* ORDENAR */}
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e?.target?.value)}
                  className="px-2 sm:px-3 py-1 border border-border rounded-md text-xs sm:text-sm bg-input text-foreground min-w-0"
                >
                  {sortOptions?.map(option => (
                    <option key={option?.value} value={option?.value}>
                      {option?.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  iconName={sortOrder === 'asc' ? "ArrowUp" : "ArrowDown"}
                  iconSize={14}
                  className="w-7 h-7 sm:w-8 sm:h-8"
                />
              </div>
            </div>

            {/* CONTADOR - RESPONSIVE */}
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground w-full md:w-auto justify-center md:justify-end">
              <Icon name="FileText" size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{filteredRequests?.length} solicitudes encontradas</span>
            </div>
          </div>

          {/* LISTA DE SOLICITUDES - RESPONSIVE */}
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6'
              : 'space-y-3 lg:space-y-4'
          }>
            {filteredRequests?.length > 0 ? (
              filteredRequests?.map((request) => (
                <RequestCard
                  key={request?._id || request?.id}
                  request={request}
                  onRemove={handleRemove}
                  onViewDetails={handleViewDetails}
                  onSendMessage={handleSendMessage}
                  viewMode={viewMode}
                />
              ))
            ) : (
              <div className="text-center py-8 lg:py-12 bg-card border border-border rounded-lg col-span-full">
                <Icon name="Search" size={32} className="mx-auto mb-3 lg:mb-4 text-muted-foreground opacity-50 sm:w-12 sm:h-12" />
                <h3 className="text-base lg:text-lg font-semibold text-foreground mb-2">No se encontraron solicitudes</h3>
                <p className="text-muted-foreground mb-4 text-sm lg:text-base px-4">
                  Intenta ajustar los filtros o crear una nueva solicitud
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
      
      {/* MODALES */}
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        request={messageRequest}
        onSendMessage={handleSendMessageSubmit}
        formId={formId}
      />
      <RequestDetails
        request={selectedRequest}
        isVisible={showRequestDetails}
        onClose={() => setShowRequestDetails(false)}
        onUpdate={updateRequest}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default RequestTracking;