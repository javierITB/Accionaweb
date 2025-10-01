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
      title: 'Solicitudes Recibidas',
      value: '12',
      change: '+4',
      changeType: 'increase',
      description: 'Este mes',
      icon: 'CheckCircle',
      color: 'bg-success',
      bgColor: 'bg-green-50'
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
    <div className="bg-card rounded-xl shadow-brand border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Resumen General</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Estado actual de tus solicitudes y documentos
            </p>
          </div>
          <Icon name="BarChart3" size={24} className="text-primary" />
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats?.map((stat) => (
            <div
              key={stat?.id}
              className={`${stat?.bgColor} rounded-lg p-4 border border-border/50 hover:shadow-brand-hover transition-brand`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-8 h-8 ${stat?.color} rounded-lg flex items-center justify-center`}>
                      <Icon name={stat?.icon} size={16} color="white" />
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {stat?.title}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-foreground">
                        {stat?.value}
                      </span>
                      {stat?.change !== '0' && (
                        <div className={`flex items-center space-x-1 ${getChangeColor(stat?.changeType)}`}>
                          <Icon name={getChangeIcon(stat?.changeType)} size={12} />
                          <span className="text-xs font-medium">
                            {stat?.change}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stat?.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress Indicators */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Completitud del Perfil</span>
                <span className="font-medium text-foreground">85%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Capacitaciones del Año</span>
                <span className="font-medium text-foreground">3 de 4</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-success h-2 rounded-full transition-all duration-300" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverviewCard;