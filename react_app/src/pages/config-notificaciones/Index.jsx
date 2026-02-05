import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { apiFetch, API_BASE_URL } from '../../utils/api';

const AdminNotificationManager = ({ userPermissions = [] }) => {
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

    const [detailsFilter, setDetailsFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [cargoFilter, setCargoFilter] = useState("");
    const [companyFilter, setCompanyFilter] = useState("");

    const [uniqueCompanies, setUniqueCompanies] = useState([]);
    const [uniqueRoles, setUniqueRoles] = useState([]);
    const [uniqueCargos, setUniqueCargos] = useState([]);

    // Permisos
    const canViewDetails = userPermissions.includes('view_gestor_notificaciones_details');
    const canDelete = userPermissions.includes('delete_gestor_notificaciones');

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
            const res = await apiFetch(`${API_BASE_URL}/auth/`);
            if (res.ok) {
                const users = await res.json();
                const groupsMap = {};

                users.forEach(user => {
                    if (user.notificaciones && Array.isArray(user.notificaciones)) {
                        user.notificaciones.forEach(noti => {
                            const groupKeyObj = {
                                titulo: noti.titulo,
                                descripcion: noti.descripcion,
                                tipo: noti.icono,
                                fecha: new Date(noti.fecha_creacion).toISOString().split('T')[0]
                            };
                            const groupKey = JSON.stringify(groupKeyObj);

                            if (!groupsMap[groupKey]) {
                                groupsMap[groupKey] = {
                                    key: groupKey,
                                    titulo: noti.titulo,
                                    descripcion: noti.descripcion,
                                    tipo: noti.icono,
                                    fecha: noti.fecha_creacion,
                                    count: 0,
                                    usuarios: []
                                };
                            }

                            groupsMap[groupKey].count++;
                            groupsMap[groupKey].usuarios.push({
                                _id: user._id,
                                nombre: user.nombre || "Sin Nombre",
                                empresa: user.empresa || "Sin Empresa",
                                cargo: user.cargo || "Sin Cargo",
                                rol: user.rol || "Sin Rol",
                                mail: user.mail || "Sin Email",
                                notiId: noti.id,
                                fecha: noti.fecha_creacion,
                                leido: noti.leido
                            });
                        });
                    }
                });

                const groupsArray = Object.values(groupsMap).map(group => ({
                    ...group,
                    uniqueUserCount: new Set(group.usuarios.map(u => u._id)).size
                })).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                setNotificationGroups(groupsArray);

            } else {
                console.error("Error fetching users");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Handlers
    const handleOpenGroup = (group) => {
        if (!canViewDetails) return;
        setSelectedGroup(group);
        setSelectedUserIds([]);
        setDetailsFilter("");
        setRoleFilter("");
        setCargoFilter("");
        setCompanyFilter("");

        const companies = [...new Set(group.usuarios.map(u => u.empresa || "Sin Empresa"))].sort();
        const roles = [...new Set(group.usuarios.map(u => u.rol || "Sin Rol"))].sort();
        const cargos = [...new Set(group.usuarios.map(u => u.cargo || "Sin Cargo"))].sort();

        setUniqueCompanies(companies);
        setUniqueRoles(roles);
        setUniqueCargos(cargos);
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

    const toggleSelectAllUsers = (filteredUsers) => {
        if (!selectedGroup) return;
        const allIds = filteredUsers.map(u => u._id);

        const allSelected = allIds.every(id => selectedUserIds.includes(id));

        if (allSelected) {
            setSelectedUserIds(prev => prev.filter(id => !allIds.includes(id)));
        } else {
            const newSelection = [...new Set([...selectedUserIds, ...allIds])];
            setSelectedUserIds(newSelection);
        }
    };
    const getProcessedUsers = () => {
        if (!selectedGroup) return [];

        // 1. Group by User ID 
        const userMap = {};
        selectedGroup.usuarios.forEach(u => {
            if (!userMap[u._id]) {
                userMap[u._id] = {
                    ...u,
                    count: 0,
                    dates: []
                };
            }
            userMap[u._id].count++;
            userMap[u._id].dates.push(u.fecha);
        });

        const uniqueUsers = Object.values(userMap);

        // 2. Filter
        return uniqueUsers.filter(u => {
            const matchText = (u.nombre || "").toLowerCase().includes(detailsFilter.toLowerCase()) ||
                (u.mail || "").toLowerCase().includes(detailsFilter.toLowerCase());
            const matchCompany = companyFilter ? u.empresa === companyFilter : true;
            const matchRole = roleFilter ? u.rol === roleFilter : true;
            const matchCargo = cargoFilter ? u.cargo === cargoFilter : true;

            return matchText && matchCompany && matchRole && matchCargo;
        });
    };

    const processedUsers = getProcessedUsers();

    const handleDelete = async () => {
        if (!canDelete) {
            alert("No tienes permisos para eliminar notificaciones");
            return;
        }
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

            {/* SIDEBAR LOGIC INTEGRATED */}
            {(isMobileOpen || !isMobileScreen) && (
                <>
                    <Sidebar 
                        isCollapsed={!isDesktopOpen} 
                        onToggleCollapse={toggleSidebar} 
                        isMobileOpen={isMobileOpen} 
                        onNavigate={handleNavigation} 
                    />
                    {isMobileScreen && isMobileOpen && (
                        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileOpen(false)}></div>
                    )}
                </>
            )}

            {/* MOBILE FLOATING BUTTON */}
            {!isMobileOpen && isMobileScreen && (
                <div className="fixed bottom-4 left-4 z-50">
                    <Button 
                        variant="default" 
                        size="icon" 
                        onClick={toggleSidebar} 
                        iconName="Menu" 
                        className="w-12 h-12 rounded-full shadow-lg" 
                    />
                </div>
            )}

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
                                <thead className="bg-card sticky top-0 z-10 text-xs uppercase text-muted-foreground font-semibold shadow-sm">
                                    <tr>
                                        <th className="px-6 py-3">Tipo</th>
                                        <th className="px-6 py-3">Título / Descripción</th>
                                        <th className="px-6 py-3 text-center">Usuarios Afectados</th>
                                        {canViewDetails && <th className="px-6 py-3 text-right">Acción</th>}
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
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-muted`}>
                                                        <Icon name={group.tipo || 'Bell'} size={16} className="text-foreground" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 max-w-md">
                                                    <div>
                                                        <p className="font-semibold text-foreground break-words leading-tight">{group.titulo}</p>
                                                        <p className="text-xs text-muted-foreground break-words line-clamp-2 mt-1">{group.descripcion}</p>
                                                        <p className="text-[10px] text-muted-foreground mt-1 opacity-70">
                                                            {new Date(group.fecha).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                        {group.uniqueUserCount}
                                                    </span>
                                                </td>
                                                {canViewDetails && (
                                                    <td className="px-6 py-4 text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleOpenGroup(group)}
                                                        >
                                                            Ver Detalles
                                                        </Button>
                                                    </td>
                                                )}
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
                        <div className="p-6 border-b border-border flex justify-between items-start bg-muted/10 shrink-0">
                            <div className="max-w-[90%]">
                                <h2 className="text-xl font-bold flex items-start gap-3 text-foreground break-words">
                                    <div className="mt-1 shrink-0">
                                        <Icon name={selectedGroup.tipo || 'Bell'} className="text-primary" />
                                    </div>
                                    <span className="leading-snug">{selectedGroup.titulo}</span>
                                </h2>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed break-words">{selectedGroup.descripcion}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleCloseModal} iconName="X" />
                        </div>

                        {/* Details Toolbar & Filters */}
                        <div className="p-4 border-b border-border bg-card flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="relative">
                                    <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Buscar usuario..."
                                        className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={detailsFilter}
                                        onChange={(e) => setDetailsFilter(e.target.value)}
                                    />
                                </div>

                                <select
                                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={companyFilter}
                                    onChange={(e) => setCompanyFilter(e.target.value)}
                                >
                                    <option value="">Todas las Empresas</option>
                                    {uniqueCompanies.map((c, i) => (
                                        <option key={i} value={c}>{c}</option>
                                    ))}
                                </select>

                                <select
                                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <option value="">Todos los Roles</option>
                                    {uniqueRoles.map((r, i) => (
                                        <option key={i} value={r}>{r}</option>
                                    ))}
                                </select>

                                <select
                                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={cargoFilter}
                                    onChange={(e) => setCargoFilter(e.target.value)}
                                >
                                    <option value="">Todos los Cargos</option>
                                    {uniqueCargos.map((c, i) => (
                                        <option key={i} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 sm:pt-0">
                                {canDelete ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            checked={processedUsers.length > 0 && processedUsers.every(u => selectedUserIds.includes(u._id))}
                                            onChange={() => toggleSelectAllUsers(processedUsers)}
                                        />
                                        <span className="cursor-pointer" onClick={() => toggleSelectAllUsers(processedUsers)}>
                                            Seleccionar Visibles ({processedUsers.length})
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground">
                                        Mostrando {processedUsers.length} usuarios
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Users List */}
                        <div className="flex-1 overflow-auto p-0 relative">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-card sticky top-0 z-10 shadow-sm">
                                    <tr className="border-b border-border">
                                        {canDelete && <th className="px-6 py-4 w-12 font-medium text-muted-foreground"></th>}
                                        <th className="px-6 py-4 font-medium text-muted-foreground">Usuario</th>
                                        <th className="px-6 py-4 font-medium text-muted-foreground">Empresa</th>
                                        <th className="px-6 py-4 font-medium text-muted-foreground">Rol</th>
                                        <th className="px-6 py-4 font-medium text-muted-foreground">Cargo</th>
                                        <th className="px-6 py-4 font-medium text-muted-foreground">Fecha Notificación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-card">
                                    {processedUsers.map((u, i) => (
                                        <tr key={i} className={`hover:bg-muted/5 transition-colors ${selectedUserIds.includes(u._id) ? 'bg-primary/5' : ''}`}>
                                            {canDelete && (
                                                <td className="px-6 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-primary focus:ring-primary/50"
                                                        checked={selectedUserIds.includes(u._id)}
                                                        onChange={() => toggleSelectUser(u._id)}
                                                    />
                                                </td>
                                            )}
                                            <td className="px-6 py-3">
                                                <div className="font-medium">{u.nombre}</div>
                                                <div className="text-xs text-muted-foreground">{u.mail}</div>
                                            </td>
                                            <td className="px-6 py-3 text-muted-foreground">{u.empresa}</td>
                                            <td className="px-6 py-3 text-sm text-muted-foreground">{u.rol}</td>
                                            <td className="px-6 py-3 text-sm text-muted-foreground">{u.cargo}</td>
                                            <td className="px-6 py-3 text-xs text-muted-foreground">
                                                {u.count > 1 ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-primary">{u.count} ocurrencias</span>
                                                        <span className="text-[10px] opacity-70">Última: {new Date(Math.max(...u.dates.map(d => new Date(d).getTime()))).toLocaleString()}</span>
                                                    </div>
                                                ) : (
                                                    new Date(u.dates[0]).toLocaleString()
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Modal Footer */}
                        {selectedUserIds.length > 0 && canDelete && (
                            <div className="p-4 border-t border-border bg-card flex justify-end gap-3 shrink-0 rounded-b-xl">
                                <Button
                                    variant="danger"
                                    size="sm"
                                    iconName="Trash"
                                    onClick={handleDelete}
                                    loading={isDeleting}
                                >
                                    Eliminar ({selectedUserIds.length})
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNotificationManager;