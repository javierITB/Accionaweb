import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import RequestCard from './components/RequestCard';
import TimelineView from './components/TimelineView';
import FilterPanel from './components/FilterPanel';
import MessageModal from './components/MessageModal';
import RequestDetails from './components/RequestDetails';
import StatsOverview from './components/StatsOverview';

const RequestTracking = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const formId = urlParams?.get('id');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
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
    priority: '',
    dateRange: '',
    startDate: '',
    endDate: '',
    company: '',
    submittedBy: ''
  });

  // FUNCIÓN updateRequest CORRECTAMENTE UBICADA
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
          fetch('http://192.168.0.2:4000/api/respuestas/'),
          fetch('http://192.168.0.2:4000/api/forms/'),
          fetch('http://192.168.0.2:4000/api/generador/docxs')
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

          return {
            _id: r._id,
            formId: r.formId,
            title: r.title || (matchedForm ? matchedForm.title : ''),
            responses: r.responses || {},
            submittedAt: r.submittedAt || r.createdAt || null,
            createdAt: r.createdAt || null,
            updatedAt: r.updatedAt || null,
            status: r.status || 'pendiente',
            IDdoc: matchedDoc?.IDdoc,
            docxStatus: matchedDoc?.estado,
            docxCreatedAt: matchedDoc?.createdAt,
            submittedBy: r.user?.nombre || r.user?.email || 'Usuario Desconocido',
            lastUpdated: r.updatedAt || matchedForm?.updatedAt || null,
            assignedTo: r.updatedAt || " - ",
            hasMessages: false,
            company: r.user?.empresa || 'desconocida',
            form: matchedForm
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

  // Mock stats data
  const mockStats = {
    total: resp?.length || 0,
    pending: resp?.filter(r => r.status === 'pendiente')?.length || 0,
    inReview: resp?.filter(r => r.status === 'en_revision')?.length || 0,
    approved: resp?.filter(r => r.status === 'aprobado')?.length || 0,
    rejected: resp?.filter(r => r.status === 'rechazado')?.length || 0,
    avgProcessingTime: 5.2
  };

  // Filter and sort requests - SIN la función updateRequest dentro
  const filteredRequests = resp?.filter(request => {
    // Search filter
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch =
        request?.title?.toLowerCase()?.includes(searchTerm) ||
        request?.company?.toLowerCase()?.includes(searchTerm) ||
        request?.submittedBy?.toLowerCase()?.includes(searchTerm) ||
        request?._id?.toLowerCase()?.includes(searchTerm);

      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters?.status && request?.status !== filters?.status) return false;

    // Category filter
    if (filters?.category) {
      const requestCategory = request?.form?.section || request?.form?.title || '';
      if (requestCategory.toLowerCase() !== filters.category.toLowerCase()) return false;
    }

    // Priority filter
    if (filters?.priority && request?.priority !== filters?.priority) return false;

    // Company filter
    if (filters?.company && (!request?.company || !request?.company?.toLowerCase()?.includes(filters?.company?.toLowerCase()))) {
      return false;
    }

    // Submitted by filter
    if (filters?.submittedBy && (!request?.submittedBy || !request?.submittedBy?.toLowerCase()?.includes(filters?.submittedBy?.toLowerCase()))) {
      return false;
    }

    // Date filtering
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
        aValue = a?.status || '';
        bValue = b?.status || '';
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder?.[a?.priority] || 0;
        bValue = priorityOrder?.[b?.priority] || 0;
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
      const res = await fetch(`http://192.168.0.2:4000/api/respuestas/${requestId}`, {
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
      priority: '',
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
    { value: 'status', label: 'Estado' },
    { value: 'priority', label: 'Prioridad' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} pt-16`}>
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Seguimiento de Solicitudes</h1>
              <p className="text-muted-foreground mt-1">
                Monitorea el estado de todas tus solicitudes con cronología detallada
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                iconName={sidebarCollapsed ? "PanelLeftOpen" : "PanelLeftClose"}
                iconSize={20}
              />
            </div>
          </div>

          {/* Stats Overview */}
          <StatsOverview stats={mockStats} />

          {/* Filters */}
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={handleClearFilters}
            isVisible={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
          />

          {/* Controls */}
          <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Vista:</span>
                <div className="flex items-center border border-border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    iconName="Grid3X3"
                    iconSize={16}
                    className="rounded-r-none"
                  />
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    iconName="List"
                    iconSize={16}
                    className="rounded-l-none border-l"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e?.target?.value)}
                  className="px-3 py-1 border border-border rounded-md text-sm bg-input text-foreground"
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
                  iconSize={16}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Icon name="FileText" size={16} />
              <span>{filteredRequests?.length} solicitudes encontradas</span>
            </div>
          </div>

          {/* Requests List */}
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
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
              <div className="text-center py-12 bg-card border border-border rounded-lg col-span-full">
                <Icon name="Search" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron solicitudes</h3>
                <p className="text-muted-foreground mb-4">
                  Intenta ajustar los filtros o crear una nueva solicitud
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
        formId={formId}
      />
      <RequestDetails
        request={selectedRequest}
        isVisible={showRequestDetails}
        onClose={() => setShowRequestDetails(false)}
        onUpdate={updateRequest} // ← AHORA SÍ ESTÁ DISPONIBLE
      />
    </div>
  );
};

export default RequestTracking;