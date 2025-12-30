import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon.jsx';
import Button from '../../components/ui/Button';

const NotificationsCard = ({ user, onUnreadChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const mail = sessionStorage.getItem("email");

  // Función para inferir tipo de notificación basado en icono y título
  const inferNotificationType = (notification) => {
    const title = notification.titulo?.toLowerCase() || '';
    const icon = notification.icono;

    if (icon === 'Edit') {
      return 'message';
    }
    else if (icon === 'form') {
      return 'form_response';
    }
    else if (icon === 'CheckCircle') {
      return 'CheckCircle';
    }

    else if (title.includes('ticket') || title.includes('soporte')) {
      return 'support';
    }
    return 'system';
  };

  useEffect(() => {
    if (onUnreadChange) {
      const unread = notifications.filter(n => !n.isRead).length;
      onUnreadChange(unread);
    }
  }, [notifications, onUnreadChange]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`https://back-vercel-iota.vercel.app/api/noti/${user}`);
        const data = await res.json();

        const normalizedNotis = data.map(n => ({
          id: n.id,
          type: n.icono, // Usar la función de inferencia
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
        setFilteredNotifications(normalizedNotis.reverse());
      } catch (err) {
        console.error("Error cargando notificaciones:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  // Obtener tipos únicos de notificaciones
  const notificationTypes = React.useMemo(() => {
    const types = new Set(notifications.map(n => n.type));
    return ['all', ...Array.from(types)];
  }, [notifications]);

  // Contar notificaciones por tipo
  const countByType = React.useMemo(() => {
    const counts = { all: notifications.length };
    notifications.forEach(noti => {
      counts[noti.type] = (counts[noti.type] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  // Filtrar notificaciones cuando cambia el filtro activo
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredNotifications(notifications);
    } else {
      const filtered = notifications.filter(n => n.type === activeFilter);
      setFilteredNotifications(filtered);
    }
  }, [activeFilter, notifications]);

  // Funciones para obtener etiquetas y estilos de los tipos
  const getTypeLabel = (type) => {
    const labels = {
      all: 'Todas',
      message: 'Mensajes',
      form_response: 'Formularios',
      support: 'Soporte',
      system: 'Sistema'
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type) => {
    const icons = {
      all: 'Bell',
      message: 'MessageSquare',
      form_response: 'FileText',
      support: 'HelpCircle',
      system: 'Settings'
    };
    return icons[type] || 'Bell';
  };

  const getTypeColor = (type) => {
    const colors = {
      all: '#3b82f6', // blue-500
      message: '#2563eb', // blue-600
      form_response: '#16a34a', // green-600
      support: '#ea580c', // orange-600
      system: '#7c3aed' // purple-600
    };
    return colors[type] || '#6b7280';
  };

  const handleDeleteNotifications = async () => {
    try {
      if (!mail) {
        console.error("Usuario no encontrado en sesión.");
        return;
      }

      setNotifications([]);
      setFilteredNotifications([]);
      setActiveFilter('all');

      const res = await fetch(`https://back-vercel-iota.vercel.app/api/noti/${mail}`, {
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
      setFilteredNotifications([]);
      console.log(`Todas las notificaciones eliminadas correctamente.`);
    } catch (err) {
      console.error("Error eliminando notificación:", err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      if (!mail) {
        console.error("Usuario no encontrado en sesión.");
        return;
      }

      const res = await fetch(`https://back-vercel-iota.vercel.app/api/noti/${mail}/${id}`, {
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
      setFilteredNotifications((prev) => prev.filter((n) => n.id !== id));
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
    const badgeClass = `px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${config?.[priority]?.class}`;

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
      if (!mail) {
        console.error("Usuario no encontrado en sesión.");
        return;
      }

      const res = await fetch(`https://back-vercel-iota.vercel.app/api/noti/${mail}/leido-todas`, {
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

      setFilteredNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, leido: true }))
      );

      console.log("Todas las notificaciones marcadas como leídas");
    } catch (err) {
      console.error("Error al marcar todas como leídas:", err);
    }
  };

  const handleNotificationClick = async (notification) => {
    const notiId = notification.id;

    if (!mail || !notiId) {
      console.error("Faltan IDs para marcar la notificación como leída.");
    } else {
      try {
        const response = await fetch(
          `https://back-vercel-iota.vercel.app/api/noti/${mail}/${notiId}/leido`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          console.error(`Error al marcar ${notiId} como leída: ${response.statusText}`);
        } else {
          console.log(`Notificación ${notiId} marcada como leída en el servidor.`);
        }
      } catch (error) {
        console.error("Error de red al llamar al endpoint:", error);
      }
    }

    setNotifications(prev =>
      prev.map(n =>
        n.id === notiId ? { ...n, isRead: true } : n
      )
    );

    setFilteredNotifications(prev =>
      prev.map(n =>
        n.id === notiId ? { ...n, isRead: true } : n
      )
    );

    if (notification?.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <div className="bg-card z-50 rounded-xl m-4 shadow-brand border border-border max-w-sm">
      {/* FILTROS POR TIPO - ARRIBA DE LOS MENSAJES */}
      <div className="sticky top-0 bg-card z-10 pt-4 px-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Filtrar por tipo:</h3>
          {activeFilter !== 'all' && (
            <button
              onClick={() => setActiveFilter('all')}
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              Ver todas
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {notificationTypes.map(type => (
            type !== 'all' && (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`
                flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all
                ${activeFilter === type
                    ? 'text-white shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted-hover'
                  }
              `}
                style={{
                  backgroundColor: activeFilter === type ? getTypeColor(type) : '',
                  borderColor: activeFilter === type ? getTypeColor(type) : 'transparent'
                }}
              >

                <Icon
                  name={type === 'all' ? 'Bell' : type}
                  size={14}
                  className={`mr-2 ${activeFilter === type ? 'text-white' : 'text-muted-foreground'}`}
                />
                <span className={`
                ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center
                ${activeFilter === type
                    ? 'bg-white/30 text-white'
                    : 'bg-black/10 text-foreground'
                  }
              `}>
                  {countByType[type] || 0}
                </span>
              </button>)
          ))}
        </div>
      </div>

      {/* LISTA DE NOTIFICACIONES FILTRADAS */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto overflow-x-hidden">
        {filteredNotifications && filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
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
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      {!notification?.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                      )}
                      <h3
                        className={`font-medium text-sm ${notification?.leido ? 'text-foreground' : 'text-primary'}`}
                      >
                        {notification?.title}
                      </h3>
                    </div>

                    <div className="flex items-start space-x-3 text-xs flex-shrink-0 ml-4">
                      <div className="flex flex-col items-end space-y-1">
                        <span className={getPriorityBadge(notification?.priority)?.class}>
                          {getPriorityBadge(notification?.priority)?.text}
                        </span>
                        <span className="text-muted-foreground text-[10px] leading-tight">
                          {formatTimestamp(notification?.timestamp)}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification?.id);
                        }}
                        className="text-muted-foreground hover:text-red-600 transition-colors pt-0.5"
                        title="Eliminar notificación"
                      >
                        <Icon name="X" size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground pr-10">
                    {notification?.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 px-6 m-2">
            <Icon
              name={activeFilter === 'all' ? "BellOff" : "Filter"}
              size={36}
              className="mx-auto mb-4 text-muted-foreground/60"
            />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {activeFilter === 'all'
                ? 'Sin notificaciones recientes'
                : `Sin notificaciones de tipo "${getTypeLabel(activeFilter)}"`
              }
            </h3>
            <p className="text-sm text-muted-foreground">
              {activeFilter === 'all'
                ? 'Aquí aparecerán sus futuras notificaciones.'
                : 'Intenta con otro filtro o mira todas las notificaciones.'
              }
            </p>
            {activeFilter !== 'all' && (
              <button
                onClick={() => setActiveFilter('all')}
                className="mt-3 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Ver todas las notificaciones
              </button>
            )}
          </div>
        )}
      </div>

      {filteredNotifications.length > 0 ? (
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
        </div>
      ) : null}
    </div>
  );
};

export default NotificationsCard;