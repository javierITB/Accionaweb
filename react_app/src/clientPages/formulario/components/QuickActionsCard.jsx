import React from 'react';
import Icon from '../../../components/AppIcon';


const QuickActionsCard = () => {
  const quickActions = [
    {
      id: 1,
      title: 'Solicitud Carta de Despido',
      description: 'Solicita días libres y vacaciones',
      icon: 'FileText',
      color: 'bg-blue-500',
      path: '/form-center?type=vacation'
    },
    {
      id: 2,
      title: 'Carta de Renuncia voluntaaria',
      description: 'Envía tus gastos empresariales',
      icon: 'FileText',
      color: 'bg-blue-500',
      path: '/form-center?type=expenses'
    }
  ];

  const handleActionClick = (path) => {
    window.location.href = path;
  };

  return (
    <div className="bg-card rounded-xl shadow-brand border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Formularios remuneraciones</h2>
            <p className="text-sm text-muted-foreground mt-1">
            </p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {quickActions?.map((action) => (
            <button
              key={action?.id}
              onClick={() => handleActionClick(action?.path)}
              className="flex items-start space-x-4 p-4 rounded-lg border border-border hover:border-primary hover:shadow-brand-hover transition-brand text-left group"
            >
              <div className={`w-12 h-12 ${action?.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon name={action?.icon} size={20} color="white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {action?.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {action?.description}
                </p>
              </div>
              <Icon name="ChevronRight" size={16} className="text-muted-foreground group-hover:text-primary transition-colors mt-1" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActionsCard;