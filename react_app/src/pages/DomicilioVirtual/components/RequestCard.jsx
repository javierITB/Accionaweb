import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RequestCard = ({ request, onRemove, onViewDetails }) => {
  const [currentRequest, setCurrentRequest] = useState(request);

  useEffect(() => {
    setCurrentRequest(request);
  }, [request]);



  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': case 'pendiente': return 'bg-error text-error-foreground';
      case 'documento_generado': return 'bg-error/10 text-error';
      case 'solicitud_firmada': return 'bg-warning text-warning-foreground';
      case 'informado_sii': return 'bg-info text-info-foreground';
      case 'dicom': return 'bg-secondary text-secondary-foreground';
      case 'dado_de_baja': return 'bg-muted text-muted-foreground';
      case 'finalizado': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': case 'pendiente': return 'Clock';
      case 'documento_generado': return 'FileText';
      case 'solicitud_firmada': return 'PenTool';
      case 'informado_sii': return 'Building';
      case 'dicom': return 'AlertTriangle';
      case 'dado_de_baja': return 'XCircle';
      case 'finalizado': return 'Timer';
      default: return 'HelpCircle';
    }
  };

  const formatStatusText = (status) => {
    const statusMap = {
      'pending': 'PENDIENTE',
      'pendiente': 'PENDIENTE',
      'documento_generado': 'DOC. GENERADO',
      'solicitud_firmada': 'SOLICITUD FIRMADA',
      'informado_sii': 'INFORMADO SII',
      'dicom': 'DICOM',
      'dado_de_baja': 'DADO DE BAJA',
      'finalizado': 'FINALIZADO'
    };

    return statusMap[status?.toLowerCase()] || status?.replace('_', ' ')?.toUpperCase() || 'DESCONOCIDO';
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-error';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return 'fecha desconocida';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();

    const diffSeconds = Math.floor(diffTime / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffTime < 0) {
      return 'en el futuro';
    } else if (diffSeconds < 60) {
      return 'hace un momento';
    } else if (diffMinutes < 60) {
      return `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays === 1) {
      return 'hace 1 día';
    } else if (diffDays < 7) {
      return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      const diffWeeks = Math.floor(diffDays / 7);
      return `hace ${diffWeeks} semana${diffWeeks > 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const diffMonths = Math.floor(diffDays / 30);
      return `hace ${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`;
    } else {
      const diffYears = Math.floor(diffDays / 365);
      return `hace ${diffYears} año${diffYears > 1 ? 's' : ''}`;
    }
  };



  const getCombinedTitle = () => {
    const formTitle = currentRequest?.formTitle || 'Formulario';
    const trabajador = request?.trabajador || "";

    return `${formTitle} ${trabajador}`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:shadow-brand-hover transition-brand">
      {/* Header - RESPONSIVE */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex-1 min-w-0">
          {/* Title and Time - RESPONSIVE */}
          <div className="flex flex-col xs:flex-row xs:items-center xs:space-x-3 space-y-1 xs:space-y-0 mb-2">
            <h3 className="text-base sm:text-lg font-semibold text-foreground break-words">
              {getCombinedTitle()}
            </h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {getRelativeTime(currentRequest?.submittedAt)}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            {currentRequest?.description}
          </p>

          {/* Meta Info - RESPONSIVE */}
          <div className="flex flex-col xs:flex-row xs:items-center space-y-2 xs:space-y-0 xs:space-x-3 sm:space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Icon name="Briefcase" size={12} className="flex-shrink-0 sm:w-3.5 sm:h-3.5" />
              <span className="truncate">Empresa: {currentRequest?.company}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="User" size={12} className="flex-shrink-0 sm:w-3.5 sm:h-3.5" />
              <span className="truncate">Por: {currentRequest?.submittedBy}</span>
            </div>
          </div>
        </div>

        {/* Status Badge - RESPONSIVE */}
        <div className="flex items-center space-x-2 self-start sm:self-auto sm:ml-4">
          {/* Message indicator removed */}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentRequest?.status)} whitespace-nowrap`}>
            <Icon name={getStatusIcon(currentRequest?.status)} size={10} className="mr-1 sm:w-3 sm:h-3" />
            {formatStatusText(currentRequest?.status)}
          </span>
        </div>
      </div>

      {/* Actions - RESPONSIVE */}
      <div className="flex items-center justify-between mt-4 sm:mt-3">
        <div className="flex-1">
          {/* Empty space for alignment */}
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Delete Button */}
          <Button
            variant="ghost"
            size="icon"
            title="Eliminar"
            onClick={() => onRemove(currentRequest)}
            className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Icon name="Trash2" size={12} className="sm:w-3.5 sm:h-3.5" />
          </Button>

          {/* Message Buttons Removed */}

          {/* Details Button - ICON ONLY ON MOBILE */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewDetails(currentRequest)}
            className="h-7 w-7 sm:h-8 sm:w-8 sm:!hidden" // Hidden on desktop, icon only on mobile
          >
            <Icon name="Info" size={12} className="sm:w-3.5 sm:h-3.5" />
          </Button>

          {/* Details Button - WITH TEXT ON DESKTOP */}
          <Button
            variant="ghost"
            size="sm"
            title="Ver detalles"
            onClick={() => onViewDetails(currentRequest)}
            iconName="Info"
            iconPosition="left"
            iconSize={14}
            className="hidden sm:flex" // Hidden on mobile, shown on desktop
          >
            Detalles
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RequestCard;