import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const TicketSystem = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    description: '',
    attachments: []
  });

  // Static categories for error reporting
  const categories = [
    { value: 'error_acceso', label: 'Error de Inicio de Sesión' },
    { value: 'error_visualizacion', label: 'Problema de Visualización' },
    { value: 'error_guardado', label: 'Error al Guardar Datos' },
    { value: 'lentitud', label: 'Lentitud del Sistema' },
    { value: 'funcionalidad_rota', label: 'Funcionalidad No Responde' },
    { value: 'otro', label: 'Otro' }
  ];

  const [myTickets, setMyTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const userMail = sessionStorage.getItem("email");
  const token = sessionStorage.getItem("token");

  const [selectedTicket, setSelectedTicket] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!userMail) return;
      setIsLoading(true);
      try {
        // 1. Fetch User Details
        const userRes = await fetch(`https://back-vercel-iota.vercel.app/api/auth/full/${userMail}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser({
            nombre: userData.nombre || sessionStorage.getItem("user"),
            empresa: userData.empresa,
            uid: userData._id,
            token: token,
            email: userMail
          });
        }

        // 2. Fetch User Tickets
        fetchTickets();

      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userMail, token]);

  const fetchTickets = async () => {
    if (!userMail) return;
    try {
      const res = await fetch(`https://back-vercel-iota.vercel.app/api/soporte/mail/${userMail}`);
      if (res.ok) {
        const data = await res.json();
        setMyTickets(data.reverse());
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setActiveTab('details');
  };

  const handleInputChange = (field, value) => {
    setTicketForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitTicket = async () => {
    if (!ticketForm?.subject || !ticketForm?.category || !ticketForm?.description) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!currentUser) {
      alert('Error: No se pudo identificar al usuario. Por favor recarga la página.');
      return;
    }

    setIsLoading(true);
    try {
      const selectedCategory = categories.find(c => c.value === ticketForm.category);

      const payload = {
        formId: ticketForm.category,
        formTitle: selectedCategory ? selectedCategory.label : 'Ticket de Soporte',
        user: {
          nombre: currentUser.nombre,
          empresa: currentUser.empresa,
          uid: currentUser.uid,
          token: currentUser.token
        },
        responses: {
          Asunto: ticketForm.subject,
          Descripción: ticketForm.description,
          Prioridad: ticketForm.priority
        },
        mail: currentUser.email,
        adjuntos: []
      };

      const res = await fetch("https://back-vercel-iota.vercel.app/api/soporte/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Ticket creado exitosamente.');
        setTicketForm({
          subject: '',
          category: '',
          priority: 'medium',
          description: '',
          attachments: []
        });
        setActiveTab('my-tickets');
        fetchTickets();
      } else {
        const errData = await res.json();
        alert(`Error al crear ticket: ${errData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert('Error de conexión al crear el ticket.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente': return 'bg-warning text-warning-foreground';
      case 'en_revision': return 'bg-primary text-primary-foreground';
      case 'aprobado': return 'bg-success text-success-foreground';
      case 'finalizado': return 'bg-muted text-muted-foreground';
      case 'archivado': return 'bg-gray-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pendiente': return 'Pendiente';
      case 'en_revision': return 'En Revisión';
      case 'aprobado': return 'Aprobado';
      case 'finalizado': return 'Finalizado';
      case 'archivado': return 'Archivado';
      default: status;
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-foreground mb-6">Sistema de Tickets</h2>
      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'create' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => { setActiveTab('create'); setSelectedTicket(null); }}
          iconName="Plus"
          iconPosition="left"
          iconSize={16}
        >
          Crear Ticket
        </Button>
        <Button
          variant={activeTab === 'my-tickets' || activeTab === 'details' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => { setActiveTab('my-tickets'); setSelectedTicket(null); }}
          iconName="List"
          iconPosition="left"
          iconSize={16}
        >
          Mis Tickets
        </Button>
      </div>

      {isLoading && <div className="text-center py-4">Cargando...</div>}

      {/* Create Ticket Tab */}
      {!isLoading && activeTab === 'create' && (
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
                placeholder="Selecciona el tipo de error"
                options={categories}
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

            <div className="flex justify-end space-x-3">
              <Button onClick={handleSubmitTicket}>
                Crear Ticket
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* My Tickets Tab */}
      {!isLoading && activeTab === 'my-tickets' && (
        <div className="space-y-4">
          {myTickets?.map((ticket) => (
            <div
              key={ticket?._id}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-brand-hover transition-brand cursor-pointer"
              onClick={() => handleTicketClick(ticket)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {ticket?.responses?.Asunto || ticket?.formTitle}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket?.status)}`}>
                      {getStatusText(ticket?.status)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    ID: {ticket?._id} • Categoría: {ticket?.formTitle}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    Ver Detalles
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Creado</p>
                  <p className="font-medium text-foreground">
                    {new Date(ticket.createdAt)?.toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Última Actualización</p>
                  <p className="font-medium text-foreground">
                    {ticket.updatedAt ? new Date(ticket.updatedAt)?.toLocaleDateString('es-ES') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado</p>
                  <p className="font-medium text-foreground">{getStatusText(ticket?.status)}</p>
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

      {/* Ticket Details Tab */}
      {!isLoading && activeTab === 'details' && selectedTicket && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/30">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {selectedTicket.responses?.Asunto || selectedTicket.formTitle}
                </h3>
                <div className="flex items-center space-x-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                    {getStatusText(selectedTicket.status)}
                  </span>
                  <span className="text-muted-foreground">
                    ID: {selectedTicket._id}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(selectedTicket.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('my-tickets')} iconName="X">
                Cerrar
              </Button>
            </div>

            <div className="bg-background p-4 rounded-md border border-border">
              <p className="text-sm text-muted-foreground mb-1 font-medium">Descripción:</p>
              <p className="text-foreground whitespace-pre-wrap">
                {selectedTicket.responses?.Descripción || 'Sin descripción'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketSystem;