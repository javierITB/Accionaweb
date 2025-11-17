import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import RequestCard from './components/RequestCard';
import FilterPanel from './components/FilterPanel';
import MessageModal from './components/MessageModal';
import RequestDetails from './components/RequestDetails';

const RequestTracking = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const formId = urlParams?.get('id');

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [forms, setAllForms] = useState([]);
  const [resp, setResp] = useState([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [messageRequest, setMessageRequest] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(false);
  const mail = sessionStorage.getItem("email");
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    priority: '',
    dateRange: '',
    startDate: '',
    endDate: '',
    assignedTo: '',
    submittedBy: '',
    description: ''
  });

  //buscar id de respuesta que se busca abrir
  useEffect(() => {
    if (!formId || resp.length === 0) return; // esperar a que carguen los datos

    // Buscar el request que tenga el mismo _id o formId
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

        // 1) Traer ambas colecciones en paralelo
        const [resResp, resForms] = await Promise.all([
          fetch(`https://accionaweb.vercel.app/api/respuestas/mail/${mail}`),
          fetch('https://accionaweb.vercel.app/api/forms/')
        ]);

        if (!resResp.ok || !resForms.ok) {
          throw new Error('Error al obtener datos del servidor');
        }

        // 2) Convertir a JSON
        const responses = await resResp.json(); // lista de respuestas
        const forms = await resForms.json();    // lista de formularios

        // 3) Construir mapa de forms para lookup rápido (mapeamos _id e id si existen)
        const formsMap = new Map();
        forms.forEach(f => {
          const keyA = f._id ? String(f._id) : null;
          const keyB = f.id ? String(f.id) : null;
          if (keyA) formsMap.set(keyA, f);
          if (keyB) formsMap.set(keyB, f);
        });

        // 4) Normalizar responses uniendo con su form
        const normalized = responses.map(r => {
          const formIdKey = r.formId ? String(r.formId) : null;
          const matchedForm = formIdKey ? formsMap.get(formIdKey) || null : null;

          return {
            // campos originales de la respuesta - INCLUIR TODOS LOS CAMPOS
            _id: r._id,
            formId: r.formId,
            title: r.title || (matchedForm ? matchedForm.title : ''),
            responses: r.responses || {},
            submittedAt: r.submittedAt || r.createdAt || null,
            createdAt: r.createdAt || null,
            updatedAt: r.updatedAt || null,

            // ESTOS CAMPOS SON CRÍTICOS - INCLUIRLOS
            status: r.status || 'pendiente', // ← ESTE ES EL QUE FALTA
            correctedFile: r.correctedFile, // ← Y ESTE TAMBIÉN
            formTitle: r.formTitle, // ← Y ESTE PARA EL NOMBRE DEL FORMULARIO

            // tus campos normalizados/auxiliares
            submittedBy: r.user?.nombre || r.submittedBy || 'Usuario',
            company: r.user?.empresa || 'Empresa',
            lastUpdated: r.updatedAt || matchedForm?.updatedAt || null,
            assignedTo: r.updatedAt || " - ",
            hasMessages: false,

            // aquí va el objeto form asociado (o null si no se encuentra)
            form: matchedForm
          };
        });

        // 5) Actualizar estados
        setAllForms(forms);    // lista de formularios tal cual vino del backend
        setResp(normalized);   // respuestas ya unidas con su form

      } catch (err) {
        console.error('Error cargando formularios:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForms();
  }, []);

  // Filter and sort requests
  const filteredRequests = resp?.filter(request => {
    if (filters?.search && !request?.title?.toLowerCase()?.includes(filters?.search?.toLowerCase()) &&
      !request?.description?.toLowerCase()?.includes(filters?.search?.toLowerCase()) &&
      !request?.id?.toLowerCase()?.includes(filters?.search?.toLowerCase())) {
      return false;
    }
    if (filters?.status && request?.status !== filters?.status) return false;
    if (filters?.category && request?.category !== filters?.category) return false;
    if (filters?.priority && request?.priority !== filters?.priority) return false;
    if (filters?.assignedTo && (!request?.assignedTo || !request?.assignedTo?.toLowerCase()?.includes(filters?.assignedTo?.toLowerCase()))) return false;
    if (filters?.submittedBy && !request?.submittedBy?.toLowerCase()?.includes(filters?.submittedBy?.toLowerCase())) return false;

    // Date filtering
    if (filters?.startDate) {
      const requestDate = new Date(request.submittedDate);
      const startDate = new Date(filters.startDate);
      if (requestDate < startDate) return false;
    }
    if (filters?.endDate) {
      const requestDate = new Date(request.submittedDate);
      const endDate = new Date(filters.endDate);
      if (requestDate > endDate) return false;
    }

    return true;
  })?.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'date':
        aValue = new Date(a.submittedDate);
        bValue = new Date(b.submittedDate);
        break;
      case 'title':
        aValue = a?.title?.toLowerCase();
        bValue = b?.title?.toLowerCase();
        break;
      case 'status':
        aValue = a?.status;
        bValue = b?.status;
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder?.[a?.priority];
        bValue = priorityOrder?.[b?.priority];
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

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowRequestDetails(true);
  };

  const handleSendMessage = (request) => {
    setMessageRequest(request);
    setShowMessageModal(true);
  };

  const handleSendMessageSubmit = async (messageData) => {
    // Mock API call
    console.log('Sending message:', messageData);
    // In real app, this would send to API
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      category: '',
      priority: '',
      dateRange: '',
      startDate: '',
      endDate: '',
      assignedTo: '',
      submittedBy: ''
    });
  };

  const sortOptions = [
    { value: 'date', label: 'Fecha' },
    { value: 'title', label: 'Título' },
    { value: 'status', label: 'Estado' },
    { value: 'priority', label: 'Prioridad' }
  ];

  return (
    <div className="bg-card rounded-xl shadow-brand border border-border mt-6 lg:mt-8 w-full">
      {/* Header - Responsive */}
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Actividad Reciente</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Últimas respuestas a formularios
            </p>
          </div>
          <Icon name="Activity" size={20} className="text-accent flex-shrink-0 ml-4 sm:w-6 sm:h-6" />
        </div>
      </div>
      
      <main className={``}>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

          {/* Filters */}
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={handleClearFilters}
            isVisible={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
          />

          {/* Controls - MEJORADO PARA MÓVIL */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-card border border-border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-0">
            <div className="flex flex-col xs:flex-row xs:items-center space-y-2 xs:space-y-0 xs:space-x-4">
              {/* View Mode Toggle */}
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

              {/* Sort Controls */}
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
                  className="w-8 h-8 sm:w-9 sm:h-9"
                />
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground justify-center sm:justify-end">
              <Icon name="FileText" size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{filteredRequests?.length} solicitudes encontradas</span>
            </div>
          </div>

          {/* Requests List - RESPONSIVE GRID */}
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'
              : 'space-y-4'
          }>
            {filteredRequests?.length > 0 ? (
              filteredRequests?.map((request) => (
                <RequestCard
                  key={request?._id || request?.id}
                  request={request}
                  onViewDetails={handleViewDetails}
                  onSendMessage={handleSendMessage}
                  viewMode={viewMode}
                />
              ))
            ) : (
              <div className="text-center py-8 sm:py-12 bg-card border border-border rounded-lg col-span-full">
                <Icon name="Search" size={32} className="mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50 sm:w-12 sm:h-12" />
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">No se encontraron solicitudes</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 px-4">
                  Intenta ajustar los filtros o rellenar un primer formulario
                </p>
              </div>
            )}
          </div>

          {/* Timeline View */}
          {showTimeline && selectedRequest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-card border border-border rounded-lg shadow-brand-active w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-card border-b border-border p-4 sm:p-6 z-10">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-xl font-semibold text-foreground">Cronología de la Solicitud</h2>
                      <p className="text-sm text-muted-foreground truncate">{selectedRequest?.title}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowTimeline(false)}
                      iconName="X"
                      iconSize={18}
                      className="flex-shrink-0 ml-4"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Modals */}
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        request={messageRequest}
        onSendMessage={handleSendMessageSubmit}
      />
      <RequestDetails
        request={selectedRequest}
        isVisible={showRequestDetails}
        onClose={() => setShowRequestDetails(false)}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default RequestTracking;