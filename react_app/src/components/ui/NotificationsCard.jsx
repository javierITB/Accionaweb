import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon.jsx';
import Button from '../../components/ui/Button';

const NotificationsCard = ({ user, onUnreadChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const mail = sessionStorage.getItem("email");

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

      if (!mail) {
        console.error("Usuario no encontrado en sesión.");
        return;
      }

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
    // const badgeClass = `px-2 py-1 rounded-full text-xs font-medium border ml-auto flex-shrink-0 ${config?.[priority]?.class}`;
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

      console.log("Todas las notificaciones marcadas como leídas");
    } catch (err) {
      console.error("Error al marcar todas como leídas:", err);
    }
  };


  const handleNotificationClick = async (notification) => {
    // 1. Obtener los IDs necesarios (asumiendo que notification tiene el userId o puedes obtenerlo)
    const notiId = notification.id;

    if (!mail || !notiId) {
      console.error("Faltan IDs para marcar la notificación como leída.");
      // Continuar con el resto de la lógica a pesar del error
    } else {
      try {
        // 2. Llamada al endpoint PUT para marcar como leída en la base de datos
        const response = await fetch(
          `https://back-vercel-iota.vercel.app/api/noti/${mail}/${notiId}/leido`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              // Agrega cualquier encabezado de autenticación (ej: 'Authorization') si es necesario
            },
          }
        );

        if (!response.ok) {
          // Manejo de error si la respuesta del servidor no es exitosa (ej: 404, 500)
          console.error(`Error al marcar ${notiId} como leída: ${response.statusText}`);
          // Opcional: podrías querer no actualizar el estado local si falla la API
        } else {
          // 3. Actualización del estado local solo si la API fue exitosa
          console.log(`Notificación ${notiId} marcada como leída en el servidor.`);
        }

      } catch (error) {
        console.error("Error de red al llamar al endpoint:", error);
        // Opcional: manejo de fallos de conexión
      }
    }

    setNotifications(prev =>
      prev.map(n =>
        n.id === notiId ? { ...n, isRead: true } : n
      )
    );

    // 5. Redirección
    if (notification?.actionUrl) {
      window.location.href = notification.actionUrl;
    }

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

                  {/*cambio incio*/}
                  <div className="flex items-start justify-between mb-1"> {/* Cambiado a items-start para alineación superior */}
                    {/* LADO IZQUIERDO: Punto de lectura + Título */}
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      {!notification?.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                      )}
                      <h3
                        className={`font-medium text-sm truncate ${notification?.leido ? 'text-foreground' : 'text-primary'}`}
                      >
                        {notification?.title}
                      </h3>
                    </div>

                    {/* LADO DERECHO: Stack vertical (Prioridad sobre Tiempo) + Botón X */}
                    <div className="flex items-start space-x-3 text-xs flex-shrink-0 ml-4">
                      
                      {/* Contenedor en Columna para Prioridad y Tiempo */}
                      <div className="flex flex-col items-end space-y-1">
                        <span className={getPriorityBadge(notification?.priority)?.class}>
                          {getPriorityBadge(notification?.priority)?.text}
                        </span>
                        <span className="text-muted-foreground text-[10px] leading-tight">
                          {formatTimestamp(notification?.timestamp)}
                        </span>
                      </div>

                      {/* Botón de eliminar (X) */}
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
                {/*cambio final*/}



                {/*
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
                  */}

                  <p
                    className="text-sm text-muted-foreground pr-10"
                  >
                    {notification?.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          /* Card de No Notificaciones - MEJORADO */
          <div className="text-center py-10 px-6 m-2">
            <Icon name="BellOff" size={36} className="mx-auto mb-4 text-muted-foreground/60" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Sin notificaciones recientes
            </h3>
            <p className="text-sm text-muted-foreground">
              Aquí aparecerán sus futuras notificaciones. ¡Todo en orden por ahora!
            </p>
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