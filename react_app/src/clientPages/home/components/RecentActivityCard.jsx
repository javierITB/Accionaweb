import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import RequestCard from './components/RequestCard';
import FilterPanel from './components/FilterPanel';
import MessageModal from './components/MessageModal';
import RequestDetails from './components/RequestDetails';
import { apiFetch, API_BASE_URL } from '../../../utils/api';

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

        const [resResp, resForms] = await Promise.all([
          apiFetch(`${API_BASE_URL}/respuestas/mail/${mail}`),
          apiFetch(`${API_BASE_URL}/forms`)
        ]);

        console.log('RecentActivityCard - Fetch Status:', {
          resp: resResp.status,
          forms: resForms.status
        });

        if (!resResp.ok || !resForms.ok) {
          throw new Error('Error al obtener datos del servidor');
        }

        // 2) Convertir a JSON
        const responsesRaw = await resResp.json(); // lista de respuestas
        const responses = Array.isArray(responsesRaw) ? responsesRaw : (responsesRaw.respuestas || responsesRaw.data || []);

        const forms = await resForms.json();    // lista de formularios

        console.log('RecentActivityCard - Data:', {
          responsesCount: responses.length,
          formsCount: forms.length
        });

        // 3) Construir mapa de forms para lookup rápido (mapeamos _id e id si existen)
        const formsMap = new Map();
        forms.forEach(f => {
          const keyA = f._id ? String(f._id) : null;
          const keyB = f.id ? String(f.id) : null;
          if (keyA) formsMap.set(keyA, f);
          if (keyB) formsMap.set(keyB, f);
        });

        // 4) Normalizar responses uniendo con su form
        const responsesList = responses;

        const normalizedResponses = responsesList.map(r => {
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
            status: r.status || 'pendiente',
            correctedFile: r.correctedFile,
            formTitle: r.formTitle,
            trabajador: r.trabajador,
            // tus campos normalizados/auxiliares
            submittedBy: r.user?.nombre || r.submittedBy || 'Usuario',
            company: r.user?.empresa || 'Empresa',
            lastUpdated: r.updatedAt || matchedForm?.updatedAt || null,
            assignedTo: r.trabajador || " - ",
            hasMessages: false,

            // aquí va el objeto form asociado (o null si no se encuentra)
            form: matchedForm,
            type: 'form_response'
          };
        });


        // 5) Actualizar estados (SOLO RESPUESTAS)
        setAllForms(forms);
        setResp(normalizedResponses);

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
    // Búsqueda general
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableFields = [
        request?.title,
        request?.description,
        request?.id,
        request?.trabajador,
        request?.formTitle,
      ];

      const hasMatch = searchableFields.some(field =>
        field && field.toString().toLowerCase().includes(searchTerm)
      );

      if (!hasMatch) return false;
    }

    if (filters?.status && request?.status !== filters?.status) return false;
    if (filters?.category && request?.category !== filters?.category) return false;
    if (filters?.priority && request?.priority !== filters?.priority) return false;

    // Filtro por período (dateRange)
    if (filters?.dateRange) {
      const requestDate = new Date(request.submittedAt || request.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let startDate = new Date();
      let endDate = new Date();

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(today);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - today.getDay() + 1);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'quarter':
          const quarter = Math.floor(today.getMonth() / 3);
          startDate = new Date(today.getFullYear(), quarter * 3, 1);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'year':
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          break;
      }

      if (filters.dateRange !== '') {
        if (requestDate < startDate || requestDate > endDate) return false;
      }
    }

    // Filtro por fechas específicas (startDate y endDate)
    if (filters?.startDate) {
      const requestDate = new Date(request.submittedAt || request.createdAt);
      const startDate = new Date(filters.startDate);
      if (requestDate < startDate) return false;
    }
    if (filters?.endDate) {
      const requestDate = new Date(request.submittedAt || request.createdAt);
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
    });
  };

  const sortOptions = [
    { value: 'date', label: 'Fecha' },
    { value: 'title', label: 'Título' },
    { value: 'status', label: 'Estado' },
    { value: 'priority', label: 'Prioridad' }
  ];

  return (
    <div className="bg-card rounded-xl shadow-brand border border-border  w-full">
      {/* Header - Responsive */}
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Mis Solicitudes</h2>
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
          {filteredRequests?.length > 0 && (
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
          )}
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