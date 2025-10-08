import React from 'react';
import Icon from '../../../components/AppIcon';

const StatsOverview = ({ stats }) => {
  const statCards = [
    {
      title: 'Total de Solicitudes',
      value: stats?.total,
      icon: 'FileText',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Pendientes',
      value: stats?.pending,
      icon: 'Clock',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      change: '-5%',
      changeType: 'negative'
    },
    {
      title: 'En Revisión',
      value: stats?.inReview,
      icon: 'Eye',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Aprobadas',
      value: stats?.approved,
      icon: 'CheckCircle',
      color: 'text-success',
      bgColor: 'bg-success/10',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Rechazadas',
      value: stats?.rejected,
      icon: 'XCircle',
      color: 'text-error',
      bgColor: 'bg-error/10',
      change: '-3%',
      changeType: 'negative'
    },
    {
      title: 'Tiempo Promedio',
      value: `${stats?.avgProcessingTime} días`,
      icon: 'Timer',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      change: '-2 días',
      changeType: 'positive'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards?.map((stat, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-4 hover:shadow-brand-hover transition-brand">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${stat?.bgColor}`}>
              <Icon name={stat?.icon} size={20} className={stat?.color} />
            </div>
            <div className={`text-xs font-medium ${
              stat?.changeType === 'positive' ? 'text-success' : 'text-error'
            }`}>
              {stat?.change}
            </div>
          </div>
          
          <div>
            <p className="text-2xl font-bold text-foreground mb-1">{stat?.value}</p>
            <p className="text-sm text-muted-foreground">{stat?.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;