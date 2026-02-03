import React, { useState, useEffect } from 'react';
import { X, Shield, Check } from 'lucide-react';
import { useStore } from './lib/store';

const PERMISSION_GROUPS = {
    dashboard: {
        label: 'Dashboard',
        permissions: [
            { id: 'view_dashboard', label: 'Ver Dashboard' }
        ]
    },
    users: {
        label: 'Usuarios',
        permissions: [
            { id: 'manage_users', label: 'Gestionar Usuarios (Crear/Editar/Borrar)' },
            { id: 'view_users', label: 'Ver Lista de Usuarios' }
        ]
    },
    teams: {
        label: 'Equipos',
        permissions: [
            { id: 'manage_teams', label: 'Gestionar Equipos' },
            { id: 'view_teams', label: 'Ver Equipos' }
        ]
    },
    contacts: {
        label: 'Contactos',
        permissions: [
            { id: 'view_contacts', label: 'Ver Contactos' },
            { id: 'create_contacts', label: 'Crear Contactos' },
            { id: 'edit_contacts', label: 'Editar Contactos' },
            { id: 'delete_contacts', label: 'Eliminar Contactos' }
        ]
    },
    deals: {
        label: 'Oportunidades (Pipeline)',
        permissions: [
            { id: 'view_deals', label: 'Ver Pipeline' },
            { id: 'create_deals', label: 'Crear Oportunidades' },
            { id: 'edit_deals', label: 'Editar Oportunidades' },
            { id: 'delete_deals', label: 'Eliminar Oportunidades' }
        ]
    },
    reports: {
        label: 'Reportes',
        permissions: [
            { id: 'view_reports', label: 'Ver Reportes y Estadísticas' },
            { id: 'export_data', label: 'Exportar Datos' }
        ]
    }
};

export function RoleModal({ isOpen, onClose, role = null }) {
    const { addRole, updateRole } = useStore();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: []
    });

    useEffect(() => {
        if (role) {
            setFormData({
                name: role.name,
                description: role.description,
                permissions: role.permissions || []
            });
        } else {
            setFormData({
                name: '',
                description: '',
                permissions: []
            });
        }
    }, [role, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!formData.name) return;

        if (role) {
            await updateRole(role.id, formData);
        } else {
            await addRole(formData);
        }
        onClose();
    };

    const togglePermission = (permId) => {
        setFormData(prev => {
            const hasPerm = prev.permissions.includes(permId);
            const newPerms = hasPerm
                ? prev.permissions.filter(p => p !== permId)
                : [...prev.permissions, permId];
            return { ...prev, permissions: newPerms };
        });
    };

    const toggleGroup = (groupId) => {
        const groupPerms = PERMISSION_GROUPS[groupId].permissions.map(p => p.id);
        const allSelected = groupPerms.every(p => formData.permissions.includes(p));

        setFormData(prev => {
            let newPerms = [...prev.permissions];
            if (allSelected) {
                // Remove all
                newPerms = newPerms.filter(p => !groupPerms.includes(p));
            } else {
                // Add missing
                groupPerms.forEach(p => {
                    if (!newPerms.includes(p)) newPerms.push(p);
                });
            }
            return { ...prev, permissions: newPerms };
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Shield size={20} className="text-indigo-600" />
                        {role ? 'Editar Rol' : 'Crear Nuevo Rol'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Rol</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej. Editor de Contenido"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                                disabled={role?.id === 'admin'} // Admin name locked
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe las responsabilidades de este rol..."
                                rows={2}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none"
                            />
                        </div>
                    </div>

                    {/* Permissions Editor */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Permisos del Sistema</h3>
                        <div className="space-y-6">
                            {Object.entries(PERMISSION_GROUPS).map(([groupId, group]) => {
                                const groupPermsIds = group.permissions.map(p => p.id);
                                const isAllSelected = groupPermsIds.every(id => formData.permissions.includes(id));
                                const isIndeterminate = groupPermsIds.some(id => formData.permissions.includes(id)) && !isAllSelected;

                                return (
                                    <div key={groupId} className="bg-slate-50 dark:bg-zinc-800/30 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                                        {/* Group Header */}
                                        <div
                                            className="px-4 py-3 bg-slate-100 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 flex items-center justify-between cursor-pointer"
                                            onClick={() => toggleGroup(groupId)}
                                        >
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">{group.label}</span>
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isAllSelected || isIndeterminate
                                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                                    : 'bg-white dark:bg-zinc-700 border-slate-300 dark:border-zinc-600'
                                                }`}>
                                                {isAllSelected && <Check size={14} strokeWidth={3} />}
                                                {isIndeterminate && <div className="w-2.5 h-0.5 bg-white rounded-full" />}
                                            </div>
                                        </div>

                                        {/* Permissions List */}
                                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {group.permissions.map(perm => {
                                                const isSelected = formData.permissions.includes(perm.id) || formData.permissions.includes('all');
                                                const isDisabled = role?.id === 'admin';

                                                return (
                                                    <label
                                                        key={perm.id}
                                                        className={`flex items-start gap-3 p-2 rounded-lg transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-100 dark:hover:bg-zinc-700/50'
                                                            } ${isDisabled ? 'cursor-not-allowed opacity-75' : ''}`}
                                                    >
                                                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected
                                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                : 'bg-white dark:bg-zinc-800 border-slate-300 dark:border-zinc-600'
                                                            }`}>
                                                            {isSelected && <Check size={10} strokeWidth={3} />}
                                                        </div>
                                                        <span className="text-sm text-slate-600 dark:text-slate-300 select-none leading-tight">{perm.label}</span>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={isSelected}
                                                            onChange={() => !isDisabled && togglePermission(perm.id)}
                                                            disabled={isDisabled}
                                                        />
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 shrink-0 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-zinc-900">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!formData.name}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {role ? 'Guardar Cambios' : 'Crear Rol'}
                    </button>
                </div>

            </div>
        </div>
    );
}
