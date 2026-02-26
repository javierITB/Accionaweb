import React from 'react';
import Icon from '../../../components/AppIcon';

const StatsOverview = ({ stats, allForms, filters = {}, onFilterChange, onRefresh }) => {

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

  // Calcular stats dinámicamente desde allForms para respetar el filtro de pestaña (search)
  const computedStats = React.useMemo(() => {
    if (!allForms || allForms.length === 0) return stats || {};

    const counts = {
      total: allForms.length,
      documento_generado: 0,
      enviado: 0,
      solicitud_firmada: 0,
      informado_sii: 0,
      dicom: 0,
      dado_de_baja: 0,
      pendiente: 0 // equivalente a documento_generado en forms antiguos
    };

    allForms.forEach(form => {
      const status = form.status || 'pendiente';
      if (counts[status] !== undefined) {
        counts[status]++;
      } else {
        counts[status] = 1; // Para estados no previstos
      }
    });

    // Fallback: si hay stats del backend que no están en allForms por temas de paginación
    // Solo usamos los dinámicos si la pestaña (filtro search) está activa o si allForms está filtrado.
    // Como siempre descargamos por "contratacion" o "constitucion", los dinámicos son más precisos.
    return counts;
  }, [allForms, stats]);

  // Configuración de tarjetas con sus claves de filtro y estilos
  // Configuración de tarjetas con sus claves de filtro y estilos (DOMICILIO VIRTUAL)
  const statCards = [
    {
      title: 'Doc. Generado',
      value: computedStats?.documento_generado || computedStats?.pendiente || 0, // Fallback a pending si es el estado inicial
      icon: 'FileText',
      color: 'text-error',
      bgColor: 'bg-error/10',
      borderColor: 'border-error',
      change: last24hCreateCount,
      changeType: 'positive',
      filterKey: 'documento_generado'
    },
    {
      title: 'Enviado',
      value: computedStats?.enviado || 0,
      icon: 'Send',
      color: 'text-blue-600',
      bgColor: '',
      borderColor: 'border-blue-500/20',
      change: '+0',
      changeType: 'positive',
      filterKey: 'enviado'
    },
    {
      title: 'Firmada',
      value: computedStats?.solicitud_firmada || 0,
      icon: 'PenTool', // O FileSignature si existe
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning',
      change: '+0',
      changeType: 'positive',
      filterKey: 'solicitud_firmada'
    },
    {
      title: 'Info. SII',
      value: computedStats?.informado_sii || 0,
      icon: 'Building',
      color: 'text-info',
      bgColor: 'bg-info/10',
      borderColor: 'border-info',
      change: '+0',
      changeType: 'positive',
      filterKey: 'informado_sii'
    },
    {
      title: 'DICOM',
      value: computedStats?.dicom || 0,
      icon: 'AlertTriangle',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      borderColor: 'border-secondary',
      change: '+0',
      changeType: 'neutral',
      filterKey: 'dicom'
    },
    {
      title: 'De Baja',
      value: computedStats?.dado_de_baja || 0,
      icon: 'XCircle',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/10',
      borderColor: 'border-muted',
      change: '+0',
      changeType: 'neutral',
      filterKey: 'dado_de_baja'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {statCards?.map((stat, index) => {
        const isActive = isStatusFilterActive(stat.filterKey);

        return (
          <div
            key={index}
            className={`bg-card border rounded-lg p-3 sm:p-4 cursor-pointer transition-all duration-300 select-none
              ${isActive
                ? `${stat.borderColor} shadow-lg relative z-10 ring-1 ring-offset-0 ${stat.borderColor.replace('border', 'ring')}`
                : 'border-border hover:shadow-md hover:border-muted-foreground/30'
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
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className={`p-1.5 sm:p-2 rounded-lg ${stat?.bgColor}`}>
                <Icon name={stat?.icon} size={16} className={`${stat?.color} sm:w-5 sm:h-5`} />
              </div>
              <div className={`text-xs font-medium ${stat?.changeType === 'positive' ? 'text-success' : 'text-error'
                } whitespace-nowrap`}>
                {stat?.change > 0 && '+'}
                {stat?.change}
              </div>
            </div>

            {/* Content */}
            <div>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1 leading-tight">
                {stat?.value || 0}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                {stat?.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsOverview;