import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { apiFetch, API_BASE_URL } from '../../utils/api';
// import { toast } from 'sonner'; // Not installed

const AdminNotificationManager = () => {
    // Sidebar State
    const [isDesktopOpen, setIsDesktopOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

    // Data State
    const [notificationGroups, setNotificationGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);

    // Resize Handler
    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 768;
            setIsMobileScreen(isMobile);
            if (isMobile) setIsMobileOpen(false);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => isMobileScreen ? setIsMobileOpen(!isMobileOpen) : setIsDesktopOpen(!isDesktopOpen);
    const handleNavigation = () => isMobileScreen && setIsMobileOpen(false);
    const mainMarginClass = isMobileScreen ? 'ml-0' : isDesktopOpen ? 'ml-64' : 'ml-16';

    const fetchNotifications = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await apiFetch(`${API_BASE_URL}/noti/gestion/agrupadas`);
            if (res.ok) {
                const data = await res.json();
                setNotificationGroups(data);
            } else {
                console.error("Error fetching notifications");
                // toast.error("Error al cargar notificaciones");
            }
        } catch (error) {
            console.error(error);
            // toast.error("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Handlers
    const handleOpenGroup = (group) => {
        setSelectedGroup(group);
        setSelectedUserIds([]); // Reset selection
    };

    const handleCloseModal = () => {
        setSelectedGroup(null);
        setSelectedUserIds([]);
    };

    const toggleSelectUser = (userId) => {
        setSelectedUserIds(prev => {
            if (prev.includes(userId)) return prev.filter(id => id !== userId);
            return [...prev, userId];
        });
    };

    const toggleSelectAllUsers = () => {
        if (!selectedGroup) return;
        if (selectedUserIds.length === selectedGroup.usuarios.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(selectedGroup.usuarios.map(u => u._id));
        }
    };

    const handleDelete = async () => {
        if (!selectedGroup || selectedUserIds.length === 0) return;

        if (!confirm(`¿Estás seguro de eliminar esta notificación para ${selectedUserIds.length} usuario(s)?`)) return;

        try {
            setIsDeleting(true);
            const res = await apiFetch(`${API_BASE_URL}/noti/gestion/delete-batch`, {
                method: 'POST',
                body: JSON.stringify({
                    titulo: selectedGroup.titulo,
                    descripcion: selectedGroup.descripcion,
                    userIds: selectedUserIds
                })
            });

            if (res.ok) {
                const result = await res.json();
                alert(`Eliminadas ${result.modifiedCount || 0} notificaciones`);

                // Refresh data
                await fetchNotifications();
                handleCloseModal();
            } else {
                alert("Error al eliminar notificaciones");
            }
        } catch (error) {
            console.error(error);
            alert("Fallo la eliminación");
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredGroups = notificationGroups.filter(g =>
        g.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Header />
            <Sidebar isCollapsed={!isDesktopOpen} onToggleCollapse={toggleSidebar} isMobileOpen={isMobileOpen} onNavigate={handleNavigation} />

            <main className={`transition-all duration-300 ${mainMarginClass} pt-20 h-screen overflow-hidden flex flex-col`}>
                <div className="p-6 container-main flex-1 flex flex-col min-h-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Gestor de Notificaciones</h1>
                            <p className="text-muted-foreground text-sm">Agrupación por similitud para limpieza masiva.</p>
                        </div>
                        <div className="relative w-72">
                            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar por título..."
                                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Group List */}
                    <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
                        <div className="overflow-auto flex-1 p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/40 sticky top-0 z-10 text-xs uppercase text-muted-foreground font-semibold">
                                    <tr>
                                        <th className="px-6 py-3">Tipo</th>
                                        <th className="px-6 py-3">Título / Descripción</th>
                                        <th className="px-6 py-3 text-center">Usuarios Afectados</th>
                                        <th className="px-6 py-3 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {isLoading ? (
                                        <tr><td colSpan="4" className="text-center p-8">Cargando notificaciones...</td></tr>
                                    ) : filteredGroups.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center p-8 text-muted-foreground">No hay notificaciones agrupadas.</td></tr>
                                    ) : (
                                        filteredGroups.map((group, idx) => (
                                            <tr key={idx} className="hover:bg-muted/10 transition-colors group-row">
                                                <td className="px-6 py-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100`}>
                                                        <Icon name={group.tipo || 'Bell'} size={16} className="text-gray-600" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-semibold text-foreground">{group.titulo}</p>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">{group.descripcion}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {group.count}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleOpenGroup(group)}
                                                    >
                                                        Ver Detalles
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* DETAILS MODAL */}
            {selectedGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal}></div>
                    <div className="relative w-full max-w-4xl bg-card border border-border rounded-xl shadow-2xl flex flex-col h-[80vh] animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-border flex justify-between items-start bg-muted/10">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Icon name={selectedGroup.tipo || 'Bell'} className="text-primary" />
                                    {selectedGroup.titulo}
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{selectedGroup.descripcion}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleCloseModal} iconName="X" />
                        </div>

                        {/* Toolbar */}
                        <div className="p-4 border-b border-border flex justify-between items-center bg-card">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={selectedUserIds.length > 0 && selectedUserIds.length === selectedGroup.usuarios.length}
                                    onChange={toggleSelectAllUsers}
                                />
                                <span>Seleccionar todos ({selectedGroup.usuarios.length})</span>
                            </div>

                            {selectedUserIds.length > 0 && (
                                <Button
                                    variant="danger"
                                    size="sm"
                                    iconName="Trash"
                                    onClick={handleDelete}
                                    loading={isDeleting}
                                >
                                    Eliminar ({selectedUserIds.length})
                                </Button>
                            )}
                        </div>

                        {/* Users List */}
                        <div className="flex-1 overflow-auto p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/30 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 w-12"></th>
                                        <th className="px-6 py-3">Usuario</th>
                                        <th className="px-6 py-3">Empresa</th>
                                        <th className="px-6 py-3">Fecha Notificación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {selectedGroup.usuarios.map((u, i) => (
                                        <tr key={i} className={`hover:bg-muted/5 ${selectedUserIds.includes(u._id) ? 'bg-primary/5' : ''}`}>
                                            <td className="px-6 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-primary focus:ring-primary/50"
                                                    checked={selectedUserIds.includes(u._id)}
                                                    onChange={() => toggleSelectUser(u._id)}
                                                />
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="font-medium">{u.nombre}</div>
                                                <div className="text-xs text-muted-foreground">{u.mail}</div>
                                            </td>
                                            <td className="px-6 py-3 text-muted-foreground">{u.empresa}</td>
                                            <td className="px-6 py-3 text-xs text-muted-foreground">
                                                {new Date(u.fecha).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNotificationManager;
