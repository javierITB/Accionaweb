import React from 'react';
import Icon from '../../../components/AppIcon';

const QuickActionsCard = () => {
  const quickActions = [
    {
      id: 1,
      title: 'Solicitud de Vacaciones',
      description: 'Solicita días libres y vacaciones',
      icon: 'Calendar',
      color: 'bg-blue-500',
      path: '/form-center?type=vacation'
    },
    {
      id: 2,
      title: 'Reporte de Gastos',
      description: 'Envía tus gastos empresariales',
      icon: 'Receipt',
      color: 'bg-green-500',
      path: '/form-center?type=expenses'
    },
    {
      id: 3,
      title: 'Soporte Técnico',
      description: 'Solicita ayuda con equipos IT',
      icon: 'Monitor',
      color: 'bg-orange-500',
      path: '/support-portal?category=it'
    },
    {
      id: 4,
      title: 'Certificado Laboral',
      description: 'Solicita certificados de trabajo',
      icon: 'FileText',
      color: 'bg-purple-500',
      path: '/form-center?type=certificate'
    },
    {
      id: 5,
      title: 'Cambio de Datos',
      description: 'Actualiza información personal',
      icon: 'Edit',
      color: 'bg-teal-500',
      path: '/form-center?type=personal-data'
    },
    {
      id: 6,
      title: 'Consulta RRHH',
      description: 'Contacta con recursos humanos',
      icon: 'MessageCircle',
      color: 'bg-red-500',
      path: '/support-portal?category=hr'
    }
  ];

  const handleActionClick = (path) => {
    window.location.href = path;
  };

  return (
    <div className="bg-card rounded-xl shadow-brand border border-border w-full">
      {/* Header - RESPONSIVE */}
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Acciones Rápidas</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Accede directamente a las funciones más utilizadas
            </p>
          </div>
          <Icon name="Zap" size={20} className="text-secondary flex-shrink-0 ml-4 sm:w-6 sm:h-6" />
        </div>
      </div>
      
      {/* Actions Grid - RESPONSIVE */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {quickActions?.map((action) => (
            <button
              key={action?.id}
              onClick={() => handleActionClick(action?.path)}
              className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg border border-border hover:border-primary hover:shadow-brand-hover transition-brand text-left group w-full"
              title = {action.title}
            >
              {/* Icon */}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${action?.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon name={action?.icon} size={18} color="white" className="sm:w-5 sm:h-5" />
              </div>
              
              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors text-sm sm:text-base leading-tight">
                  {action?.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  {action?.description}
                </p>
              </div>
              
              {/* Chevron */}
              <Icon 
                name="ChevronRight" 
                size={14} 
                className="text-muted-foreground group-hover:text-primary transition-colors mt-1 flex-shrink-0 sm:w-4 sm:h-4" 
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActionsCard;