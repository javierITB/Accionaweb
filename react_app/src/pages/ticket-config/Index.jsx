import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { apiFetch, API_BASE_URL } from '../../utils/api';

const TicketConfig = () => {
    // Estado del Sidebar
    const [isDesktopOpen, setIsDesktopOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

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

    const handleNavigation = () => {
        if (isMobileScreen) setIsMobileOpen(false);
    };

    const mainMarginClass = isMobileScreen ? 'ml-0' : isDesktopOpen ? 'ml-64' : 'ml-16';

    // --- LÓGICA DE CONFIGURACIÓN ---
    const [configs, setConfigs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Estado del Modal de Edición
    const [editingCategory, setEditingCategory] = useState(null); // Objeto completo de la categoría siendo editada
    const [statusesToEdit, setStatusesToEdit] = useState([]); // Array temporal de estados
    const [subcategoriesToEdit, setSubcategoriesToEdit] = useState([]); // Array temporal de subcategorías
    const [isSaving, setIsSaving] = useState(false);
    const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0, placement: 'bottom' });

    // Cargar Configuraciones
    const fetchConfigs = async () => {
        try {
            setIsLoading(true);
            const res = await apiFetch(`${API_BASE_URL}/config-tickets`);
            if (res.ok) {
                const data = await res.json();
                setConfigs(data);
            }
        } catch (error) {
            console.error("Error cargando config:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    // Abrir Modal
    const handleEditClick = (category) => {
        setEditingCategory(category);
        // Clonar profundo para evitar mutaciones directas
        setStatusesToEdit(JSON.parse(JSON.stringify(category.statuses || [])));
        setSubcategoriesToEdit(JSON.parse(JSON.stringify(category.subcategories || [])));
    };

    // Cerrar Modal
    const handleCloseModal = () => {
        setEditingCategory(null);
        setStatusesToEdit([]);
        setSubcategoriesToEdit([]);
    };

    // --- OPERACIONES EN EL MODAL ---

    // Actualizar un campo de un estado (label, value, color)
    const updateStatusField = (index, field, value) => {
        const updated = [...statusesToEdit];
        updated[index] = { ...updated[index], [field]: value };
        // Si cambia el label, actualizamos automáticamente el value (slug) si no ha sido tocado manualmente?
        // Por simplicidad, dejemos que el value se edite manual o sea igual al label slugificado.

        if (field === 'label' && !updated[index].manualValue) {
            updated[index].value = value.toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }
        setStatusesToEdit(updated);
    };

    // Agregar nuevo estado vacio
    const handleAddStatus = () => {
        setStatusesToEdit([
            ...statusesToEdit,
            { label: 'Nuevo Estado', value: 'nuevo_estado', color: 'gray', manualValue: false }
        ]);
    };

    // Eliminar estado
    const handleDeleteStatus = (index) => {
        if (!confirm("¿Seguro que deseas eliminar este estado?")) return;
        const updated = statusesToEdit.filter((_, i) => i !== index);
        setStatusesToEdit(updated);
    };

    // Actualizar subcategoría
    const updateSubcategoryField = (index, field, value) => {
        const updated = [...subcategoriesToEdit];
        updated[index] = { ...updated[index], [field]: value };
        if (field === 'label' && !updated[index].manualValue) {
            updated[index].value = value.toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }
        setSubcategoriesToEdit(updated);
    };

    const handleAddSubcategory = () => {
        setSubcategoriesToEdit([
            ...subcategoriesToEdit,
            { label: 'Nueva Subcategoría', value: 'nueva_subcategoria', manualValue: false }
        ]);
    };

    const handleDeleteSubcategory = (index) => {
        if (!confirm("¿Seguro que deseas eliminar esta subcategoría?")) return;
        const updated = subcategoriesToEdit.filter((_, i) => i !== index);
        setSubcategoriesToEdit(updated);
    };

    // Guardar Cambios (PUT)
    const handleSave = async () => {
        if (!editingCategory) return;

        // Validaciones básicas
        const hasEmpty = statusesToEdit.some(s => !s.label || !s.value);
        if (hasEmpty) {
            alert("Todos los estados deben tener nombre y valor interno.");
            return;
        }

        setIsSaving(true);
        try {
            const res = await apiFetch(`${API_BASE_URL}/config-tickets/${editingCategory.key}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    statuses: statusesToEdit,
                    subcategories: subcategoriesToEdit
                })
            });

            if (res.ok) {
                alert("Configuración actualizada correctamente.");
                await fetchConfigs(); // Recargar datos frescos
                handleCloseModal();
            } else {
                const err = await res.json();
                alert("Error al guardar: " + (err.error || err.message));
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al guardar.");
        } finally {
            setIsSaving(false);
        }
    };

    // Iconos disponibles
    const iconOptions = [
        { value: 'Clock', label: 'Reloj' },
        { value: 'FileText', label: 'Archivo' },
        { value: 'Send', label: 'Enviar' },
        { value: 'PenTool', label: 'Pluma' },
        { value: 'Building', label: 'Edificio' },
        { value: 'AlertTriangle', label: 'Alerta' },
        { value: 'XCircle', label: 'X Círculo' },
        { value: 'Timer', label: 'Timer' },
        { value: 'CheckCircle', label: 'Check Círculo' },
        { value: 'AlertCircle', label: 'Alerta Círculo' },
        { value: 'UserCheck', label: 'Usuario Check' },
        { value: 'Archive', label: 'Caja Archivo' },
        { value: 'HelpCircle', label: 'Ayuda' },
        { value: 'MessageSquare', label: 'Mensaje' },
        { value: 'Briefcase', label: 'Maletín' },
        { value: 'PlayCircle', label: 'Play' },
        { value: 'PauseCircle', label: 'Pausa' },
        { value: 'StopCircle', label: 'Stop' },
        { value: 'RefreshCw', label: 'Recargar' },
        { value: 'Shield', label: 'Escudo' },
        { value: 'Star', label: 'Estrella' },
        { value: 'Flag', label: 'Bandera' },
        { value: 'Inbox', label: 'Bandeja' }
    ];

    // Colores disponibles
    const colorOptions = [
        { value: 'gray', label: 'Gris' },
        { value: 'blue', label: 'Azul' },
        { value: 'green', label: 'Verde' },
        { value: 'yellow', label: 'Amarillo' },
        { value: 'red', label: 'Rojo' },
        { value: 'indigo', label: 'Índigo' },
        { value: 'purple', label: 'Púrpura' },
    ];

    const getStatusColorClass = (color) => {
        const map = {
            gray: 'bg-gray-100 text-gray-800',
            blue: 'bg-blue-100 text-blue-800',
            green: 'bg-green-100 text-green-800',
            yellow: 'bg-yellow-100 text-yellow-800',
            red: 'bg-red-100 text-red-800',
            indigo: 'bg-indigo-100 text-indigo-800',
            purple: 'bg-purple-100 text-purple-800',
        };
        return map[color] || map['gray'];
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <Header />

            {/* Sidebar logic */}
            {(isMobileOpen || !isMobileScreen) && (
                <>
                    <Sidebar
                        isCollapsed={!isDesktopOpen}
                        onToggleCollapse={toggleSidebar}
                        isMobileOpen={isMobileOpen}
                        onNavigate={handleNavigation}
                    />
                    {isMobileScreen && isMobileOpen && (
                        <div className="fixed inset-0 bg-black/50 z-40" onClick={toggleSidebar}></div>
                    )}
                </>
            )}

            {!isMobileOpen && isMobileScreen && (
                <div className="fixed bottom-4 left-4 z-50">
                    <Button variant="default" size="icon" onClick={toggleSidebar} iconName="Menu" className="w-12 h-12 rounded-full shadow-lg" />
                </div>
            )}

            <main className={`transition-all duration-300 ${mainMarginClass} pt-20 px-6 pb-10`}>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Configuración de Tickets</h1>
                        <p className="text-muted-foreground mt-1">Gestiona los estados y flujos de las categorías de tickets.</p>
                    </div>
                    <Button onClick={fetchConfigs} variant="outline" iconName="RefreshCw" size="sm">Actualizar</Button>
                </div>

                {isLoading ? (
                    <div className="text-center py-10">
                        <Icon name="Loader" className="animate-spin mx-auto text-primary" size={32} />
                        <p className="mt-2 text-muted-foreground">Cargando configuración...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {configs.map((cat) => (
                            <div key={cat.key} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold flex items-center">
                                        <Icon name={cat.key === 'sistema' ? 'Monitor' : 'FileText'} className="mr-2 text-primary" size={20} />
                                        {cat.name}
                                    </h2>

                                </div>

                                <div className="flex-1 space-y-3 mb-6">


                                    <details className="group" open>
                                        <summary className="list-none cursor-pointer flex items-center justify-between text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                            <span>Subcategorías</span>
                                            <Icon name="ChevronDown" size={14} className="transition-transform group-open:rotate-180" />
                                        </summary>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {cat.subcategories?.length > 0 ? (
                                                cat.subcategories.map((sub, idx) => (
                                                    <span key={idx} className="px-2 py-1 rounded-md text-xs font-medium border border-border bg-muted text-muted-foreground">
                                                        {sub.label}
                                                    </span>
                                                ))
                                            ) : (
                                                <p className="text-xs text-muted-foreground italic">Sin subcategorías definidas</p>
                                            )}
                                        </div>
                                    </details>

                                    <details className="group" open>
                                        <summary className="list-none cursor-pointer flex items-center justify-between text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 border-t pt-2">
                                            <span>Estados</span>
                                            <Icon name="ChevronDown" size={14} className="transition-transform group-open:rotate-180" />
                                        </summary>
                                        <div className="flex flex-wrap gap-2 pt-1 pb-3">
                                            {cat.statuses?.map((st, idx) => (
                                                <span key={idx} className={`px-2 py-1 rounded-md text-xs font-medium border border-transparent flex items-center gap-1 ${getStatusColorClass(st.color)}`}>
                                                    {st.icon && <Icon name={st.icon} size={12} />}
                                                    {st.label}
                                                </span>
                                            ))}
                                        </div>
                                    </details>
                                </div>

                                <Button
                                    variant="default"
                                    className="w-full mt-auto"
                                    iconName="Settings"
                                    onClick={() => handleEditClick(cat)}
                                >
                                    Editar Categoría
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* MODAL DE EDICIÓN */}
            {editingCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold">Editando: {editingCategory.name}</h2>
                                <p className="text-sm text-muted-foreground">Define las subcategorias y el flujo de estados para esta categoría.</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleCloseModal} iconName="X" />
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">

                            {/* SUBCATEGORÍAS */}
                            <details className="group" open>
                                <summary className="list-none cursor-pointer flex items-center justify-between text-lg font-semibold border-b pb-2 mb-4">
                                    <span>Gestión de Subcategorías</span>
                                    <Icon name="ChevronDown" size={18} className="transition-transform group-open:rotate-180" />
                                </summary>
                                <div className="space-y-4">
                                    {subcategoriesToEdit.length > 0 ? (
                                        subcategoriesToEdit.map((sub, index) => (
                                            <div key={index} className="flex gap-4 p-4 border border-border rounded-lg bg-muted/20 items-end">
                                                <div className="flex-1">
                                                    <label className="text-xs font-medium mb-1 block">Nombre Subcategoría</label>
                                                    <Input
                                                        value={sub.label}
                                                        onChange={(e) => updateSubcategoryField(index, 'label', e.target.value)}
                                                        placeholder="Ej: Facturación Electrónica"
                                                    />
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:bg-red-50 hover:text-red-700 h-10 w-10 shrink-0"
                                                    onClick={() => handleDeleteSubcategory(index)}
                                                    title="Eliminar subcategoría"
                                                >
                                                    <Icon name="Trash2" size={18} />
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic text-center py-4">
                                            No hay subcategorías definidas. Son opcionales.
                                        </p>
                                    )}

                                    <Button variant="outline" className="w-full border-dashed" iconName="Plus" onClick={handleAddSubcategory}>
                                        Agregar Nueva Subcategoría
                                    </Button>
                                </div>
                            </details>

                            {/* ESTADOS */}
                            <details className="group" open>
                                <summary className="list-none cursor-pointer flex items-center justify-between text-lg font-semibold border-b pb-2 mb-4">
                                    <span>Gestión de Estados</span>
                                    <Icon name="ChevronDown" size={18} className="transition-transform group-open:rotate-180" />
                                </summary>
                                <div className="space-y-4">
                                    {statusesToEdit.map((status, index) => (
                                        <div key={index} className="flex flex-col md:flex-row gap-4 p-4 border border-border rounded-lg bg-muted/20 items-end md:items-center">
                                            <div className="flex-1 w-full">
                                                <label className="text-xs font-medium mb-1 block">Nombre Visible</label>
                                                <Input
                                                    value={status.label}
                                                    onChange={(e) => updateStatusField(index, 'label', e.target.value)}
                                                    placeholder="Ej: En Revisión"
                                                />
                                            </div>

                                            <div className="w-full md:w-56 relative group">
                                                <label className="text-xs font-medium mb-1 block">Logo / Icono</label>
                                                <div className="relative">
                                                    <button
                                                        className="flex items-center justify-between w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                                        onClick={(e) => {
                                                            if (openDropdownIndex === index) {
                                                                setOpenDropdownIndex(null);
                                                                return;
                                                            }

                                                            // Calculate position
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            const spaceBelow = window.innerHeight - rect.bottom;
                                                            const dropdownHeight = 240;
                                                            const placeTop = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

                                                            setDropdownPos({
                                                                top: placeTop ? rect.top - dropdownHeight - 5 : rect.bottom + 5,
                                                                left: rect.left,
                                                                width: rect.width,
                                                                placement: placeTop ? 'top' : 'bottom'
                                                            });
                                                            setOpenDropdownIndex(index);
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2 max-w-[85%]">
                                                            {status.icon ? <Icon name={status.icon} size={16} className="shrink-0" /> : <span className="text-muted-foreground shrink-0"><Icon name="Image" size={16} /></span>}
                                                            <span className="truncate">{iconOptions.find(o => o.value === status.icon)?.label || status.icon || "Sin icono"}</span>
                                                        </div>
                                                        <Icon name="ChevronDown" size={14} className="opacity-50 shrink-0" />
                                                    </button>

                                                    {openDropdownIndex === index && (
                                                        <div
                                                            className="fixed z-[60] rounded-md border border-border bg-popover text-popover-foreground shadow-md overflow-hidden"
                                                            style={{
                                                                top: dropdownPos.top,
                                                                left: dropdownPos.left,
                                                                width: dropdownPos.width,
                                                                maxHeight: '240px'
                                                            }}
                                                        >
                                                            <div className="flex flex-col max-h-60 overflow-y-auto bg-popover">
                                                                {iconOptions.map(option => (
                                                                    <div
                                                                        key={option.value}
                                                                        className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted ${status.icon === option.value ? 'bg-muted font-medium' : ''}`}
                                                                        onClick={() => {
                                                                            updateStatusField(index, 'icon', option.value);
                                                                            setOpenDropdownIndex(null);
                                                                        }}
                                                                    >
                                                                        <Icon name={option.value} size={16} className="shrink-0" />
                                                                        <span className="truncate">{option.label}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* Overlay to close dropdown when clicking outside */}
                                                    {openDropdownIndex === index && (
                                                        <div className="fixed inset-0 z-[55] bg-transparent" onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenDropdownIndex(null);
                                                        }}></div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="w-full md:w-32">
                                                <label className="text-xs font-medium mb-1 block">Color</label>
                                                <select
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                    value={status.color}
                                                    onChange={(e) => updateStatusField(index, 'color', e.target.value)}
                                                >
                                                    {colorOptions.map(c => (
                                                        <option key={c.value} value={c.value}>{c.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:bg-red-50 hover:text-red-700 h-10 w-10 shrink-0"
                                                onClick={() => handleDeleteStatus(index)}
                                                title="Eliminar estado"
                                            >
                                                <Icon name="Trash2" size={18} />
                                            </Button>
                                        </div>
                                    ))}

                                    <Button variant="outline" className="w-full border-dashed" iconName="Plus" onClick={handleAddStatus}>
                                        Agregar Nuevo Estado
                                    </Button>
                                </div>
                            </details>


                        </div>

                        <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
                            <Button variant="ghost" onClick={handleCloseModal}>Cancelar</Button>
                            <Button variant="default" onClick={handleSave} loading={isSaving} iconName="Save">
                                Guardar Cambios
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketConfig;
