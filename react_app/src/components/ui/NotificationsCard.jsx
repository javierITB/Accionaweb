import React, { useState } from 'react';
import Icon from '../../components/AppIcon.jsx';
import Button from '../../components/ui/Button';

const NotificationsCard = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'reminder',
      title: 'Recordatorio: Evaluación de Desempeño',
      message: 'Tu evaluación anual vence el 15 de enero. Completa el formulario antes de la fecha límite.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      isRead: false,
      priority: 'high',
      actionUrl: '/form-center?type=evaluation'
    },
    {
      id: 2,
      type: 'approval',
      title: 'Solicitud de Vacaciones Aprobada',
      message: 'Tu solicitud de vacaciones del 15-20 de enero ha sido aprobada por tu supervisor.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: false,
      priority: 'medium',
      actionUrl: '/request-tracking'
    },
    {
      id: 3,
      type: 'system',
      title: 'Actualización del Sistema',
      message: 'El portal estará en mantenimiento el domingo 26 de enero de 02:00 a 06:00 hrs.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      isRead: true,
      priority: 'low',
      actionUrl: null
    },
    {
      id: 4,
      type: 'document',
      title: 'Nuevo Documento Disponible',
      message: 'Se ha publicado la nueva política de trabajo remoto. Revísala en la sección de documentos.',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      isRead: true,
      priority: 'medium',
      actionUrl: '/form-center?type=policy'
    }
  ]);
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'reminder': return 'Clock';
      case 'approval': return 'CheckCircle';
      case 'system': return 'Settings';
      case 'document': return 'FileText';
      default: return 'Bell';
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'bg-error text-white';
    switch (type) {
      case 'reminder': return 'bg-warning text-white';
      case 'approval': return 'bg-success text-white';
      case 'system': return 'bg-blue-500 text-white';
      case 'document': return 'bg-purple-500 text-white';
      default: return 'bg-muted text-foreground';
    }
  };

  const getPriorityBadge = (priority) => {
    const config = {
      high: { text: 'Alta', class: 'bg-error/10 text-error border-error/20' },
      medium: { text: 'Media', class: 'bg-warning/10 text-warning border-warning/20' },
      low: { text: 'Baja', class: 'bg-success/10 text-success border-success/20' }
    };
    return config?.[priority] || config?.medium;
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `hace ${days} día${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
      return 'hace unos momentos';
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    setNotifications(prev => 
      prev?.map(n => n?.id === notification?.id ? { ...n, isRead: true } : n)
    );

    // Navigate if there's an action URL
    if (notification?.actionUrl) {
      window.location.href = notification?.actionUrl;
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev?.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications?.filter(n => !n?.isRead)?.length;

  return (
    <div className="bg-card rounded-xl shadow-brand border border-border">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {notifications?.map((notification) => (
            <div
              key={notification?.id}
              className={`border rounded-lg p-4 transition-brand cursor-pointer hover:shadow-brand-hover ${
                notification?.isRead 
                  ? 'border-border bg-card' :'border-primary/30 bg-primary/5 shadow-sm'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification?.type, notification?.priority)}`}>
                  <Icon name={getNotificationIcon(notification?.type)} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`font-medium ${notification?.isRead ? 'text-foreground' : 'text-primary'}`}>
                          {notification?.title}
                        </h3>
                        {!notification?.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification?.message}
                      </p>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(notification?.timestamp)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityBadge(notification?.priority)?.class}`}>
                          {getPriorityBadge(notification?.priority)?.text}
                        </span>
                      </div>
                    </div>
                    {notification?.actionUrl && (
                      <Icon name="ChevronRight" size={16} className="text-muted-foreground mt-1" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 py-4 border-t border-border">
          <Button
            variant="outline"
            fullWidth
            iconName="Bell"
            iconPosition="left"
            onClick={() => window.location.href = '/support-portal?section=notifications'}
          >
            Ver Todas las Notificaciones
          </Button>
        </div>
    </div>
  );
};

export default NotificationsCard;