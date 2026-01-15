import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { apiFetch, API_BASE_URL } from '../../../../utils/api';

const RequestCard = ({ request, onViewDetails, onSendMessage, onUpdate, onShare, viewMode = 'list' }) => {
  const [currentRequest, setCurrentRequest] = useState(request);

  useEffect(() => {
    setCurrentRequest(request);
  }, [request]);

  useEffect(() => {
    if (!currentRequest?._id) return;

    const interval = setInterval(async () => {
      try {
        const endpoint = 'respuestas';
        const response = await apiFetch(`${API_BASE_URL}/${endpoint}/${currentRequest._id}`);
        if (response.ok) {
          const updatedRequest = await response.json();

          if (updatedRequest.status !== currentRequest.status) {
            const normalizedRequest = {
              ...updatedRequest,
              submittedBy: updatedRequest.user?.nombre || updatedRequest.submittedBy || currentRequest.submittedBy || 'Usuario Desconocido',
              company: updatedRequest.user?.empresa || updatedRequest.company || currentRequest.company || 'Empresa Desconocida',
              submittedAt: updatedRequest.submittedAt || updatedRequest.createdAt || currentRequest.submittedAt
            };
            setCurrentRequest(normalizedRequest);
            if (onUpdate) {
              onUpdate(normalizedRequest);
            }
          }
        }
      } catch (error) {
        console.error('Error verificando actualización del request:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentRequest?._id, currentRequest?.status, onUpdate]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'pendiente':
        return 'bg-success text-success-foreground';
      case 'in_review':
      case 'en_revision':
        return 'bg-warning text-warning-foreground';
      case 'approved':
      case 'aprobado':
        return 'bg-secondary text-secondary-foreground';
      case 'signed':
      case 'firmado':
        return 'bg-success text-success-foreground'
      case 'finalizado':
        return 'bg-accent text-accent-foreground'
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

  const getCombinedTitle = () => {
    const formTitle = currentRequest?.formTitle || currentRequest?.form?.title || currentRequest?.title || 'Formulario';
    const trabajadorName = request?.trabajador || "";

    return `${formTitle} ${trabajadorName}`;
  };

  return (
    <div className={`bg-card border border-border rounded-lg hover:shadow-brand-hover transition-brand ${viewMode === 'grid' ? 'p-4' : 'p-4 sm:p-6'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-1">
            <h3 className={`font-semibold text-foreground ${viewMode === 'grid' ? 'text-sm line-clamp-2' : 'text-lg'}`}>
              {getCombinedTitle()}
            </h3>
          </div>
          <p className={`text-muted-foreground ${viewMode === 'grid' ? 'text-xs line-clamp-2' : 'text-sm'} mb-3`}>
            {currentRequest?.description}
          </p>

          <div className={`${viewMode === 'grid' ? 'space-y-2' : 'flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0 text-xs text-muted-foreground'}`}>
            <div className="flex items-center space-x-2">
              <Icon name="Briefcase" size={14} className="flex-shrink-0" />
              <span className={viewMode === 'grid' ? 'text-xs truncate' : 'truncate'}>
                {currentRequest?.company}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="User" size={14} className="flex-shrink-0" />
              <span className={viewMode === 'grid' ? 'text-xs truncate' : 'truncate'}>
                {currentRequest?.submittedBy}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="Tag" size={14} className="flex-shrink-0" />
              <span className={`${getPriorityColor(currentRequest?.priority)} ${viewMode === 'grid' ? 'text-xs truncate' : 'truncate'}`}>
                {currentRequest?.form?.section?.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="Clock" size={14} className="flex-shrink-0" />
              <span className={viewMode === 'grid' ? 'text-xs truncate' : 'truncate'}>
                {getRelativeTime(currentRequest?.submittedAt)}
              </span>
            </div>
          </div>
        </div>

        <div className={`flex items-center space-x-2 ${viewMode === 'grid' ? 'ml-2' : 'ml-4'}`}>
          {currentRequest?.hasMessages && (
            <div className="relative">
              <Icon name="MessageCircle" size={16} className="text-accent" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full"></span>
            </div>
          )}
          {viewMode === 'grid' ? (
            <div
              className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getStatusColor(currentRequest?.status)}`}
              title={formatStatusText(currentRequest?.status)}
            >
              <Icon name={getStatusIcon(currentRequest?.status)} size={16} />
            </div>
          ) : (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentRequest?.status)}`}>
              <Icon name={getStatusIcon(currentRequest?.status)} size={12} className="mr-1" />
              {formatStatusText(currentRequest?.status)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
          </div>
          {currentRequest?.assignedTo && (
            <div className="text-sm">
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            iconName="Share2"
            iconPosition="left"
            onClick={() => onShare(request)}
            iconSize={16}
          >
          </Button>
          {currentRequest.status !== 'archivado' && (
            <Button
              variant="outline"
              size="sm"
              title="Chat de Mensajes"
              onClick={() => onSendMessage(currentRequest)}
              iconName="MessageSquare"
              iconPosition="left"
              iconSize={16}
            >
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            title="Ver detalles"
            onClick={() => onViewDetails(currentRequest)}
            iconName="Info"
            iconPosition="left"
            iconSize={16}
          >
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RequestCard;