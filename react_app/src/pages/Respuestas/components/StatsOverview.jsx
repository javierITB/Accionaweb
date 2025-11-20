import React from 'react';
import Icon from '../../../components/AppIcon';

const StatsOverview = ({ stats, allForms }) => {
  const last24hCreateCount = allForms.filter(r => {
    const dateToCheck = r.createdAt;
    if (!dateToCheck) return false;

    const lastUpdateDate = new Date(dateToCheck);
    const now = new Date();
    return (now - lastUpdateDate) <= 24 * 60 * 60 * 1000;
  }).length;

  const last24hPendingCount = allForms.filter(r => {
    const dateToCheck = r.submittedAt;
    if (!dateToCheck) return false;

    const lastUpdateDate = new Date(dateToCheck);
    const now = new Date();
    return (now - lastUpdateDate) <= 24 * 60 * 60 * 1000;
  }).length;

  const last24hReviewCount = allForms.filter(r => {
    const dateToCheck = r.reviewedAt;
    if (!dateToCheck) return false;

    const lastUpdateDate = new Date(dateToCheck);
    const now = new Date();
    return (now - lastUpdateDate) <= 24 * 60 * 60 * 1000;
  }).length;

  const last24happrovedCount = allForms.filter(r => {
    const dateToCheck = r.approvedAt;
    if (!dateToCheck) return false;

    const lastUpdateDate = new Date(dateToCheck);
    const now = new Date();
    return (now - lastUpdateDate) <= 24 * 60 * 60 * 1000;
  }).length;

  const last24hfinalizedCount = allForms.filter(r => {
    const dateToCheck = r.finalizedAt;
    if (!dateToCheck) return false;

    const lastUpdateDate = new Date(dateToCheck);
    const now = new Date();
    return (now - lastUpdateDate) <= 24 * 60 * 60 * 1000;
  }).length;

  const statCards = [
    {
      title: 'Total de Respuestas',
      value: stats?.total,
      icon: 'FileText',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      change: last24hCreateCount,
      changeType: 'positive'
    },
    {
      title: 'Pendientes',
      value: stats?.pending,
      icon: 'Clock',
      color: 'text-error',
      bgColor: 'bg-error/10',
      change: last24hPendingCount,
      changeType: last24hPendingCount === 0 ? 'positive' : 'negative'
    },
    {
      title: 'En Revisión',
      value: stats?.inReview,
      icon: 'Eye',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      change: last24hReviewCount,
      changeType: last24happrovedCount === 0 ? 'positive' : 'negative'
    },
    {
      title: 'Aprobadas',
      value: stats?.approved,
      icon: 'CheckCircle',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      change: last24happrovedCount,
      changeType: last24happrovedCount === 0 ? 'positive' : 'negative'
    },
    {
      title: 'Firmadas',
      value: stats?.rejected,
      icon: 'CheckSquare',
      color: 'text-success',
      bgColor: 'bg-success/10',
      change: '+3%',
      changeType: 'positive'
    },
    {
      title: 'Finalizados',
      value: stats?.finalized,
      icon: 'Timer',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      change: last24hfinalizedCount,
      changeType: 'positive'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {statCards?.map((stat, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-brand-hover transition-brand">
          {/* Header - RESPONSIVE */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className={`p-1.5 sm:p-2 rounded-lg ${stat?.bgColor}`}>
              <Icon name={stat?.icon} size={16} className={`${stat?.color} sm:w-5 sm:h-5`} />
            </div>
            <div className={`text-xs font-medium ${
              stat?.changeType === 'positive' ? 'text-success' : 'text-error'
            } whitespace-nowrap`}>
              {stat?.change}
            </div>
          </div>

          {/* Content - RESPONSIVE */}
          <div>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1 leading-tight">
              {stat?.value}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
              {stat?.title}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;