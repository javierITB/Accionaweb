import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ContactSupport = () => {
  const [selectedMethod, setSelectedMethod] = useState(null);

  const contactMethods = [
    {
      id: 'phone',
      title: 'Teléfono',
      description: 'Habla directamente con nuestro equipo',
      icon: 'Phone',
      availability: 'Lun - Vie, 8:00 AM - 6:00 PM',
      responseTime: 'Inmediato',
      contact: '+56 2 2345 6789',
      color: 'bg-success'
    },
    {
      id: 'email',
      title: 'Email',
      description: 'Envía tu consulta por correo electrónico',
      icon: 'Mail',
      availability: '24/7',
      responseTime: '2-4 horas',
      contact: 'soporte@acciona.cl',
      color: 'bg-primary'
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      description: 'Chatea con nosotros por WhatsApp',
      icon: 'MessageCircle',
      availability: 'Lun - Vie, 8:00 AM - 8:00 PM',
      responseTime: '15-30 minutos',
      contact: '+56 9 8765 4321',
      color: 'bg-accent'
    },
    {
      id: 'teams',
      title: 'Microsoft Teams',
      description: 'Reunión virtual con especialista',
      icon: 'Video',
      availability: 'Con cita previa',
      responseTime: 'Según disponibilidad',
      contact: 'Agendar reunión',
      color: 'bg-secondary'
    }
  ];

  const supportTeam = [
    {
      id: 1,
      name: "María González",
      role: "Especialista en Recursos Humanos",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
      specialties: ["Nómina", "Beneficios", "Políticas"],
      languages: ["Español", "Inglés"],
      availability: "online"
    },
    {
      id: 2,
      name: "Carlos Ruiz",
      role: "Soporte Técnico",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
      specialties: ["Portal", "Formularios", "Documentos"],
      languages: ["Español"],
      availability: "online"
    },
    {
      id: 3,
      name: "Ana López",
      role: "Gerente de Recursos Humanos",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
      specialties: ["Consultas Complejas", "Escalaciones"],
      languages: ["Español", "Inglés", "Portugués"],
      availability: "busy"
    },
    {
      id: 4,
      name: "Roberto Silva",
      role: "Especialista en Compensaciones",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
      specialties: ["Sueldos", "Bonos", "Liquidaciones"],
      languages: ["Español"],
      availability: "offline"
    }
  ];

  const handleContactMethod = (method) => {
    setSelectedMethod(method);
    switch(method?.id) {
      case 'phone':
        alert(`Llamando a ${method?.contact}...`);
        break;
      case 'email':
        window.location.href = `mailto:${method?.contact}`;
        break;
      case 'whatsapp':
        alert(`Abriendo WhatsApp con ${method?.contact}...`);
        break;
      case 'teams': alert('Redirigiendo a Microsoft Teams para agendar reunión...');
        break;
      default:
        break;
    }
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'online': return 'bg-success';
      case 'busy': return 'bg-warning';
      case 'offline': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  const getAvailabilityText = (availability) => {
    switch (availability) {
      case 'online': return 'En línea';
      case 'busy': return 'Ocupado';
      case 'offline': return 'Desconectado';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-foreground mb-6">Contactar Soporte</h2>
      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {contactMethods?.map((method) => (
          <div
            key={method?.id}
            className="bg-card border border-border rounded-lg p-6 hover:shadow-brand-hover transition-brand cursor-pointer group"
            onClick={() => handleContactMethod(method)}
          >
            <div className={`w-12 h-12 ${method?.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <Icon name={method?.icon} size={24} color="white" />
            </div>
            
            <h3 className="text-lg font-semibold text-foreground mb-2">{method?.title}</h3>
            <p className="text-muted-foreground text-sm mb-4">{method?.description}</p>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Disponibilidad:</span>
                <span className="font-medium text-foreground">{method?.availability}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Respuesta:</span>
                <span className="font-medium text-foreground">{method?.responseTime}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <p className="font-medium text-foreground text-sm">{method?.contact}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Support Team */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Nuestro Equipo de Soporte</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {supportTeam?.map((member) => (
            <div
              key={member?.id}
              className="flex items-start space-x-4 p-4 rounded-lg hover:bg-muted/50 transition-brand"
            >
              <div className="relative">
                <img
                  src={member?.avatar}
                  alt={member?.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${getAvailabilityColor(member?.availability)} rounded-full border-2 border-card`}></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-foreground">{member?.name}</h4>
                  <span className="text-xs text-muted-foreground">
                    {getAvailabilityText(member?.availability)}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">{member?.role}</p>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Especialidades:</p>
                    <div className="flex flex-wrap gap-1">
                      {member?.specialties?.map((specialty) => (
                        <span
                          key={specialty}
                          className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Idiomas:</p>
                    <p className="text-xs text-foreground">{member?.languages?.join(', ')}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Emergency Contact */}
      <div className="mt-6 bg-gradient-to-r from-error/10 to-warning/10 border border-error/20 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-error rounded-lg flex items-center justify-center">
            <Icon name="AlertTriangle" size={24} color="white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">Contacto de Emergencia</h3>
            <p className="text-muted-foreground mb-4">
              Para situaciones urgentes fuera del horario laboral, utiliza nuestro número de emergencia.
            </p>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Icon name="Phone" size={16} className="mr-2" />
                +56 2 2345 6789 (Ext. 911)
              </Button>
              <span className="text-sm text-muted-foreground">Disponible 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSupport;