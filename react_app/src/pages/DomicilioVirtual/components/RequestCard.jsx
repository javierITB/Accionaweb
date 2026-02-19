import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import {
  getStatusColorClass,
  getStatusIcon,
  getDefaultStatusColor,
  formatStatusText
} from '../../../utils/ticketStatusStyles';

const domicilioConfig = {
  statuses: [
    { value: 'documento_generado', label: 'Doc. Generado', color: 'red', icon: 'FileText' },
    { value: 'enviado', label: 'Enviado', color: 'blue', icon: 'Send' },
    { value: 'solicitud_firmada', label: 'Firmada', color: 'yellow', icon: 'PenTool' },
    { value: 'informado_sii', label: 'Info. SII', color: 'white', icon: 'Building' },
    { value: 'dicom', label: 'DICOM', color: 'orange', icon: 'AlertTriangle' },
    { value: 'dado_de_baja', label: 'De Baja', color: 'gray', icon: 'XCircle' }
  ]
};

const RequestCard = ({ request, onRemove, onViewDetails, userPermissions = [] }) => {
  const [currentRequest, setCurrentRequest] = useState(request);
  const canDelete = userPermissions.includes('delete_solicitudes_clientes');

  useEffect(() => {
    setCurrentRequest(request);
  }, [request]);

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
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
    const rawTitle = currentRequest?.formTitle || 'Formulario';
    const cleanTitle = rawTitle.replace(/Domicilio Virtual/gi, '').replace(/^- /g, '').trim();
    const company = currentRequest?.nombreEmpresa;

    if (company && company !== "No especificado" && company !== "Empresa") {
      return `${cleanTitle || 'Solicitud'} - ${company}`;
    }
    
    return cleanTitle || 'Solicitud';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:shadow-brand-hover transition-brand">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col xs:flex-row xs:items-center xs:space-x-3 space-y-1 xs:space-y-0 mb-2">
            <h3 className="text-base sm:text-lg font-semibold text-foreground break-words">
              {getCombinedTitle()}
            </h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {getRelativeTime(currentRequest?.submittedAt)}
            </span>
          </div>

          <div className="flex flex-col space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Icon name="Building" size={12} className="flex-shrink-0 sm:w-3.5 sm:h-3.5" />
              <span className="truncate">
                {currentRequest?.nombreEmpresa || 'Empresa'}
              </span>
            </div>

            {currentRequest?.rutEmpresa && (
              <div className="flex items-center space-x-1">
                <Icon name="CreditCard" size={12} className="flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                <span>{currentRequest.rutEmpresa}</span>
              </div>
            )}
            
            {/* Fechas del Contrato - LEYENDO DESDE LA RAÍZ */}
            <div className="flex flex-col space-y-1 mt-1 pt-1 border-t border-border/50">
              {/* Fecha de Inicio - COLOR ACTUALIZADO A ACCENT */}
              {currentRequest?.fechaInicioContrato && (
                <div className="flex items-center space-x-1 text-accent font-medium">
                  <Icon name="Calendar" size={12} className="flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                  <span>Inicio: {currentRequest.fechaInicioContrato}</span>
                </div>
              )}
              
              {/* Fecha de Término */}
              {currentRequest?.fechaTerminoContrato && (
                <div className="flex items-center space-x-1 text-accent font-medium">
                  <Icon name="Calendar" size={12} className="flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                  <span>Término: {currentRequest.fechaTerminoContrato}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto sm:ml-4">
          {(() => {
            const currentStatus = currentRequest?.status;
            const statusDef = domicilioConfig.statuses.find(s => s.value === currentStatus);

            const badgeClass = statusDef
              ? getStatusColorClass(statusDef.color)
              : getDefaultStatusColor(currentStatus);

            const iconName = statusDef ? statusDef.icon : getStatusIcon(currentStatus);
            const label = statusDef ? statusDef.label : formatStatusText(currentStatus);

            return (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${badgeClass}`}>
                <Icon name={iconName} size={12} className="mr-1.5" />
                {label.toUpperCase()}
              </span>
            );
          })()}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 sm:mt-3">
        <div className="flex-1"></div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              title="Eliminar"
              onClick={() => onRemove(currentRequest)}
              className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Icon name="Trash2" size={12} className="sm:w-3.5 sm:h-3.5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewDetails(currentRequest)}
            className="h-7 w-7 sm:h-8 sm:w-8 sm:!hidden"
          >
            <Icon name="Info" size={12} className="sm:w-3.5 sm:h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            title="Ver detalles"
            onClick={() => onViewDetails(currentRequest)}
            iconName="Info"
            iconPosition="left"
            iconSize={14}
            className="hidden sm:flex"
          >
            Detalles
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RequestCard;