import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RequestCard = ({ request, onRemove, onViewDetails, onSendMessage, onUpdate }) => {
  const [currentRequest, setCurrentRequest] = useState(request);

  useEffect(() => {
    setCurrentRequest(request);
  }, [request]);

  useEffect(() => {
    if (!currentRequest?._id) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`https://accionaapi.vercel.app/api/respuestas/${currentRequest._id}`);
        if (response.ok) {
          const updatedRequest = await response.json();
          
          if (updatedRequest.status !== currentRequest.status) {
            setCurrentRequest(updatedRequest);
            if (onUpdate) {
              onUpdate(updatedRequest);
            }
          }
        }
      } catch (error) {
        console.error('Error verificando actualización del request:', error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [currentRequest?._id, currentRequest?.status, onUpdate]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'aprobado':
        return 'bg-success text-success-foreground';
      case 'pending':
      case 'pendiente':
        return 'bg-warning text-warning-foreground';
      case 'in_review':
      case 'en_revision':
        return 'bg-accent text-accent-foreground';
      case 'signed':
      case 'firmado':
        return 'bg-blue-500 text-white';
      case 'borrador':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'aprobado':
        return 'CheckCircle';
      case 'pending':
      case 'pendiente':
        return 'Clock';
      case 'in_review':
      case 'en_revision':
        return 'Eye';
      case 'rejected':
      case 'rechazado':
        return 'XCircle';
      case 'borrador':
        return 'FileText';
      default:
        return 'Circle';
      case 'signed':
      case 'firmado':
        return 'CheckSquare';
    }
  };

  const formatStatusText = (status) => {
    const statusMap = {
      'approved': 'APROBADO',
      'aprobado': 'APROBADO',
      'pending': 'PENDIENTE',
      'pendiente': 'PENDIENTE',
      'in_review': 'EN REVISIÓN',
      'en_revision': 'EN REVISIÓN',
      'rejected': 'RECHAZADO',
      'rechazado': 'RECHAZADO',
      'borrador': 'BORRADOR',
      'signed': 'FIRMADO',
      'firmado': 'FIRMADO'
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

  const getTrabajadorName = () => {
    return currentRequest?.responses?.["Nombre del trabajador:"] ||
      currentRequest?.responses?.["Nombre del trabajador"] ||
      'ninguno';
  };

  const getCombinedTitle = () => {
    const formTitle = currentRequest?.formTitle || currentRequest?.form?.title || currentRequest?.title || 'Formulario';
    const trabajadorName = getTrabajadorName();

    return `${formTitle} - ${trabajadorName}`;
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
            <div className="flex items-center space-x-1">
              <Icon name="Tag" size={12} className="flex-shrink-0 sm:w-3.5 sm:h-3.5" />
              <span className={getPriorityColor(currentRequest?.priority)}>
                {currentRequest?.form?.section?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge - RESPONSIVE */}
        <div className="flex items-center space-x-2 self-start sm:self-auto sm:ml-4">
          {currentRequest?.hasMessages && (
            <div className="relative">
              <Icon name="MessageCircle" size={14} className="text-accent sm:w-4 sm:h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full"></span>
            </div>
          )}
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
            onClick={() => onRemove(currentRequest)}
            className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Icon name="Trash2" size={12} className="sm:w-3.5 sm:h-3.5" />
          </Button>

          {/* Message Button - ICON ONLY ON MOBILE */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onSendMessage(currentRequest)}
            className="h-7 w-7 sm:h-8 sm:w-8 sm:!hidden" // Hidden on desktop, icon only on mobile
          >
            <Icon name="MessageSquare" size={12} className="sm:w-3.5 sm:h-3.5" />
          </Button>

          {/* Message Button - WITH TEXT ON DESKTOP */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSendMessage(currentRequest)}
            iconName="MessageSquare"
            iconPosition="left"
            iconSize={14}
            className="hidden sm:flex" // Hidden on mobile, shown on desktop
          >
            Mensaje
          </Button>

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