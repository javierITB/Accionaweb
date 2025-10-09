import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RequestCard = ({ request, onRemove, onViewDetails, onSendMessage }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'in_review':
        return 'bg-accent text-accent-foreground';
      case 'rejected':
        return 'bg-error text-error-foreground';
      case 'draft':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'CheckCircle';
      case 'pending':
        return 'Clock';
      case 'in_review':
        return 'Eye';
      case 'rejected':
        return 'XCircle';
      case 'draft':
        return 'FileText';
      default:
        return 'Circle';
    }
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

  const getDaysAgo = (dateString) => {
    const diffTime = Math.abs(new Date() - new Date(dateString));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-brand-hover transition-brand">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-foreground">{request?.title}</h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request?.status)}`}>
              <Icon name={getStatusIcon(request?.status)} size={12} className="mr-1" />
              {request?.status?.replace('_', ' ')?.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{request?.description}</p>
          
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Icon name="Calendar" size={14} />
              <span>Enviado: {formatDate(request?.submittedDate)}</span>
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
            {getDaysAgo(request?.lastUpdated)} días
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Categoría: </span>
            <span className="font-medium text-foreground">{request?.category}</span>
          </div>
          {request?.assignedTo && (
            <div className="text-sm">
              <span className="text-muted-foreground">Asignado a: </span>
              <span className="font-medium text-foreground">{request?.assignedTo}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(request)}
            iconName="Trash"
            iconPosition="left"
            iconSize={16}
          >
            Eliminar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSendMessage(request)}
            iconName="MessageSquare"
            iconPosition="left"
            iconSize={16}
          >
            Mensaje
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onViewDetails(request)}
            iconName="Eye"
            iconPosition="left"
            iconSize={16}
          >
            Ver Detalles
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RequestCard;