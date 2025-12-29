// MODIFICA SOLO ESTAS 2 FUNCIONES EN TU COMPONENTE:

const markAllAsRead = async () => {
  try {
    if (!mail) {
      console.error("Usuario no encontrado en sesión.");
      return;
    }

    // Si hay filtro activo (no es 'all'), marcar solo las del tipo seleccionado
    if (activeFilter !== 'all') {
      // Obtener los IDs de las notificaciones no leídas del tipo activo
      const unreadNotifications = filteredNotifications.filter(n => !n.isRead);
      
      if (unreadNotifications.length === 0) {
        console.log(`No hay notificaciones no leídas de tipo "${activeFilter}"`);
        return;
      }

      // Marcar cada notificación como leída individualmente
      const markAsReadPromises = unreadNotifications.map(noti =>
        fetch(`https://back-vercel-iota.vercel.app/api/noti/${mail}/${noti.id}/leido`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Esperar a que todas se completen
      await Promise.all(markAsReadPromises);

      // Actualizar estado local
      setNotifications(prev =>
        prev.map(n => 
          n.type === activeFilter && !n.isRead 
            ? { ...n, isRead: true, leido: true } 
            : n
        )
      );
      
      console.log(`Todas las notificaciones de tipo "${activeFilter}" marcadas como leídas`);
    } else {
      // Si no hay filtro, marcar todas como antes
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
    }
  } catch (err) {
    console.error("Error al marcar todas como leídas:", err);
  }
};

const handleDeleteNotifications = async () => {
  try {
    if (!mail) {
      console.error("Usuario no encontrado en sesión.");
      return;
    }

    // Si hay filtro activo (no es 'all'), eliminar solo las del tipo seleccionado
    if (activeFilter !== 'all') {
      // Obtener los IDs de las notificaciones del tipo activo
      const notificationsToDelete = filteredNotifications.map(n => n.id);
      
      // Eliminar cada notificación individualmente
      const deletePromises = notificationsToDelete.map(id =>
        fetch(`https://back-vercel-iota.vercel.app/api/noti/${mail}/${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        })
      );

      // Esperar a que todas las eliminaciones se completen
      await Promise.all(deletePromises);
      
      // Actualizar estado local: eliminar solo las del tipo filtrado
      setNotifications(prev => prev.filter(n => n.type !== activeFilter));
      
      console.log(`Todas las notificaciones de tipo "${activeFilter}" eliminadas.`);
    } else {
      // Si no hay filtro, eliminar todas como antes
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
    }
  } catch (err) {
    console.error("Error eliminando notificación:", err);
  }
};