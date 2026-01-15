import React from 'react';
import Icon from '../../../components/AppIcon';

const StatsOverview = ({ stats, allForms, filters = {}, onFilterChange, customCards }) => {

  // Función para determinar si una tarjeta está activa visualmente
  const isStatusFilterActive = (statusValue) => {
    // Si statusValue es null, representa el botón "Total" (sin filtros activos)
    if (statusValue === null) {
      // Está activo si el filtro de estado está vacío o no existe
      return (!filters.status || filters.status === '' || filters.status.length === 0);
    }
    return filters.status && filters.status.includes(statusValue);
  };

  // Cálculos de variación (últimas 24h)
  const calculate24hChange = (dateField) => {
    return allForms.filter(r => {
      const dateToCheck = r[dateField];
      if (!dateToCheck) return false;
      const lastUpdateDate = new Date(dateToCheck);
      const now = new Date();
      return (now - lastUpdateDate) <= 24 * 60 * 60 * 1000;
    }).length;
  };

  const last24hCreateCount = calculate24hChange('createdAt');
  const last24hPendingCount = calculate24hChange('submittedAt');
  const last24hReviewCount = calculate24hChange('reviewedAt');
  const last24hApprovedCount = calculate24hChange('approvedAt');
  const last24hFinalizedCount = calculate24hChange('finalizedAt');



  // Configuración de tarjetas
  // Si nos pasan tarjetas personalizadas (dinámicas), las usamos.
  // De lo contrario, usamos el default.
  let cardsToRender = customCards;

  if (!cardsToRender || cardsToRender.length === 0) {
    cardsToRender = [
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
      // ... (resto de defaults si se desea mantener fallback)
    ];
  }

  return (
    <div className="w-full -mx-4 px-4">
      <div className="flex overflow-x-auto py-4 px-4 gap-3 snap-x scroll-pl-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {cardsToRender?.map((stat, index) => {
          const isActive = isStatusFilterActive(stat.filterKey);

          return (
            <div
              key={index}
              className={`flex-none w-[160px] sm:w-[180px] bg-card border rounded-lg p-3 cursor-pointer transition-all duration-300 select-none snap-start
              ${isActive
                  ? `${stat.borderColor} shadow-md relative z-10 ring-1 ring-offset-0 ${stat.borderColor.replace('border', 'ring')}`
                  : 'border-border hover:shadow hover:border-muted-foreground/30'
                }`}
              // LÓGICA MODIFICADA AQUÍ:
              onClick={() => {
                if (isActive && stat.filterKey !== null) {
                  // Si ya está activa y no es la tarjeta "Total", enviamos null para limpiar
                  onFilterChange(null);
                } else {
                  // Si no está activa, enviamos la clave correspondiente
                  onFilterChange(stat.filterKey);
                }
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`p-1.5 rounded-md ${!stat.iconColor ? stat?.bgColor : ''}`}
                  style={stat.iconColor ? { backgroundColor: stat.bgColor } : {}}
                >
                  <Icon
                    name={stat?.icon}
                    size={16}
                    className={`w-4 h-4 ${!stat.iconColor ? stat?.color : ''}`}
                    style={stat.iconColor ? { color: stat.iconColor } : {}}
                  />
                </div>
                <div className={`text-[10px] font-medium ${stat?.changeType === 'positive' ? 'text-success' : 'text-error'
                  } whitespace-nowrap`}>
                  {stat?.change > 0 && '+'}
                  {stat?.change}
                </div>
              </div>

              {/* Content */}
              <div>
                <p className="text-xl sm:text-2xl font-bold text-foreground mb-0.5 leading-tight">
                  {stat?.value || 0}
                </p>
                <p className="text-xs text-muted-foreground leading-tight line-clamp-2 min-h-[2.5em] flex items-center">
                  {stat?.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatsOverview;