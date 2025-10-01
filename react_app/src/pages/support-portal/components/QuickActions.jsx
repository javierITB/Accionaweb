import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActions = () => {
  const quickActions = [
    {
      id: 1,
      title: "Chat en Vivo",
      description: "Conecta con un agente ahora",
      icon: "MessageCircle",
      color: "bg-success",
      action: "chat"
    },
    {
      id: 2,
      title: "Crear Ticket",
      description: "Reporta un problema específico",
      icon: "Plus",
      color: "bg-primary",
      action: "ticket"
    },
    {
      id: 3,
      title: "Base de Conocimiento",
      description: "Busca respuestas rápidas",
      icon: "BookOpen",
      color: "bg-accent",
      action: "knowledge"
    },
    {
      id: 4,
      title: "Video Tutoriales",
      description: "Aprende con guías visuales",
      icon: "Play",
      color: "bg-secondary",
      action: "videos"
    }
  ];

  const handleAction = (action) => {
    switch(action) {
      case 'chat':
        // Mock chat initiation
        alert('Iniciando chat en vivo...');
        break;
      case 'ticket':
        // Mock ticket creation
        alert('Redirigiendo a crear ticket...');
        break;
      case 'knowledge':
        // Mock knowledge base
        document.getElementById('knowledge-section')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'videos':
        // Mock video tutorials
        document.getElementById('tutorials-section')?.scrollIntoView({ behavior: 'smooth' });
        break;
      default:
        break;
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-foreground mb-6">Acciones Rápidas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions?.map((action) => (
          <div
            key={action?.id}
            className="bg-card border border-border rounded-lg p-6 hover:shadow-brand-hover transition-brand cursor-pointer group"
            onClick={() => handleAction(action?.action)}
          >
            <div className={`w-12 h-12 ${action?.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <Icon name={action?.icon} size={24} color="white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{action?.title}</h3>
            <p className="text-muted-foreground text-sm mb-4">{action?.description}</p>
            <Button variant="ghost" size="sm" className="w-full">
              Comenzar
              <Icon name="ArrowRight" size={16} className="ml-2" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;