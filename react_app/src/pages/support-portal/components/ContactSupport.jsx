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
      default:
        break;
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-foreground mb-6">Contactar Soporte</h2>
      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
    </div>
  );
};

export default ContactSupport;