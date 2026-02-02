import React, { useState } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const AdminNotificationManager = () => {
    // Sidebar State
    const [isDesktopOpen, setIsDesktopOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

    // Resize Handler
    React.useEffect(() => {
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

    // --- MOCK DATA ---
    const initialClients = [
        {
            id: 1,
            name: "Juan Pérez",
            company: "Constructora Andes",
            email: "juan.perez@andes.cl",
            notifications: [
                { id: 101, title: "Formulario Aprobado", date: "2024-01-28", type: "success" },
                { id: 102, title: "Documento Pendiente", date: "2024-01-25", type: "warning" },
                { id: 999, title: "Aviso de Mantenimiento", date: "2024-02-01", type: "info" } // Shared Mock
            ]
        },
        {
            id: 2,
            name: "Matías González",
            company: "Inversiones Norte",
            email: "matias.gonzalez@inversiones.cl",
            notifications: [
                { id: 201, title: "Solicitud Rechazada", date: "2024-01-20", type: "error" },
                { id: 999, title: "Aviso de Mantenimiento", date: "2024-02-01", type: "info" } // Shared Mock
            ]
        },
        {
            id: 3,
            name: "Pedro Soto",
            company: "Transportes Soto",
            email: "pedro@soto.cl",
            notifications: [
                { id: 999, title: "Aviso de Mantenimiento", date: "2024-02-01", type: "info" } // Shared Mock
            ]
        }
    ];

    const [clients, setClients] = useState(initialClients);
    const [selectedClient, setSelectedClient] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Bulk Selection State
    const [selectedClientIds, setSelectedClientIds] = useState([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

    // --- HANDLERS ---
    const handleViewNotifications = (client) => {
        setSelectedClient(client);
    };

    const handleCloseModal = () => {
        setSelectedClient(null);
    };

    const handleDeleteNotification = (notificationId) => {
        if (!selectedClient) return;

        // Remove from Selected Client locally
        const updatedNotifications = selectedClient.notifications.filter(n => n.id !== notificationId);
        const updatedClient = { ...selectedClient, notifications: updatedNotifications };

        // Update local state (Visual only)
        setSelectedClient(updatedClient);
        setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    };

    // Bulk Selection Handlers
    const toggleSelectClient = (clientId) => {
        setSelectedClientIds(prev => {
            if (prev.includes(clientId)) {
                return prev.filter(id => id !== clientId);
            } else {
                return [...prev, clientId];
            }
        });
    };

    const toggleSelectAll = (filteredList) => {
        if (selectedClientIds.length === filteredList.length) {
            setSelectedClientIds([]);
        } else {
            setSelectedClientIds(filteredList.map(c => c.id));
        }
    };

    const handleBulkDelete = () => {
        setIsBulkDeleteModalOpen(true);
    };

    const confirmBulkDelete = (notificationIdToDelete) => {
        // Mock deletion: Remove this notification ID from ALL selected clients
        setClients(prev => prev.map(client => {
            if (selectedClientIds.includes(client.id)) {
                return {
                    ...client,
                    notifications: client.notifications.filter(n => n.id !== notificationIdToDelete)
                };
            }
            return client;
        }));
        setIsBulkDeleteModalOpen(false);
        setSelectedClientIds([]); // Clear selection
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Header />
            <Sidebar isCollapsed={!isDesktopOpen} onToggleCollapse={toggleSidebar} isMobileOpen={isMobileOpen} onNavigate={handleNavigation} />

            <main className={`transition-all duration-300 ${mainMarginClass} pt-20 h-screen overflow-hidden flex flex-col`}>
                <div className="p-6 container-main flex-1 flex flex-col min-h-0">
                    {/* Page Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Gestor de Notificaciones</h1>
                            <p className="text-muted-foreground text-sm">Administra las alertas visibles para los clientes.</p>
                        </div>
                        {/* Search */}
                        <div className="relative w-72">
                            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Bulk Actions Bar */}
                    {selectedClientIds.length > 0 && (
                        <div className="mb-4 bg-primary/10 border border-primary/20 p-3 rounded-lg flex justify-between items-center animate-in slide-in-from-top-2">
                            <span className="text-sm font-semibold text-primary pl-2">
                                {selectedClientIds.length} cliente(s) seleccionado(s)
                            </span>
                            <Button
                                variant="secondary"
                                className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/20"
                                size="sm"
                                onClick={handleBulkDelete}
                                iconName="Trash"
                            >
                                Eliminar Notificación Compartida
                            </Button>
                        </div>
                    )}

                    {/* Client List */}
                    <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/40 sticky top-0 z-10 text-xs uppercase text-muted-foreground font-semibold">
                                    <tr>
                                        <th className="px-4 py-3 w-10 text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-primary focus:ring-primary/50"
                                                checked={filteredClients.length > 0 && selectedClientIds.length === filteredClients.length}
                                                onChange={() => toggleSelectAll(filteredClients)}
                                            />
                                        </th>
                                        <th className="px-6 py-3">Nombre</th>
                                        <th className="px-6 py-3">Empresa</th>
                                        <th className="px-6 py-3 text-center">Cant. Notificaciones</th>
                                        <th className="px-6 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredClients.map(client => (
                                        <tr key={client.id} className={`hover:bg-muted/10 transition-colors ${selectedClientIds.includes(client.id) ? 'bg-primary/5' : ''}`}>
                                            <td className="px-4 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-primary focus:ring-primary/50"
                                                    checked={selectedClientIds.includes(client.id)}
                                                    onChange={() => toggleSelectClient(client.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                <div className="flex flex-col">
                                                    <span>{client.name}</span>
                                                    <span className="text-xs text-muted-foreground font-normal">{client.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{client.company}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold ${client.notifications.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {client.notifications.length}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="outlineTeal"
                                                    size="sm"
                                                    onClick={() => handleViewNotifications(client)}
                                                    iconName="Bell"
                                                >
                                                    Ver
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* NOTIFICATIONS SIDE PANEL */}
            {selectedClient && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleCloseModal}></div>
                    <div className="relative w-full max-w-md bg-background h-full shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-300">
                        <div className="p-4 border-b border-border flex items-center justify-between bg-card/50">
                            <div>
                                <h3 className="font-bold text-lg">Notificaciones</h3>
                                <p className="text-xs text-muted-foreground">De: {selectedClient.name}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleCloseModal} iconName="X" />
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
                            {selectedClient.notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
                                    <Icon name="BellOff" size={32} className="mb-2 opacity-20" />
                                    <p className="text-sm">Sin notificaciones activas.</p>
                                </div>
                            ) : (
                                selectedClient.notifications.map(notif => (
                                    <div key={notif.id} className="bg-card border border-border p-4 rounded-lg shadow-sm group hover:border-primary/30 transition-all">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Icon name={notif.type === 'error' ? 'AlertCircle' : notif.type === 'warning' ? 'AlertTriangle' : notif.type === 'info' ? 'Info' : 'CheckCircle'}
                                                        size={14}
                                                        className={notif.type === 'error' ? 'text-red-500' : notif.type === 'warning' ? 'text-amber-500' : notif.type === 'info' ? 'text-blue-500' : 'text-green-500'}
                                                    />
                                                    <span className="font-semibold text-sm">{notif.title}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Fecha: {notif.date}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteNotification(notif.id)}
                                                className="text-muted-foreground hover:text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors"
                                                title="Eliminar notificación"
                                            >
                                                <Icon name="Trash" size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-border bg-card/50">
                            <Button className="w-full" variant="outline" onClick={handleCloseModal}>Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* BULK DELETE MODAL (MOCK) */}
            {isBulkDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsBulkDeleteModalOpen(false)}></div>
                    <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-2">Eliminar Notificación Compartida</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Selecciona la notificación que deseas eliminar de los <strong>{selectedClientIds.length}</strong> usuarios seleccionados.
                        </p>

                        <div className="bg-muted/30 p-4 rounded-lg border border-border mb-4 space-y-2">
                            <div className="flex items-center justify-between p-3 bg-background border border-border rounded shadow-sm hover:border-primary cursor-pointer transition-colors"
                                onClick={() => confirmBulkDelete(999)}>
                                <div className="flex items-center gap-3">
                                    <Icon name="Info" className="text-blue-500" size={18} />
                                    <div>
                                        <p className="font-semibold text-sm">Aviso de Mantenimiento</p>
                                        <p className="text-xs text-muted-foreground">ID: 999 - (Simulada como compartida)</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-destructive hover:underline">Eliminar</span>
                            </div>
                            {/* More mock items could go here */}
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsBulkDeleteModalOpen(false)}>Cancelar</Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminNotificationManager;
