import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RequestCard = ({ request, onRemove, onViewDetails, onSendMessage }) => {
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
      case 'rejected':
      case 'rechazado':
        return 'bg-error text-error-foreground';
      case 'borrador':
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
      case 'borrador':
        return 'FileText';
      default:
        return 'Circle';
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
      'borrador': 'BORRADOR'
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

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-brand-hover transition-brand">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-foreground">{request?.formTitle || request?.form?.title || request?.title}</h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request?.status)}`}>
              <Icon name={getStatusIcon(request?.status)} size={12} className="mr-1" />
              {formatStatusText(request?.status)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{request?.description}</p>

          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Icon name="Briefcase" size={14} />
              <span>Empresa: {request?.company}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="User" size={14} />
              <span>Por: {request?.submittedBy}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="Tag" size={14} />
              <span className={getPriorityColor(request?.priority)}>
                {request?.form?.section?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {request?.hasMessages && (
            <div className="relative">
              <Icon name="MessageCircle" size={16} className="text-accent" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full"></span>
            </div>
          )}
          <span className="text-xs text-muted-foreground">
            {getRelativeTime(request?.submittedAt)}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
          </div>
          {request?.assignedTo && (
            <div className="text-sm">
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(request)}
            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Icon name="Trash2" size={14} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onSendMessage(request)}
            iconName="MessageSquare"
            iconPosition="left"
            iconSize={16}
          >
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(request)}
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