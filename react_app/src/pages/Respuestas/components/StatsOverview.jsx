import React from 'react';
import Icon from '../../../components/AppIcon';

const StatsOverview = ({ stats, allForms, filters = {}, onFilterChange }) => {
  
  const isStatusFilterActive = (statusValue) => {
    return filters.status === statusValue;
  };

  const calculate24hChange = (dateField) => {
    if (!allForms || !Array.isArray(allForms)) return 0;
    return allForms.filter(r => {
      const dateToCheck = r[dateField];
      if (!dateToCheck) return false;
      const lastUpdateDate = new Date(dateToCheck);
      const now = new Date();
      return (now - lastUpdateDate) <= 24 * 60 * 60 * 1000;
    }).length;
  };

  const last24hPendingCount = calculate24hChange('submittedAt');
  const last24hReviewCount = calculate24hChange('reviewedAt');
  const last24hApprovedCount = calculate24hChange('approvedAt');
  const last24hFinalizedCount = calculate24hChange('finalizedAt');

  const statCards = [
    {
      title: 'Pendientes',
      value: stats?.pending,
      icon: 'Clock',
      color: 'text-error',
      bgColor: 'bg-error/10',
      borderColor: 'border-error',
      change: last24hPendingCount,
      changeType: last24hPendingCount === 0 ? 'positive' : 'negative',
      filterKey: 'pendiente'
    },
    {
      title: 'En Revisión',
      value: stats?.inReview,
      icon: 'Eye',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      borderColor: 'border-secondary',
      change: last24hReviewCount,
      changeType: 'positive',
      filterKey: 'en_revision'
    },
    {
      title: 'Aprobadas',
      value: stats?.approved,
      icon: 'CheckCircle',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning',
      change: last24hApprovedCount,
      changeType: 'positive',
      filterKey: 'aprobado'
    },
    {
      title: 'Firmadas',
      value: stats?.rejected, 
      icon: 'CheckSquare',
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success',
      change: '+3%',
      changeType: 'positive',
      filterKey: 'firmado'
    },
    {
      title: 'Finalizados',
      value: stats?.finalized,
      icon: 'Timer',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent',
      change: last24hFinalizedCount,
      changeType: 'positive',
      filterKey: 'finalizado'
    },
    {
      title: 'Archivados',
      value: stats?.archived,
      icon: 'Folder',
      color: 'text-card-foreground',
      bgColor: 'bg-card/10',
      borderColor: 'border-card',
      filterKey: 'archivado'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {statCards.map((stat, index) => {
        const isActive = isStatusFilterActive(stat.filterKey);

        return (
          <div 
            key={index} 
            className={`bg-card border rounded-lg p-3 sm:p-4 cursor-pointer transition-all duration-300 select-none
              ${isActive 
                ? `${stat.borderColor} shadow-lg relative z-10 ring-1 ring-offset-0 ${stat.borderColor.replace('border', 'ring')}` 
                : 'border-border hover:shadow-md hover:border-muted-foreground/30'
              }`}
            onClick={() => onFilterChange(stat.filterKey)}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bgColor}`}>
                <Icon name={stat.icon} size={16} className={`${stat.color} sm:w-5 sm:h-5`} />
              </div>
              <div className={`text-xs font-medium ${
                stat.changeType === 'positive' ? 'text-success' : 'text-error'
              } whitespace-nowrap`}>
                {typeof stat.change === 'number' && stat.change > 0 && '+'}
                {stat.change}
              </div>
            </div>

            <div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1 leading-tight">
                {stat.value || 0}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                {stat.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsOverview;