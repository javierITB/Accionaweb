import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const TicketSystem = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    priority: '',
    description: '',
    attachments: []
  });

  const categoryOptions = [
    { value: 'technical', label: 'Soporte Técnico' },
    { value: 'payroll', label: 'Nómina y Pagos' },
    { value: 'benefits', label: 'Beneficios' },
    { value: 'forms', label: 'Formularios' },
    { value: 'policies', label: 'Políticas y Procedimientos' },
    { value: 'other', label: 'Otros' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' }
  ];

  const myTickets = [
    {
      id: 'TK-2025-001',
      subject: 'Problema con liquidación de enero',
      category: 'Nómina y Pagos',
      priority: 'high',
      status: 'in_progress',
      created: '2025-01-20',
      lastUpdate: '2025-01-22',
      assignedTo: 'María González'
    },
    {
      id: 'TK-2025-002',
      subject: 'Solicitud de certificado laboral',
      category: 'Formularios',
      priority: 'medium',
      status: 'pending',
      created: '2025-01-18',
      lastUpdate: '2025-01-18',
      assignedTo: 'Carlos Ruiz'
    },
    {
      id: 'TK-2025-003',
      subject: 'Acceso a beneficios de salud',
      category: 'Beneficios',
      priority: 'low',
      status: 'resolved',
      created: '2025-01-15',
      lastUpdate: '2025-01-17',
      assignedTo: 'Ana López'
    }
  ];

  const handleInputChange = (field, value) => {
    setTicketForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitTicket = () => {
    if (!ticketForm?.subject || !ticketForm?.category || !ticketForm?.description) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }
    
    alert('Ticket creado exitosamente. ID: TK-2025-004');
    setTicketForm({
      subject: '',
      category: '',
      priority: '',
      description: '',
      attachments: []
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'in_progress': return 'bg-primary text-primary-foreground';
      case 'resolved': return 'bg-success text-success-foreground';
      case 'closed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Progreso';
      case 'resolved': return 'Resuelto';
      case 'closed': return 'Cerrado';
      default: return 'Desconocido';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-secondary';
      case 'urgent': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-foreground mb-6">Sistema de Tickets</h2>
      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'create' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('create')}
          iconName="Plus"
          iconPosition="left"
          iconSize={16}
        >
          Crear Ticket
        </Button>
        <Button
          variant={activeTab === 'my-tickets' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('my-tickets')}
          iconName="List"
          iconPosition="left"
          iconSize={16}
        >
          Mis Tickets
        </Button>
      </div>
      {/* Create Ticket Tab */}
      {activeTab === 'create' && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Crear Nuevo Ticket</h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Asunto"
                type="text"
                placeholder="Describe brevemente tu problema"
                value={ticketForm?.subject}
                onChange={(e) => handleInputChange('subject', e?.target?.value)}
                required
              />
              
              <Select
                label="Categoría"
                placeholder="Selecciona una categoría"
                options={categoryOptions}
                value={ticketForm?.category}
                onChange={(value) => handleInputChange('category', value)}
                required
              />
            </div>

            <Select
              label="Prioridad"
              placeholder="Selecciona la prioridad"
              options={priorityOptions}
              value={ticketForm?.priority}
              onChange={(value) => handleInputChange('priority', value)}
              className="max-w-xs"
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Descripción Detallada *
              </label>
              <textarea
                className="w-full h-32 px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                placeholder="Describe tu problema con el mayor detalle posible..."
                value={ticketForm?.description}
                onChange={(e) => handleInputChange('description', e?.target?.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Archivos Adjuntos
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Icon name="Upload" size={32} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground mb-2">
                  Arrastra archivos aquí o haz clic para seleccionar
                </p>
                <Button variant="outline" size="sm">
                  Seleccionar Archivos
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Máximo 10MB por archivo. Formatos: PDF, DOC, JPG, PNG
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline">
                Guardar Borrador
              </Button>
              <Button onClick={handleSubmitTicket}>
                Crear Ticket
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* My Tickets Tab */}
      {activeTab === 'my-tickets' && (
        <div className="space-y-4">
          {myTickets?.map((ticket) => (
            <div
              key={ticket?.id}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-brand-hover transition-brand"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {ticket?.subject}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket?.status)}`}>
                      {getStatusText(ticket?.status)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    ID: {ticket?.id} • Categoría: {ticket?.category}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon 
                    name="AlertCircle" 
                    size={16} 
                    className={getPriorityColor(ticket?.priority)}
                  />
                  <Button variant="ghost" size="sm">
                    Ver Detalles
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Creado</p>
                  <p className="font-medium text-foreground">
                    {new Date(ticket.created)?.toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Última Actualización</p>
                  <p className="font-medium text-foreground">
                    {new Date(ticket.lastUpdate)?.toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Asignado a</p>
                  <p className="font-medium text-foreground">{ticket?.assignedTo}</p>
                </div>
              </div>
            </div>
          ))}

          {myTickets?.length === 0 && (
            <div className="text-center py-12">
              <Icon name="Ticket" size={48} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No tienes tickets</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer ticket para obtener ayuda con cualquier problema
              </p>
              <Button onClick={() => setActiveTab('create')}>
                Crear Primer Ticket
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TicketSystem;