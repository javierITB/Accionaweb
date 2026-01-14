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
    const [dropdownType, setDropdownType] = useState(null); // 'icon' | 'color'
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

    // Eliminar categoría
    const handleDeleteCategory = async () => {
        if (!editingCategory || editingCategory.isNew) return;
        if (!confirm(`¿Estás SEGURO de eliminar la categoría "${editingCategory.name}"? Esta acción no se puede deshacer.`)) return;

        setIsSaving(true);
        try {
            const res = await apiFetch(`${API_BASE_URL}/config-tickets/${editingCategory.key}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert("Categoría eliminada correctamente.");
                await fetchConfigs();
                handleCloseModal();
            } else {
                const err = await res.json();
                alert("Error al eliminar: " + (err.error || err.message));
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al eliminar.");
        } finally {
            setIsSaving(false);
        }
    };

    // Guardar Cambios
    const handleSave = async () => {
        if (!editingCategory) return;

        if (editingCategory.isNew && !editingCategory.name.trim()) {
            alert("El nombre de la categoría es obligatorio.");
            return;
        }

        const hasEmpty = statusesToEdit.some(s => !s.label || !s.value);
        if (hasEmpty) {
            alert("Todos los estados deben tener nombre y valor interno.");
            return;
        }

        setIsSaving(true);
        try {
            const isNew = editingCategory.isNew;
            const url = isNew ? `${API_BASE_URL}/config-tickets` : `${API_BASE_URL}/config-tickets/${editingCategory.key}`;
            const method = isNew ? 'POST' : 'PUT';

            const body = {
                statuses: statusesToEdit,
                subcategories: subcategoriesToEdit
            };

            if (isNew) {
                body.name = editingCategory.name;
            }
            if (editingCategory.icon) {
                body.icon = editingCategory.icon;
            }

            const res = await apiFetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert(isNew ? "Categoría creada correctamente." : "Configuración actualizada correctamente.");
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
        { value: 'Monitor', label: 'Monitor' },
        { value: 'Cpu', label: 'CPU' },
        { value: 'Smartphone', label: 'Smartphone' },
        { value: 'Database', label: 'Base de Datos' },
        { value: 'Server', label: 'Servidor' },
        { value: 'Wifi', label: 'Wifi' },
        { value: 'Settings', label: 'Configuración' },
        { value: 'Users', label: 'Usuarios' },
        { value: 'CreditCard', label: 'Tarjeta Crédito' },
        { value: 'ShoppingCart', label: 'Carrito' },
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
        { value: 'slate', label: 'Pizarra' },
        { value: 'gray', label: 'Gris' },
        { value: 'zinc', label: 'Zinc' },
        { value: 'neutral', label: 'Neutral' },
        { value: 'stone', label: 'Piedra' },
        { value: 'red', label: 'Rojo' },
        { value: 'orange', label: 'Naranja' },
        { value: 'amber', label: 'Ámbar' },
        { value: 'yellow', label: 'Amarillo' },
        { value: 'lime', label: 'Lima' },
        { value: 'green', label: 'Verde' },
        { value: 'emerald', label: 'Esmeralda' },
        { value: 'teal', label: 'Verde Azulado' },
        { value: 'cyan', label: 'Cian' },
        { value: 'sky', label: 'Celeste' },
        { value: 'blue', label: 'Azul' },
        { value: 'indigo', label: 'Índigo' },
        { value: 'violet', label: 'Violeta' },
        { value: 'purple', label: 'Púrpura' },
        { value: 'fuchsia', label: 'Fucsia' },
        { value: 'pink', label: 'Rosa' },
        { value: 'rose', label: 'Rosa Intenso' },
    ];

    const getStatusColorClass = (color) => {
        const map = {
            slate: 'bg-slate-600 text-black',
            gray: 'bg-gray-600 text-black',
            zinc: 'bg-zinc-600 text-black',
            neutral: 'bg-neutral-600 text-black',
            stone: 'bg-stone-600 text-black',
            red: 'bg-red-600 text-black font-bold',
            orange: 'bg-orange-600 text-black',
            amber: 'bg-amber-600 text-black',
            yellow: 'bg-yellow-600 text-black',
            lime: 'bg-lime-600 text-black',
            green: 'bg-green-600 text-black',
            emerald: 'bg-emerald-600 text-black',
            teal: 'bg-teal-600 text-black',
            cyan: 'bg-cyan-600 text-black',
            sky: 'bg-sky-600 text-black',
            blue: 'bg-blue-600 text-black',
            indigo: 'bg-indigo-600 text-black',
            violet: 'bg-violet-600 text-black',
            purple: 'bg-purple-600 text-black',
            fuchsia: 'bg-fuchsia-600 text-black',
            pink: 'bg-pink-600 text-black',
            rose: 'bg-rose-600 text-black',
        };
        return map[color] || map['gray'];
    };

    // Helper para obtener el color vibrante (500) para el preview
    const getPreviewColorClass = (color) => {
        const map = {
            slate: 'bg-slate-500', gray: 'bg-gray-500', zinc: 'bg-zinc-500', neutral: 'bg-neutral-500', stone: 'bg-stone-500',
            red: 'bg-red-500', orange: 'bg-orange-500', amber: 'bg-amber-500', yellow: 'bg-yellow-500', lime: 'bg-lime-500',
            green: 'bg-green-500', emerald: 'bg-emerald-500', teal: 'bg-teal-500', cyan: 'bg-cyan-500', sky: 'bg-sky-500',
            blue: 'bg-blue-500', indigo: 'bg-indigo-500', violet: 'bg-violet-500', purple: 'bg-purple-500', fuchsia: 'bg-fuchsia-500',
            pink: 'bg-pink-500', rose: 'bg-rose-500',
        };
        return map[color] || 'bg-gray-500';
    };

    const handleCreateClick = () => {
        setStatusesToEdit([]);
        setSubcategoriesToEdit([]);
        setEditingCategory({
            isNew: true,
            name: '',
            key: '',
            icon: 'FileText',
            statuses: [],
            subcategories: []
        });
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
                    <div className="flex gap-2">
                        <Button onClick={fetchConfigs} variant="outline" iconName="RefreshCw" size="sm">Actualizar</Button>
                        <Button onClick={handleCreateClick} variant="default" iconName="Plus" size="sm">Nueva Categoría</Button>
                    </div>
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
                                        <Icon name={cat.icon || (cat.key === 'sistema' ? 'Monitor' : 'FileText')} className="mr-2 text-primary" size={20} />
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
                                                <span key={idx} className={`px-2 py-1 rounded-full text-xs font-medium uppercase flex items-center gap-1 ${getStatusColorClass(st.color)}`}>
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
                        <div className="p-6 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1 w-full">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="relative group">
                                        <button
                                            className="w-12 h-12 rounded-lg border border-input bg-background flex items-center justify-center hover:bg-muted transition-colors relative overflow-hidden"
                                            onClick={() => {
                                                if (dropdownType === 'catIcon') {
                                                    setDropdownType(null);
                                                    setOpenDropdownIndex(null);
                                                } else {
                                                    setDropdownType('catIcon');
                                                    setOpenDropdownIndex('catHeader');
                                                    // Simple positioning for header dropdown
                                                    setDropdownPos({ top: 180, left: 40, width: 220, placement: 'bottom' });
                                                }
                                            }}
                                            title="Cambiar icono de categoría"
                                        >
                                            <Icon name={editingCategory.icon || 'FileText'} size={24} />
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Icon name="Edit2" size={16} className="text-white" />
                                            </div>
                                        </button>
                                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            Cambiar
                                        </div>
                                        {openDropdownIndex === 'catHeader' && dropdownType === 'catIcon' && (
                                            <>
                                                <div className="absolute top-14 left-0 z-[60] w-64 rounded-md border border-border bg-popover text-popover-foreground shadow-md max-h-60 overflow-y-auto">
                                                    {iconOptions.map(option => (
                                                        <div
                                                            key={option.value}
                                                            className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted ${editingCategory.icon === option.value ? 'bg-muted font-medium' : ''}`}
                                                            onClick={() => {
                                                                setEditingCategory({ ...editingCategory, icon: option.value });
                                                                setDropdownType(null);
                                                                setOpenDropdownIndex(null);
                                                            }}
                                                        >
                                                            <Icon name={option.value} size={16} className="shrink-0" />
                                                            <span className="truncate">{option.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="fixed inset-0 z-[55]" onClick={() => { setDropdownType(null); setOpenDropdownIndex(null); }}></div>
                                            </>
                                        )}
                                    </div>

                                    {editingCategory.isNew ? (
                                        <Input
                                            placeholder="Nombre Nueva Categoría"
                                            value={editingCategory.name}
                                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                            className="text-xl font-bold h-12"
                                        />
                                    ) : (
                                        <h2 className="text-2xl font-bold">{editingCategory.name}</h2>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground ml-16">
                                    Configura las subcategorías y el flujo de estados.
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleCloseModal} iconName="X" className="self-start md:self-center" />
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
                                                            if (openDropdownIndex === index && dropdownType === 'icon') {
                                                                setOpenDropdownIndex(null);
                                                                setDropdownType(null);
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
                                                            setDropdownType('icon');
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2 max-w-[85%]">
                                                            {status.icon ? <Icon name={status.icon} size={16} className="shrink-0" /> : <span className="text-muted-foreground shrink-0"><Icon name="Image" size={16} /></span>}
                                                            <span className="truncate">{iconOptions.find(o => o.value === status.icon)?.label || status.icon || "Sin icono"}</span>
                                                        </div>
                                                        <Icon name="ChevronDown" size={14} className="opacity-50 shrink-0" />
                                                    </button>

                                                    {openDropdownIndex === index && dropdownType === 'icon' && (
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
                                                                            setDropdownType(null);
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
                                                            setDropdownType(null);
                                                        }}></div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="w-full md:w-32">
                                                <label className="text-xs font-medium mb-1 block">Color</label>
                                                <div className="relative">
                                                    <button
                                                        className="flex items-center justify-between w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                                        onClick={(e) => {
                                                            if (openDropdownIndex === index && dropdownType === 'color') {
                                                                setOpenDropdownIndex(null);
                                                                setDropdownType(null);
                                                                return;
                                                            }

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
                                                            setDropdownType('color');
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-4 h-4 rounded-full ${getPreviewColorClass(status.color)}`}></div>
                                                            <span className="truncate">{colorOptions.find(o => o.value === status.color)?.label || status.color}</span>
                                                        </div>
                                                        <Icon name="ChevronDown" size={14} className="opacity-50 shrink-0" />
                                                    </button>

                                                    {openDropdownIndex === index && dropdownType === 'color' && (
                                                        <>
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
                                                                    {colorOptions.map(option => (
                                                                        <div
                                                                            key={option.value}
                                                                            className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted ${status.color === option.value ? 'bg-muted font-medium' : ''}`}
                                                                            onClick={() => {
                                                                                updateStatusField(index, 'color', option.value);
                                                                                setOpenDropdownIndex(null);
                                                                                setDropdownType(null);
                                                                            }}
                                                                        >
                                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm ${getPreviewColorClass(option.value)}`}>
                                                                                {status.icon ? <Icon name={status.icon} size={16} strokeWidth={3} /> : <span className="text-xs font-bold">Tx</span>}
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <span className="text-sm font-semibold">{option.label || 'Nuevo Estado'}</span>
                                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                                    {status.icon && <Icon name={status.icon} size={10} strokeWidth={3} />}
                                                                                    <span>{option.value}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="fixed inset-0 z-[55] bg-transparent" onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenDropdownIndex(null);
                                                                setDropdownType(null);
                                                            }}></div>
                                                        </>
                                                    )}
                                                </div>
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

                        <div className="p-6 border-t border-border bg-muted/10 flex justify-between gap-3">
                            {!editingCategory.isNew ? (
                                <Button
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    iconName="Trash2"
                                    onClick={handleDeleteCategory}
                                >
                                    Eliminar Categoría
                                </Button>
                            ) : <div></div>}

                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={handleCloseModal}>Cancelar</Button>
                                <Button variant="default" onClick={handleSave} loading={isSaving} iconName="Save">
                                    Guardar Cambios
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketConfig;
