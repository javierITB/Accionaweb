import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon.jsx';
import Button from '../../components/ui/Button';

const NotificationsCard = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);

        const res = await fetch(`http://192.168.0.2:4000/api/noti/${user}`);
        const data = await res.json();

        // Normalizar la información al formato que tu UI usa
        const normalizedNotis = data.map(n => ({
          id: n.id,
          type: n.tipo || "system", // Puedes agregar un tipo si lo manejas
          title: n.titulo,
          message: n.descripcion,
          timestamp: new Date(n.fecha_creacion),
          isRead: n.leido,
          priority: n.prioridad === 1 ? "low" : n.prioridad === 2 ? "medium" : "high",
          actionUrl: n.actionUrl || null, // Opcional
          icon: n.icono,
          color: n.color
        }));

        setNotifications(normalizedNotis);
      } catch (err) {
        console.error("Error cargando notificaciones:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);




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
    <div className="bg-card rounded-xl m-4 shadow-brand border border-border">
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification?.id}
              className={`border rounded-lg p-4 m-2 transition-brand cursor-pointer hover:shadow-brand-hover ${notification?.isRead
                  ? 'border-border bg-card'
                  : 'border-primary/30 bg-primary/5 shadow-sm'
                }`}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(
                    notification?.type,
                    notification?.priority
                  )}`}
                >
                  <Icon name={getNotificationIcon(notification?.type)} size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <h3
                          className={`font-medium ${notification?.isRead ? 'text-foreground' : 'text-primary'
                            }`}
                        >
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
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityBadge(notification?.priority)?.class
                            }`}
                        >
                          {getPriorityBadge(notification?.priority)?.text}
                        </span>
                      </div>
                    </div>

                    {/* ✅ Botón para eliminar notificación */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // evita que se dispare el click general
                        handleDeleteNotification(notification?.id);
                      }}
                      className="ml-3 text-muted-foreground hover:text-red-600 transition-colors"
                      title="Eliminar notificación"
                    >
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>


          ))
        ) : (
          <div className="text-center text-muted-foreground py-6">
            No hay notificaciones disponibles
          </div>
        )}
      </div>
      <div className="mt-3 py-2 border-t border-border">
        <div className="flex gap-2 justify-between m-2">
          <Button
            variant="outline"
            className="flex-1"
            iconName="Bell"
            iconPosition="left"
            onClick={() => window.location.href = '/support-portal?section=notifications'}
          >
            Ver Todas
          </Button>
          <Button
            variant="outline"
            className="flex-1 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
            iconName="Trash2"
            iconPosition="left"
            onClick={() => console.log('Eliminar todas las notificaciones')}
          >
            Eliminar Todas
          </Button>
        </div>
      </div>
    </div>
  );

};

export default NotificationsCard;