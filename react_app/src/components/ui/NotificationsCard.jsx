import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon.jsx';
import Button from '../../components/ui/Button';

const NotificationsCard = ({ user, onUnreadChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (onUnreadChange) {
      const unread = notifications.filter(n => !n.isRead).length;
      onUnreadChange(unread);
    }
  }, [notifications, onUnreadChange]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`https://https://back-acciona.vercel.app/api/noti/${user}`);
        const data = await res.json();

        const normalizedNotis = data.map(n => ({
          id: n.id,
          type: n.tipo || "system",
          title: n.titulo,
          message: n.descripcion,
          timestamp: new Date(n.fecha_creacion),
          isRead: n.leido,
          priority: n.prioridad === 1 ? "low" : n.prioridad === 2 ? "medium" : "high",
          actionUrl: n.actionUrl || null,
          icon: n.icono,
          color: n.color
        }));

        setNotifications(normalizedNotis.reverse());
      } catch (err) {
        console.error("Error cargando notificaciones:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const handleDeleteNotifications = async () => {
    try {
      const mail = sessionStorage.getItem("email");

      if (!mail) {
        console.error("Usuario no encontrado en sesión.");
        return;
      }

      const res = await fetch(`https://https://back-acciona.vercel.app/api/noti/${mail}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error al eliminar notificación:", errorData);
        return;
      }

      setNotifications([]);
      console.log(`Todas las notificaciones eliminadas correctamente.`);
    } catch (err) {
      console.error("Error eliminando notificación:", err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      const mail = sessionStorage.getItem("email");

      if (!mail) {
        console.error("Usuario no encontrado en sesión.");
        return;
      }

      const res = await fetch(`https://https://back-acciona.vercel.app/api/noti/${mail}/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error al eliminar notificación:", errorData);
        return;
      }

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      console.log(`Notificación ${id} eliminada correctamente.`);
    } catch (err) {
      console.error("Error eliminando notificación:", err);
    }
  };

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
    const badgeClass = `px-2 py-1 rounded-full text-xs font-medium border ml-auto flex-shrink-0 ${config?.[priority]?.class}`;
    return { ...config?.[priority], class: badgeClass } || { text: 'Media', class: badgeClass };
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

  const markAllAsRead = async () => {
    try {
      const mail = sessionStorage.getItem("email");

      if (!mail) {
        console.error("Usuario no encontrado en sesión.");
        return;
      }

      const res = await fetch(`https://https://back-acciona.vercel.app/api/noti/${mail}/leido-todas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error al marcar todas como leídas:", errorData);
        return;
      }

      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, leido: true }))
      );

      console.log("Todas las notificaciones marcadas como leídas");
    } catch (err) {
      console.error("Error al marcar todas como leídas:", err);
    }
  };


  const handleNotificationClick = (notification) => {
    if (notification?.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    setNotifications(prev =>
      prev.map(n =>
        n.id === notification.id ? { ...n, isRead: true } : n
      )
    );
  };

  return (
    <div className="bg-card z-50 rounded-xl m-4 shadow-brand border border-border max-w-sm">
      <div className="space-y-2 max-h-[60vh] overflow-y-auto"> {/* CLAVE: max-h-[80vh] para que ocupe más altura */}
        {notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification?.id}
              className={`relative border rounded-lg p-3 m-2 pl-4 transition-brand cursor-pointer hover:shadow-brand-hover hover:border-border-hover 
                ${notification?.isRead ? 'border-border bg-card' : 'border-primary/30 bg-primary/5 shadow-sm'
                }`}
              onClick={() => handleNotificationClick(notification)}
            >
              {/* BARRA VERTICAL (TESTIGO) */}
              <div 
                className="absolute top-0 bottom-0 left-0 w-1 rounded-l-lg"
                style={{ backgroundColor: notification?.color || 'transparent' }}
              ></div>

              <div className="flex items-start"> 
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      {!notification?.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                      )}
                      <h3
                        className={`font-medium text-sm ${notification?.leido ? 'text-foreground' : 'text-primary'}`}
                      >
                        {notification?.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-3 text-xs flex-shrink-0">
                      <span className="text-muted-foreground">
                        {formatTimestamp(notification?.timestamp)}
                      </span>
                      <span className={getPriorityBadge(notification?.priority)?.class}>
                        {getPriorityBadge(notification?.priority)?.text}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification?.id);
                        }}
                        className="text-muted-foreground hover:text-red-600 transition-colors ml-3"
                        title="Eliminar notificación"
                      >
                        <Icon name="X" size={16} />
                      </button>
                    </div>
                  </div>

                  <p
                    className="text-sm text-muted-foreground pr-10"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: '1.25em',
                      maxHeight: '2.5em'
                    }}
                  >
                    {notification?.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          /* Card de No Notificaciones */
          <div
            key="0"
            className={`relative border rounded-lg p-3 m-2 pl-4 transition-brand border-primary/30 bg-primary/5 shadow-sm`}
          >
             {/* BARRA VERTICAL VACÍA */}
             <div 
                className="absolute top-0 bottom-0 left-0 w-1 rounded-l-lg bg-gray-300"
              ></div>
              
            <div className="flex items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2"> 
                    <h3 className="font-medium text-sm text-primary">
                      No hay notificaciones disponibles
                    </h3>
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                  </div>
                  <span className="text-xs text-muted-foreground">ahora</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Aquí aparecerán sus futuras notificaciones
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="mt-3 py-2 border-t border-border">
          <div className="flex gap-2 justify-between m-2">
            <Button
              variant="outline"
              className="flex-1"
              iconName="Bell"
              iconPosition="left"
              onClick={() => markAllAsRead()}
            >
              Marcar como leído
            </Button>
            <Button
              variant="outline"
              className="flex-1 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
              iconName="Trash2"
              iconPosition="left"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteNotifications();
              }}
            >
              Eliminar Todas
            </Button>
          </div>
        </div>) : null
      }
    </div>
  );

};

export default NotificationsCard;