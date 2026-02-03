import React, { useState, useEffect } from 'react';
import { X, Shield, Check, Loader2 } from 'lucide-react';
import { apiFetch, API_BASE_URL } from '../../../utils/api';

// Cada vista del Sidebar es ahora una categoría independiente
const PERMISSION_GROUPS = {
    solicitudes_clientes: {
        label: 'Vista: Solicitudes de Clientes',
        permissions: [
            { id: 'view_solicitudes_clientes', label: 'Acceso a la vista' },
        ]
    },
    solicitudes_a_cliente: {
        label: 'Vista: Solicitudes a Cliente',
        permissions: [
            { id: 'view_solicitudes_a_cliente', label: 'Acceso a la vista' },
        ]
    },
    tickets: {
        label: 'Vista: Tickets',
        permissions: [
            { id: 'view_tickets', label: 'Acceso a la vista' },
        ]
    },
    domicilio_virtual: {
        label: 'Vista: Domicilio Virtual',
        permissions: [
            { id: 'view_domicilio_virtual', label: 'Acceso a la vista' },
        ]
    },
    // --- RENDIMIENTO ---
    rendimiento: {
        label: 'Vista: Rendimiento',
        permissions: [
            { id: 'view_rendimiento', label: 'Acceso a la vista' },
        ]
    },
    // --- CONFIGURACIÓN ---
    formularios: {
        label: 'Vista: Formularios',
        permissions: [
            { id: 'view_formularios', label: 'Acceso a la vista' },
        ]
    },
    plantillas: {
        label: 'Vista: Plantillas',
        permissions: [
            { id: 'view_plantillas', label: 'Acceso a la vista' },
        ]
    },
    config_tickets: {
        label: 'Vista: Config. Tickets',
        permissions: [
            { id: 'view_config_tickets', label: 'Acceso a la vista' },
        ]
    },
    anuncios: {
        label: 'Vista: Anuncios',
        permissions: [
            { id: 'view_anuncios', label: 'Acceso a la vista' },
        ]
    },
    // --- ADMINISTRACIÓN ---
    usuarios: {
        label: 'Vista: Usuarios',
        permissions: [
            { id: 'view_usuarios', label: 'Acceso a la vista' },
        ]
    },
    empresas: {
        label: 'Vista: Empresas',
        permissions: [
            { id: 'view_empresas', label: 'Acceso a la vista' },
        ]
    },
    gestor_roles: {
        label: 'Vista: Gestor de Roles',
        permissions: [
            { id: 'view_gestor_roles', label: 'Acceso a la vista' },
        ]
    },
    gestor_notificaciones: {
        label: 'Vista: Gestor Notificaciones',
        permissions: [
            { id: 'view_gestor_notificaciones', label: 'Acceso a la vista' },
        ]
    },
    registro_cambios: {
        label: 'Vista: Registro de Cambios',
        permissions: [
            { id: 'view_registro_cambios', label: 'Acceso a la vista' },
        ]
    },
    registro_ingresos: {
        label: 'Vista: Registro de Ingresos',
        permissions: [
            { id: 'view_registro_ingresos', label: 'Acceso a la vista' },
        ]
    }
};

export function RoleModal({ isOpen, onClose, onSuccess, role = null }) {
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [],
        color: '#4f46e5'
    });

    useEffect(() => {
        if (role) {
            setFormData({
                id: role._id, 
                name: role.name,
                description: role.description,
                permissions: role.permissions || [],
                color: role.color || '#4f46e5'
            });
        } else {
            setFormData({
                name: '',
                description: '',
                permissions: [],
                color: '#4f46e5'
            });
        }
    }, [role, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!formData.name) return;
        setIsSaving(true);
        try {
            const res = await apiFetch(`${API_BASE_URL}/roles`, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                onSuccess();
            } else {
                const err = await res.json();
                alert(err.error || "Error al guardar");
            }
        } catch (error) {
            alert("Error de conexión");
        } finally {
            setIsSaving(false);
        }
    };

    const togglePermission = (permId) => {
        if (role?.id === 'admin') return;
        setFormData(prev => {
            const hasPerm = prev.permissions.includes(permId);
            const newPerms = hasPerm
                ? prev.permissions.filter(p => p !== permId)
                : [...prev.permissions, permId];
            return { ...prev, permissions: newPerms };
        });
    };

    const toggleGroup = (groupId) => {
        if (role?.id === 'admin') return;
        const groupPerms = PERMISSION_GROUPS[groupId].permissions.map(p => p.id);
        const allSelected = groupPerms.every(p => formData.permissions.includes(p));

        setFormData(prev => {
            let newPerms = [...prev.permissions];
            if (allSelected) {
                newPerms = newPerms.filter(p => !groupPerms.includes(p));
            } else {
                groupPerms.forEach(p => {
                    if (!newPerms.includes(p)) newPerms.push(p);
                });
            }
            return { ...prev, permissions: newPerms };
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-border animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Shield size={20} className="text-accent" />
                        {role ? 'Editar Rol' : 'Crear Nuevo Rol'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Nombre del Rol</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent text-foreground"
                                disabled={role?.id === 'admin'}
                                placeholder="Ej: Auditor Externo"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Descripción</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent text-foreground resize-none"
                                placeholder="Define el propósito de este rol..."
                            />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Configuración de Permisos por Vista</h3>
                        <div className="space-y-4">
                            {Object.entries(PERMISSION_GROUPS).map(([groupId, group]) => {
                                const groupPermsIds = group.permissions.map(p => p.id);
                                const isAllSelected = groupPermsIds.every(id => formData.permissions.includes(id));
                                const isIndeterminate = groupPermsIds.some(id => formData.permissions.includes(id)) && !isAllSelected;

                                return (
                                    <div key={groupId} className="bg-muted/30 rounded-xl border border-border overflow-hidden">
                                        <div 
                                            className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted/70 transition-colors"
                                            onClick={() => toggleGroup(groupId)}
                                        >
                                            <span className="font-semibold text-sm text-foreground">{group.label}</span>
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                                isAllSelected || isIndeterminate ? 'bg-accent border-accent text-white' : 'bg-background border-border'
                                            }`}>
                                                {isAllSelected && <Check size={14} strokeWidth={3} />}
                                                {isIndeterminate && <div className="w-2.5 h-0.5 bg-white rounded-full" />}
                                            </div>
                                        </div>

                                        <div className="p-4 grid grid-cols-1 gap-3">
                                            {group.permissions.map(perm => (
                                                <label key={perm.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                                        formData.permissions.includes(perm.id) ? 'bg-accent border-accent text-white' : 'bg-background border-border'
                                                    }`}>
                                                        {formData.permissions.includes(perm.id) && <Check size={10} strokeWidth={3} />}
                                                    </div>
                                                    <span className="text-sm text-muted-foreground leading-tight">{perm.label}</span>
                                                    <input 
                                                        type="checkbox" 
                                                        className="hidden" 
                                                        checked={formData.permissions.includes(perm.id)}
                                                        onChange={() => togglePermission(perm.id)}
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-muted/20">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || !formData.name}
                        className="px-6 py-2 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving && <Loader2 size={16} className="animate-spin" />}
                        {role ? 'Guardar Cambios' : 'Crear Rol'}
                    </button>
                </div>
            </div>
        </div>
    );
}