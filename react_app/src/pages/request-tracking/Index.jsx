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
  // Estados de UI y Modales
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [messageRequest, setMessageRequest] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Estados de Responsividad
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  const [filters, setFilters] = useState({
    search: '', status: '', category: '', priority: '',
    dateRange: '', startDate: '', endDate: '', assignedTo: '', submittedBy: ''
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      setIsMobileScreen(isMobile);
      if (isMobile) setIsDesktopOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mock Timeline Completo
  const mockTimeline = [
    {
      id: 1,
      title: "Solicitud Enviada",
      description: "La solicitud ha sido enviada y está pendiente de revisión inicial.",
      status: "completed",
      completedAt: "2025-01-18T09:30:00Z",
      assignedTo: "Sistema Automático",
      notes: "Solicitud recibida correctamente."
    },
    {
      id: 2,
      title: "Revisión Inicial",
      description: "El equipo de RR.HH. está realizando la revisión inicial.",
      status: "current",
      completedAt: null,
      assignedTo: "María González",
      estimatedCompletion: "2025-01-22T17:00:00Z"
    }
  ];

  // Datos de ejemplo
  const mockRequests = [
    {
      id: "REQ-2025-001",
      title: "Solicitud de Vacaciones - Febrero 2025",
      description: "Solicitud de 10 días de vacaciones.",
      category: "time_off",
      status: "pending",
      priority: "medium",
      submittedBy: "Sarah Johnson",
      submittedDate: "2025-01-18T09:30:00Z",
      assignedTo: "María González"
    }
  ];

  const mockStats = { total: 156, pending: 23, inReview: 12, approved: 98, rejected: 8, avgProcessingTime: 5.2 };

  // Handlers
  const toggleSidebar = () => {
    if (isMobileScreen) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsDesktopOpen(!isDesktopOpen);
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

const handleViewTimeline = (request) => {
    // Cerramos los detalles si están abiertos para evitar solapamiento
    setShowRequestDetails(false); 
    
    // Seteamos el request y abrimos timeline
    setSelectedRequest(request);
    setShowTimeline(true);
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowRequestDetails(true);
  };

  const handleSendMessage = (request) => {
    setMessageRequest(request);
    setShowMessageModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {(isMobileOpen || !isMobileScreen) && (
        <>
          <Sidebar 
            isCollapsed={!isDesktopOpen} 
            onToggleCollapse={toggleSidebar} 
            isMobileOpen={isMobileOpen}
            onNavigate={() => isMobileScreen && setIsMobileOpen(false)}
          />
          {isMobileScreen && isMobileOpen && (
            <div className="fixed inset-0 bg-foreground/50 z-40" onClick={toggleSidebar}></div>
          )}
        </>
      )}

      <main className={`transition-all duration-300 pt-16 ${
        isMobileScreen ? 'ml-0' : (sidebarCollapsed ? 'ml-16' : 'ml-64')
      }`}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Seguimiento de Solicitudes</h1>
            <Button variant="ghost" size="icon" onClick={toggleSidebar} iconName={sidebarCollapsed ? "PanelLeftOpen" : "PanelLeftClose"} />
          </div>

          <StatsOverview stats={mockStats} />

          <FilterPanel filters={filters} onFilterChange={setFilters} isVisible={showFilters} onToggle={() => setShowFilters(!showFilters)} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockRequests.map(req => (
              <RequestCard 
                key={req.id} 
                request={req} 
                onViewDetails={handleViewDetails} 
                onSendMessage={handleSendMessage}
                onViewTimeline={() => handleViewTimeline(req)} // Restaurado
              />
            ))}
          </div>

          {/* Modal de Timeline Restaurado */}
          {showTimeline && selectedRequest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-card border-b border-border p-6 z-10 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">Cronología</h2>
                    <p className="text-sm text-muted-foreground">{selectedRequest.title}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowTimeline(false)} iconName="X" />
                </div>
                <div className="p-6">
                  <TimelineView timeline={mockTimeline} isVisible={true} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <MessageModal isOpen={showMessageModal} onClose={() => setShowMessageModal(false)} request={messageRequest} onSendMessage={() => {}} />
      <RequestDetails request={selectedRequest} isVisible={showRequestDetails} onClose={() => setShowRequestDetails(false)} />
    </div>
  );
};

export default RequestTracking;