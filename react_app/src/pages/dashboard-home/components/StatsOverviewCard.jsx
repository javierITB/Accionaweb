import React from 'react';
import Icon from '../../../components/AppIcon';

const StatsOverviewCard = () => {
  const stats = [
    {
      id: 1,
      title: 'Solicitudes Activas',
      value: '7',
      change: '+2',
      changeType: 'increase',
      description: 'En proceso de revisión',
      icon: 'FileText',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      id: 2,
      title: 'Documentos Pendientes',
      value: '3',
      change: '-1',
      changeType: 'decrease',
      description: 'Requieren tu atención',
      icon: 'AlertTriangle',
      color: 'bg-warning',
      bgColor: 'bg-orange-50'
    },
    {
      id: 3,
      title: 'Aprobaciones Recibidas',
      value: '12',
      change: '+4',
      changeType: 'increase',
      description: 'Este mes',
      icon: 'CheckCircle',
      color: 'bg-success',
      bgColor: 'bg-green-50'
    },
    {
      id: 4,
      title: 'Días de Vacaciones',
      value: '18',
      change: '0',
      changeType: 'neutral',
      description: 'Disponibles este año',
      icon: 'Calendar',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    }
  ];

  const getChangeIcon = (changeType) => {
    switch (changeType) {
      case 'increase': return 'TrendingUp';
      case 'decrease': return 'TrendingDown';
      default: return 'Minus';
    }
  };

  const getChangeColor = (changeType) => {
    switch (changeType) {
      case 'increase': return 'text-success';
      case 'decrease': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-brand border border-border w-full">
      {/* Header - RESPONSIVE */}
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Resumen General</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Estado actual de tus solicitudes y documentos
            </p>
          </div>
          <Icon name="BarChart3" size={20} className="text-primary flex-shrink-0 ml-4 sm:w-6 sm:h-6" />
        </div>
      </div>
      
      {/* Stats Grid - RESPONSIVE */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {stats?.map((stat) => (
            <div
              key={stat?.id}
              className={`${stat?.bgColor} rounded-lg p-3 sm:p-4 border border-border/50 hover:shadow-brand-hover transition-brand`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 ${stat?.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon name={stat?.icon} size={14} color="white" className="sm:w-4 sm:h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground break-words">
                      {stat?.title}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-xl sm:text-2xl font-bold text-foreground">
                        {stat?.value}
                      </span>
                      {stat?.change !== '0' && (
                        <div className={`flex items-center space-x-1 ${getChangeColor(stat?.changeType)}`}>
                          <Icon name={getChangeIcon(stat?.changeType)} size={10} className="sm:w-3 sm:h-3" />
                          <span className="text-xs font-medium">
                            {stat?.change}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {stat?.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress Indicators - RESPONSIVE */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                <span className="text-muted-foreground">Completitud del Perfil</span>
                <span className="font-medium text-foreground">85%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                <div className="bg-primary h-1.5 sm:h-2 rounded-full transition-all duration-300" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                <span className="text-muted-foreground">Capacitaciones del Año</span>
                <span className="font-medium text-foreground">3 de 4</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                <div className="bg-success h-1.5 sm:h-2 rounded-full transition-all duration-300" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverviewCard;