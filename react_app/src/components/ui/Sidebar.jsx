import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../AppIcon";
// Importamos LOGO_TENANT para la lógica de imágenes y API_BASE_URL para los permisos
import { API_BASE_URL, CURRENT_TENANT, LOGO_TENANT } from "../../utils/api";
import { MENU_STRUCTURE } from "../../config/menuStructure";
import { usePermissions } from "../../context/PermissionsContext";

const Sidebar = ({ isCollapsed = false, onToggleCollapse, className = "", isMobileOpen = false, onNavigate }) => {

    // --- LÓGICA DINÁMICA DEL LOGO ---
    const [logoSrc, setLogoSrc] = useState(`/logos/${LOGO_TENANT}/logo-header.png`);
    const [activeFloatingMenu, setActiveFloatingMenu] = useState(null);

    useEffect(() => {
        setLogoSrc(`/logos/${LOGO_TENANT}/logo-header.png`);
    }, [LOGO_TENANT]);

    const handleImageError = (e) => {
        e.target.onerror = null;
        // Fallback al logo por defecto si no existe la ruta específica
        setLogoSrc("/logo-header.png");
    };

    const location = useLocation();
    const navigate = useNavigate();

    const [openMenus, setOpenMenus] = useState(() => {
        const saved = sessionStorage.getItem("sidebar_open_menus");
        return saved ? JSON.parse(saved) : { "Gestión Principal": true };
    });

    const { userPermissions, isAdminRole, userRole } = usePermissions();
    const accordionRefs = useRef({});
    const floatingMenuRef = useRef(null);
    const buttonRefs = useRef({});

    const user = sessionStorage.getItem("user") || "Usuario";

    // Guardar estado de menús en cada cambio
    useEffect(() => {
        sessionStorage.setItem("sidebar_open_menus", JSON.stringify(openMenus));
    }, [openMenus]);

    useEffect(() => {
        MENU_STRUCTURE.forEach(item => {
            if (item.isAccordion && item.children) {
                const hasActiveChild = item.children.some(child =>
                    child.path === location.pathname || child.activeOn?.includes(location.pathname)
                );
                if (hasActiveChild) {
                    setOpenMenus(prev => ({
                        ...prev,
                        [item.name]: true
                    }));
                }
            }
        });
    }, [location.pathname]);

    // Lógica de cierre del menú flotante al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            const isClickOnButton = Object.values(buttonRefs.current).some(ref => ref?.contains(event.target));
            if (floatingMenuRef.current && !floatingMenuRef.current.contains(event.target) && !isClickOnButton) {
                setActiveFloatingMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const hasPermission = (itemPermission) => {
        const adminTenants = ["api", "formsdb", "infodesa", "acciona", "solunex"];
        const isAdminContext = adminTenants.includes(CURRENT_TENANT);

        // Regla 1: FormsDB (Admin) - Solo formsdb puede ver ciertos items
        const formsDbOnlyPermissions = [
            'view_pagos',
            'view_gestor_empresas',
            'view_acceso_registro_empresas'
        ];

        // Si el permiso es exclusivo de formsdb y el tenant actual NO es formsdb (ni api), ocultar
        if (formsDbOnlyPermissions.includes(itemPermission)) {
            const isFormsDbContext = CURRENT_TENANT === 'formsdb' || CURRENT_TENANT === 'api' || CURRENT_TENANT === 'infodesa';
            if (!isFormsDbContext) return false;
        }

        if (isAdminContext && itemPermission === 'view_comprobantes') return false;

        // Regla 2: Clientes NO deben ver la zona de Pagos (cubierto arriba, pero mantenemos por seguridad)
        // if (!isAdminContext && itemPermission === 'view_pagos') return false;

        // 1. Si es admin root (nombre 'Admin'), tiene acceso a todo.
        if (isAdminRole) return true;

        // 2. Si no requiere permiso específico, es público (dentro del panel)
        if (!itemPermission) return true;

        // 3. Verificar si el array de permisos incluye el requerido
        return userPermissions.includes(itemPermission);
    };

    // Verificar si una sección padre debe mostrarse (si tiene al menos un hijo visible)
    const shouldShowSection = (item) => {
        if (isAdminRole) return true;
        if (item.children) {
            return item.children.some(child => hasPermission(child.permission));
        }
        return hasPermission(item.permission);
    };

    const toggleAccordion = (name) => {
        setOpenMenus((prev) => {
            const willOpen = !prev[name];

            if (willOpen) {
                setTimeout(() => {
                    accordionRefs.current[name]?.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                    });
                }, 100);
            }

            return { ...prev, [name]: willOpen };
        });
    };


    const handleNavigation = (path) => {
        navigate(path);
        if (onNavigate) onNavigate(path);
        setActiveFloatingMenu(null);
    };

    // Corrección: Función específica para el logo que limpia el modo oscuro
    const handleLogoClick = () => {
        // document.documentElement.classList.remove('dark');
        // localStorage.setItem('theme', 'light');
        handleNavigation('/');
    };

    const isTextVisible = !(isCollapsed && !isMobileOpen);

    // Lógica de clic unificada para manejar el modo colapsado (Toggle)
    const handleItemClick = (item) => {
        if (isTextVisible) {
            if (item.isAccordion) {
                toggleAccordion(item.name);
            } else {
                handleNavigation(item.path);
            }
        } else {
            // Toggle: si clickeo el mismo que está abierto, lo cierro
            setActiveFloatingMenu(prev => prev === item.name ? null : item.name);
        }
    };

    const renderNavLink = (item, isChild = false) => {
        if (!hasPermission(item.permission)) return null;

        const isActive = location.pathname === item.path || item.activeOn?.includes(location.pathname);
        return (
            <button
                key={item.path}
                onClick={() => isChild ? handleNavigation(item.path) : handleItemClick(item)}
                className={`w-full flex items-center rounded-lg transition-all duration-200 mb-1
               ${isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted hover:text-foreground"}
               ${!isTextVisible ? "justify-center px-2 py-3" : isChild ? "pl-10 pr-3 py-2" : "px-3 py-3"}
            `}
                title={!isTextVisible && !isChild ? item.name : ""}
            >
                <Icon name={item.icon} size={isChild ? 16 : 20} className={isTextVisible && !isChild ? "mr-3" : ""} />
                {isTextVisible && (
                    <div className="flex-1 text-left min-w-0">
                        <div className={`${isChild ? "text-xs ml-2 font-medium" : "text-sm font-semibold"} truncate`}> {item.name}</div>
                    </div>
                )}
            </button>
        );
    };

    return (
        <aside className={`bg-card border-r border-border transition-all duration-300 
         ${isTextVisible ? "w-64" : "w-16"} 
         ${isMobileOpen ? "fixed inset-y-0 left-0 z-[60] shadow-2xl" : "hidden md:flex fixed left-0 top-0 bottom-0 z-40"} 
         ${className} flex flex-col`}>

            <div className="flex flex-col h-full">
                {/* Header del Sidebar */}
                <div className={`flex items-center px-4 py-6 border-b border-border/50 ${!isTextVisible ? "justify-center" : "justify-between"}`}>
                    <div
                        className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity w-full"
                        onClick={handleLogoClick}
                    >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden bg-background/50 border border-border/50 shadow-sm shrink-0">
                            <img
                                src={logoSrc}
                                alt={`Logo ${LOGO_TENANT}`}
                                onError={handleImageError}
                                className="max-w-full max-h-full p-1"
                                style={{ objectFit: 'contain' }}
                            />
                        </div>
                        {isTextVisible && (
                            <div className="flex flex-col min-w-0 flex-1">
                                <h1 className="text-md font-semibold text-foreground leading-snug capitalize break-words whitespace-normal">
                                    {`Solunex ${LOGO_TENANT.toUpperCase()}`}
                                </h1>
                                <span className="text-[10px] text-muted-foreground font-mono truncate">Panel de administración</span>
                            </div>
                        )}
                    </div>
                </div>

                <nav className={`flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden`}>
                    {MENU_STRUCTURE.map((item) => {
                        if (!shouldShowSection(item)) return null;

                        const isAccordion = !!item.isAccordion;
                        const isOpen = openMenus[item.name];
                        const isFloating = activeFloatingMenu === item.name;

                        // Lógica de resaltado azul para categorías activas con menú cerrado
                        const hasActiveChild = isAccordion && item.children?.some(child =>
                            location.pathname === child.path || child.activeOn?.includes(location.pathname)
                        );
                        const isDirectActive = !isAccordion && (location.pathname === item.path || item.activeOn?.includes(location.pathname));
                        const shouldHighlight = hasActiveChild || isDirectActive;

                        return (
                            <div key={item.name} className="relative space-y-1" ref={(el) => (accordionRefs.current[item.name] = el)}>
                                <button
                                    ref={(el) => (buttonRefs.current[item.name] = el)}
                                    onClick={() => handleItemClick(item)}
                                    className={`w-full flex items-center rounded-lg px-3 py-3 transition-all
                              ${shouldHighlight && !isTextVisible ? "bg-primary text-primary-foreground shadow-md" :
                                            (isOpen && isTextVisible) || isFloating ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}
                              ${!isTextVisible ? "justify-center" : "justify-between"}`}
                                    title={!isTextVisible ? item.name : ""}
                                >
                                    <div className="flex items-center">
                                        <Icon name={item.icon} size={20} className={isTextVisible ? "mr-3" : ""} />
                                        {isTextVisible && <span className="text-sm font-semibold">{item.name}</span>}
                                    </div>
                                    {isTextVisible && isAccordion && (
                                        <Icon name={isOpen ? "ChevronDown" : "ChevronRight"} size={14} className="opacity-50" />
                                    )}
                                </button>

                                {/* Menú Normal Desplegable */}
                                {isAccordion && isOpen && isTextVisible && (
                                    <div className="space-y-1 mx-2 mt-1 animate-in fade-in slide-in-from-top-1">
                                        {item.children.map(child => renderNavLink(child, true))}
                                    </div>
                                )}

                                {/* Menú Flotante para modo colapsado */}
                                {!isTextVisible && isFloating && (
                                    <div ref={floatingMenuRef} className="fixed left-16 ml-2 w-56 bg-card border border-border rounded-xl shadow-xl z-[100] py-2 animate-in fade-in zoom-in-95 slide-in-from-left-2">
                                        <div className="px-4 py-2 mb-1 border-b border-border/50">
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] opacity-80">{item.name}</span>
                                        </div>
                                        <div className="px-2 space-y-0.5">
                                            {item.children ? (
                                                item.children.map(child => {
                                                    const isChildActive = location.pathname === child.path || child.activeOn?.includes(location.pathname);
                                                    return (
                                                        <button key={child.path} onClick={() => handleNavigation(child.path)} className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${isChildActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                                                            <Icon name={child.icon} size={16} className={`mr-3 ${isChildActive ? "text-primary" : "opacity-70"}`} />
                                                            <span className="truncate">{child.name}</span>
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <button onClick={() => handleNavigation(item.path)} className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${location.pathname === item.path || item.activeOn?.includes(location.pathname) ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                                                    <Icon name={item.icon} size={16} className={`mr-3 ${location.pathname === item.path || item.activeOn?.includes(location.pathname) ? "text-primary" : "opacity-70"}`} />
                                                    <span className="truncate">{item.name}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="px-3 pb-2">
                    <button
                        onClick={onToggleCollapse}
                        className={`w-full flex items-center rounded-lg transition-all duration-200 px-3 py-3 text-muted-foreground hover:bg-muted hover:text-foreground
                     ${!isTextVisible ? "justify-center" : ""}
                  `}
                        title={isTextVisible ? "Contraer menú" : "Expandir menú"}
                    >
                        <Icon name={isMobileOpen ? "X" : isTextVisible ? "ChevronLeft" : "ChevronRight"} size={20} className={isTextVisible ? "mr-2" : ""} />
                        {isTextVisible && (
                            <div className="text-sm font-medium">Contraer menú</div>
                        )}
                    </button>
                </div>

                <div className="p-3 border-t border-border mt-auto">
                    <button
                        onClick={() => handleNavigation("/perfil")}
                        className={`w-full flex items-center rounded-lg transition-all duration-200 px-3 py-3 text-muted-foreground hover:bg-muted hover:text-foreground
                     ${!isTextVisible ? "justify-center" : ""} ${location.pathname === "/perfil" && !isTextVisible ? "bg-primary text-primary-foreground shadow-md" : ""}
                  `}
                        title={!isTextVisible ? "Ir a mi Perfil" : ""}
                    >
                        <Icon name="User" size={20} className={isTextVisible ? "mr-2" : ""} />
                        {isTextVisible && (
                            <div className="flex-1 text-left min-w-0">
                                <div className="text-sm font-medium truncate">Ir a mi Perfil</div>
                            </div>
                        )}
                    </button>
                </div>

                <div className="p-4 pt-0 flex items-center">
                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xs uppercase">
                        {(userRole || "GU").substring(0, 2)}
                    </div>
                    {isTextVisible && (
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium truncate">{user}</p>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{userRole}</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;