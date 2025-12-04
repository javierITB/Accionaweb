import React from 'react';
import Icon from '../../../components/AppIcon';

const QuickActionsCard = () => {
  const quickActions = [
    {
      id: 1,
      title: 'Remuneraciones',
      description: '',
      icon: 'Receipt',
      color: 'bg-blue-500',
      path: '/remuneraciones'
    },
    {
      id: 2,
      title: 'Anexos',
      description: '',
      icon: 'Calendar',
      color: 'bg-green-500',
      path: '/Anexos'
    },
    {
      id: 3,
      title: 'Finiquitos',
      description: '',
      icon: 'FileText',
      color: 'bg-orange-500',
      path: '/Finiquitos'
    },
    {
      id: 4,
      title: 'Otras',
      description: '',
      icon: 'FileText',
      color: 'bg-purple-500',
      path: '/otras'
    },
    {
      id: 5, // Corregí el ID duplicado
      title: 'Envío de documentos',
      description: '',
      icon: 'FileText',
      color: 'bg-blue-500',
      path: '/forms?id=6902379d46e3a2e6e0d8a57f'
    }
  ];

  const handleActionClick = (path) => {
    window.location.href = path;
  };

  return (
    <div className="bg-card rounded-xl shadow-brand border border-border w-full">
      {/* Header */}
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
      
      {/* Actions Grid */}
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
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors text-sm sm:text-base">
                  {action?.title}
                </h3>
                {action?.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                    {action?.description}
                  </p>
                )}
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