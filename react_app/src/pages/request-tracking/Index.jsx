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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [messageRequest, setMessageRequest] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
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

  // Mock data for requests
  const mockRequests = [
    {
      id: "REQ-2025-001",
      title: "Solicitud de Vacaciones - Febrero 2025",
      description: "Solicitud de 10 días de vacaciones del 8 al 19 de febrero de 2025 para viaje familiar.",
      category: "time_off",
      status: "pending",
      priority: "medium",
      submittedBy: "Sarah Johnson",
      submittedDate: "2025-01-18T09:30:00Z",
      lastUpdated: "2025-01-20T14:15:00Z",
      assignedTo: "María González",
      dueDate: "2025-01-25T17:00:00Z",
      hasMessages: true,
      details: `Estimado equipo de RR.HH.,\n\nSolicito formalmente 10 días de vacaciones del 8 al 19 de febrero de 2025. He coordinado con mi equipo para asegurar la cobertura de mis responsabilidades durante mi ausencia.\n\nMotivo: Viaje familiar planificado con anticipación.\nFechas solicitadas: 8-19 de febrero de 2025\nDías laborales: 10 días\n\nAgradeceré su pronta respuesta para confirmar la aprobación.`
    },
    {
      id: "REQ-2025-002",
      title: "Reembolso de Gastos de Viaje - Conferencia TI",
      description: "Reembolso de gastos de transporte y alojamiento para asistencia a conferencia tecnológica en Santiago.",
      category: "expense",
      status: "approved",
      priority: "low",
      submittedBy: "Carlos Mendoza",
      submittedDate: "2025-01-15T11:20:00Z",
      lastUpdated: "2025-01-19T16:45:00Z",
      assignedTo: "Ana Rodríguez",
      dueDate: null,
      hasMessages: false,
      details: `Solicito el reembolso de los siguientes gastos incurridos durante mi participación en la Conferencia de Tecnología 2025:\n\n- Transporte aéreo: $180.000 CLP\n- Alojamiento (2 noches): $120.000 CLP\n- Alimentación: $45.000 CLP\n\nTotal solicitado: $345.000 CLP\n\nTodos los recibos están adjuntos a esta solicitud.`
    },
    {
      id: "REQ-2025-003",
      title: "Soporte TI - Problema con Acceso al Sistema",
      description: "No puedo acceder al sistema de gestión de proyectos desde hace 2 días. Error de autenticación.",
      category: "it_support",
      status: "in_review",
      priority: "high",
      submittedBy: "Laura Fernández",
      submittedDate: "2025-01-19T08:15:00Z",
      lastUpdated: "2025-01-20T10:30:00Z",
      assignedTo: "Equipo TI",
      dueDate: "2025-01-21T12:00:00Z",
      hasMessages: true,
      details: `Desde el lunes 17 de enero no puedo acceder al sistema de gestión de proyectos. Aparece el siguiente error:\n\n"Error de autenticación - Credenciales inválidas"\n\nHe intentado:\n- Restablecer contraseña\n- Limpiar caché del navegador\n- Probar desde diferentes navegadores\n\nNecesito acceso urgente para completar el reporte semanal.`
    },
    {
      id: "REQ-2025-004",
      title: "Actualización de Datos Personales",
      description: "Cambio de dirección y número de teléfono en el sistema de RR.HH.",
      category: "hr_general",
      status: "borrador",
      priority: "low",
      submittedBy: "Roberto Silva",
      submittedDate: "2025-01-20T15:45:00Z",
      lastUpdated: "2025-01-20T15:45:00Z",
      assignedTo: null,
      dueDate: null,
      hasMessages: false,
      details: `Solicito la actualización de mis datos personales en el sistema:\n\nDirección anterior: Av. Providencia 1234, Santiago\nNueva dirección: Av. Las Condes 5678, Las Condes\n\nTeléfono anterior: +56 9 8765 4321\nNuevo teléfono: +56 9 1234 5678\n\nAdjunto comprobante de domicilio actualizado.`
    },
    {
      id: "REQ-2025-005",
      title: "Consulta sobre Liquidación de Sueldo",
      description: "Discrepancia en el cálculo de horas extras en la liquidación de diciembre 2024.",
      category: "payroll",
      status: "rejected",
      priority: "medium",
      submittedBy: "Patricia Morales",
      submittedDate: "2025-01-12T13:20:00Z",
      lastUpdated: "2025-01-18T09:15:00Z",
      assignedTo: "Departamento de Nóminas",
      dueDate: null,
      hasMessages: true,
      details: `He revisado mi liquidación de sueldo de diciembre 2024 y encontré una discrepancia en el cálculo de horas extras.\n\nSegún mis registros:\n- Horas extras trabajadas: 15 horas\n- Horas extras pagadas: 10 horas\n\nSolicito revisión y corrección si corresponde. Adjunto registro detallado de horas trabajadas.`
    },
    {
      id: "REQ-2025-006",
      title: "Inscripción en Seguro Complementario",
      description: "Solicitud de inscripción en el plan de seguro médico complementario para empleados.",
      category: "benefits",
      status: "pending",
      priority: "medium",
      submittedBy: "Diego Herrera",
      submittedDate: "2025-01-16T10:00:00Z",
      lastUpdated: "2025-01-19T14:30:00Z",
      assignedTo: "Beneficios",
      dueDate: "2025-01-30T17:00:00Z",
      hasMessages: false,
      details: `Solicito mi inscripción en el plan de seguro médico complementario ofrecido por la empresa.\n\nPlan solicitado: Plan Familiar Premium\nBeneficiarios: Cónyuge e hijo menor\n\nAdjunto formularios completados y documentos requeridos.`
    }
  ];

  // Mock timeline data
  const mockTimeline = [
    {
      id: 1,
      title: "Solicitud Enviada",
      description: "La solicitud ha sido enviada y está pendiente de revisión inicial.",
      status: "completed",
      completedAt: "2025-01-18T09:30:00Z",
      assignedTo: "Sistema Automático",
      notes: "Solicitud recibida correctamente. Todos los campos obligatorios completados."
    },
    {
      id: 2,
      title: "Revisión Inicial",
      description: "El equipo de RR.HH. está realizando la revisión inicial de la documentación.",
      status: "completed",
      completedAt: "2025-01-19T11:15:00Z",
      assignedTo: "María González",
      notes: "Documentación completa. Procede a aprobación del supervisor."
    },
    {
      id: 3,
      title: "Aprobación del Supervisor",
      description: "Esperando aprobación del supervisor directo.",
      status: "current",
      completedAt: null,
      assignedTo: "Carlos Mendoza",
      estimatedCompletion: "2025-01-22T17:00:00Z",
      notes: null
    },
    {
      id: 4,
      title: "Aprobación Final",
      description: "Aprobación final por parte del departamento de RR.HH.",
      status: "pending",
      completedAt: null,
      assignedTo: "Ana Rodríguez",
      estimatedCompletion: "2025-01-24T17:00:00Z",
      notes: null
    },
    {
      id: 5,
      title: "Procesamiento",
      description: "Procesamiento final y notificación al empleado.",
      status: "pending",
      completedAt: null,
      assignedTo: "Sistema Automático",
      estimatedCompletion: "2025-01-25T12:00:00Z",
      notes: null
    }
  ];

  // Mock stats data
  const mockStats = {
    total: 156,
    pending: 23,
    inReview: 12,
    approved: 98,
    rejected: 8,
    avgProcessingTime: 5.2
  };

  // Filter and sort requests
  const filteredRequests = mockRequests?.filter(request => {
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

  const handleViewTimeline = (request) => {
    setSelectedRequest(request);
    setShowTimeline(true);
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
      {(isMobileOpen || !isMobileScreen) && (
        <>
          <Sidebar 
            // isCollapsed ahora se basa SOLO en isDesktopOpen
            isCollapsed={!isDesktopOpen} 
            onToggleCollapse={toggleSidebar} 
            isMobileOpen={isMobileOpen}
            onNavigate={handleNavigation}
          />
          
          {/* El Overlay solo debe aparecer en Móvil cuando está abierto */}
          {isMobileScreen && isMobileOpen && (
            <div 
              className="fixed inset-0 bg-foreground/50 z-40" 
              onClick={toggleSidebar}
            ></div>
          )}
        </>
      )}
      <main className={`transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      } pt-16`}>
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
                variant="outline"
                onClick={() => window.location.href = '/form-center'}
                iconName="Plus"
                iconPosition="left"
                iconSize={16}
              >
                Nueva Solicitud
              </Button>
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
          <div className={viewMode === 'grid' ? 'space-y-4' : 'space-y-2'}>
            {filteredRequests?.length > 0 ? (
              filteredRequests?.map((request) => (
                <RequestCard
                  key={request?.id}
                  request={request}
                  onViewDetails={handleViewDetails}
                  onSendMessage={handleSendMessage}
                />
              ))
            ) : (
              <div className="text-center py-12 bg-card border border-border rounded-lg">
                <Icon name="Search" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron solicitudes</h3>
                <p className="text-muted-foreground mb-4">
                  Intenta ajustar los filtros o crear una nueva solicitud
                </p>
                <Button
                  variant="default"
                  onClick={() => window.location.href = '/form-center'}
                  iconName="Plus"
                  iconPosition="left"
                  iconSize={16}
                >
                  Crear Nueva Solicitud
                </Button>
              </div>
            )}
          </div>

          {/* Timeline View */}
          {showTimeline && selectedRequest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-card border border-border rounded-lg shadow-brand-active w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Cronología de la Solicitud</h2>
                      <p className="text-sm text-muted-foreground">{selectedRequest?.title}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowTimeline(false)}
                      iconName="X"
                      iconSize={20}
                    />
                  </div>
                </div>
                <div className="p-6">
                  <TimelineView timeline={mockTimeline} isVisible={true} />
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
      />
    </div>
  );
};

export default RequestTracking;