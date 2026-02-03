import React, { useState, useEffect } from 'react';
import { useStore } from './components/lib/store';
import { Search, Plus, Shield, Users, Edit2, Trash2, CheckCircle2, Lock, Menu } from 'lucide-react';

// Componentes de UI consistentes con la otra vista
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import { RoleModal } from './components/RoleModal';

const RolesView = () => {
    const { roles, users, deleteRole } = useStore();
    
    // --- ESTADOS DE ESTRUCTURA (Copiados de RequestTracking) ---
    const [isDesktopOpen, setIsDesktopOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobileScreen, setIsMobileScreen] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );

    // --- ESTADOS DE LÓGICA DE ROLES ---
    const [searchQuery, setSearchQuery] = useState('');
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);

    // --- EFECTOS DE RESIZE Y RESPONSIVIDAD ---
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

    const toggleSidebar = () => {
        if (isMobileScreen) setIsMobileOpen(!isMobileOpen);
        else setIsDesktopOpen(!isDesktopOpen);
    };

    // --- LÓGICA DE NEGOCIO ---
    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getUserCount = (roleId) => {
        return users.filter(u => u.role === roleId).length;
    };

    const handleDelete = async (roleId) => {
        if (roleId === 'admin') {
            alert('No se puede eliminar el rol de Administrador.');
            return;
        }
        if (getUserCount(roleId) > 0) {
            alert('No se puede eliminar un rol que tiene usuarios asignados.');
            return;
        }
        if (window.confirm('¿Estás seguro de eliminar este rol?')) {
            await deleteRole(roleId);
        }
    };

    const getPermissionCount = (role) => {
        if (role.permissions.includes('all')) return 'Acceso Total';
        return `${role.permissions.length} permisos`;
    };

    // Clases dinámicas para el margen del contenido principal
    const mainMarginClass = isMobileScreen
        ? 'ml-0'
        : isDesktopOpen ? 'lg:ml-64' : 'lg:ml-16';

    return (
        <div className="min-h-screen bg-background">
            <Header />

            {/* SIDEBAR ESTRUCTURAL */}
            {(isMobileOpen || !isMobileScreen) && (
                <>
                    <Sidebar
                        isCollapsed={!isDesktopOpen}
                        onToggleCollapse={toggleSidebar}
                        isMobileOpen={isMobileOpen}
                        onNavigate={(path) => isMobileScreen && setIsMobileOpen(false)}
                    />
                    {isMobileScreen && isMobileOpen && (
                        <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={toggleSidebar}></div>
                    )}
                </>
            )}

            {/* BOTÓN FLOTANTE MÓVIL */}
            {!isMobileOpen && isMobileScreen && (
                <div className="fixed bottom-4 left-4 z-50">
                    <Button
                        variant="default"
                        size="icon"
                        onClick={toggleSidebar}
                        iconName="Menu"
                        className="w-12 h-12 rounded-full shadow-brand-active"
                    />
                </div>
            )}

            {/* CONTENIDO PRINCIPAL ADAPTADO */}
            <main className={`transition-all duration-300 ${mainMarginClass} pt-24 lg:pt-20`}>
                <div className="px-4 sm:px-6 lg:p-6 space-y-6 max-w-7xl mx-auto">
                    
                    {/* HEADER DE LA VISTA */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                                Roles y Permisos
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm lg:text-base">
                                Define qué pueden hacer los usuarios en el sistema.
                            </p>
                        </div>

                        <Button 
                            variant="default" 
                            iconName="Plus" 
                            onClick={() => setIsRoleModalOpen(true)}
                        >
                            Crear Nuevo Rol
                        </Button>
                    </div>

                    {/* BARRA DE BÚSQUEDA */}
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar roles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>

                    {/* GRID DE ROLES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        {filteredRoles.map(role => {
                            const userCount = getUserCount(role.id);
                            const isAdmin = role.id === 'admin';

                            return (
                                <div key={role.id} className="bg-card rounded-xl border border-border shadow-sm p-6 hover:shadow-md transition-all group relative flex flex-col">
                                    {/* Menu de Acciones */}
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                        <button
                                            onClick={() => setEditingRole(role)}
                                            className="p-1.5 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        {!isAdmin && (
                                            <button
                                                onClick={() => handleDelete(role.id)}
                                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${
                                            isAdmin ? 'bg-indigo-600' : 'bg-accent'
                                        }`}>
                                            <Shield size={24} />
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                                        {role.name}
                                        {isAdmin && <Lock size={14} className="text-amber-500" />}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[40px]">
                                        {role.description}
                                    </p>

                                    <div className="mt-auto space-y-4">
                                        <div className="flex items-center gap-2 text-sm text-foreground bg-muted/50 px-3 py-2 rounded-lg">
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                            <span>{getPermissionCount(role)}</span>
                                        </div>

                                        <div className="h-px bg-border" />

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Users size={16} />
                                                <span className="text-sm">Usuarios asignados</span>
                                            </div>
                                            <span className="text-lg font-bold text-foreground">{userCount}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            <RoleModal
                isOpen={isRoleModalOpen || !!editingRole}
                onClose={() => { setIsRoleModalOpen(false); setEditingRole(null); }}
                role={editingRole}
            />
        </div>
    );
}
export default RolesView;