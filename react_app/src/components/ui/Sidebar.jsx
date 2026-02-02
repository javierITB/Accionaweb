import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../AppIcon";
import logo from "/logo2.png";

const Sidebar = ({ isCollapsed = false, onToggleCollapse, className = "", isMobileOpen = false, onNavigate }) => {
   const MENU_STRUCTURE = [
      {
         name: "Gestión Principal",
         icon: "LayoutDashboard",
         isAccordion: true,
         roles: ["admin", "RRHH", "SoloLectura"],
         children: [
            { name: "Solicitudes de Clientes", path: "/RespuestasForms", icon: "FileText", roles: ["admin", "RRHH", "SoloLectura"] },
            { name: "Solicitudes a Cliente", path: "/Solicitudes", icon: "Pencil", roles: ["admin", "RRHH", "SoloLectura"] },
            { name: "Tickets", path: "/Tickets", icon: "FileText", roles: ["admin", "RRHH", "soporte", "SoloLectura"] },
            { name: "Domicilio Virtual", path: "/DomicilioVirtual", icon: "Home", roles: ["admin"] },
         ]
      },
      {
         name: "Rendimiento",
         path: "/dashboard-home",
         icon: "BarChart2",
         roles: ["admin", "SoloLectura"]
      },
      {
         name: "Configuración",
         icon: "Settings",
         isAccordion: true,
         roles: ["admin", "RRHH", "SoloLectura"],
         children: [
            { name: "Formularios", path: "/form-center", icon: "FileText", roles: ["admin", "RRHH", "SoloLectura"] },
            { name: "Plantillas", path: "/template-builder", icon: "FileText", roles: ["admin", "RRHH", "SoloLectura"] },
            { name: "Config. Tickets", path: "/config-tickets", icon: "Settings", roles: ["admin", "SoloLectura"] },
            { name: "Anuncios", path: "/anuncios", icon: "Megaphone", roles: ["admin", "RRHH", "SoloLectura"] },
         ]
      },
      {
         name: "Administración",
         icon: "Shield",
         isAccordion: true,
         roles: ["admin", "RRHH", "SoloLectura"],
         children: [
            { name: "Usuarios", path: "/users", icon: "User", roles: ["admin", "RRHH", "SoloLectura"] },
            { name: "Empresas", path: "/empresas", icon: "Building2", roles: ["admin", "RRHH", "SoloLectura"] },
            { name: "Gestor Notificaciones", path: "/config-notificaciones", icon: "Bell", roles: ["admin", "RRHH"] },
            { name: "Registro de cambios", path: "/registro-cambios", icon: "FileText", roles: ["admin", "RRHH", "SoloLectura"] },
         ]
      },
   ];

   const location = useLocation();
   const navigate = useNavigate();
   
   const [openMenus, setOpenMenus] = useState({ "Gestión Principal": true });
   const [floatingMenu, setFloatingMenu] = useState(null);
   const floatingRef = useRef(null);
   const sidebarRef = useRef(null);

   const user = sessionStorage.getItem("user") || "Usuario";
   const userRole = sessionStorage.getItem("rol") || "guest";

   useEffect(() => {
      MENU_STRUCTURE.forEach(item => {
         if (item.isAccordion && item.children) {
            const hasActiveChild = item.children.some(child => child.path === location.pathname);
            if (hasActiveChild) {
               setOpenMenus(prev => ({ ...prev, [item.name]: true }));
            }
         }
      });
   }, [location.pathname]);

   useEffect(() => {
      const handleClickOutside = (event) => {
         if (floatingRef.current && !floatingRef.current.contains(event.target) && 
             sidebarRef.current && !sidebarRef.current.contains(event.target)) {
            setFloatingMenu(null);
         }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);

   const hasPermission = (itemRoles) => {
      if (!itemRoles) return true;
      return itemRoles.includes(userRole);
   };

   const handleNavigation = (path) => {
      if (!path) return;
      navigate(path);
      setFloatingMenu(null);
      if (onNavigate) onNavigate(path);
   };

   const handleLogoClick = () => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      handleNavigation('/');
   };

   const handleItemClick = (item, e) => {
      const isTextVisible = !(isCollapsed && !isMobileOpen);

      if (!isTextVisible) {
         // SOLUCIÓN AL ERROR: Capturamos los datos necesarios ANTES del setFloatingMenu
         const rect = e.currentTarget.getBoundingClientRect();
         const topPosition = rect.top;

         setFloatingMenu((prev) => {
            if (prev?.name === item.name) return null;
            
            const menuChildren = item.children || [{ 
               name: item.name, 
               path: item.path, 
               icon: item.icon,
               roles: item.roles 
            }];

            return {
               name: item.name,
               children: menuChildren,
               top: topPosition, // Usamos la variable capturada arriba
            };
         });
      } else {
         if (item.children) {
            setOpenMenus(prev => ({ ...prev, [item.name]: !prev[item.name] }));
         } else if (item.path) {
            handleNavigation(item.path);
         }
      }
   };

   const isTextVisible = !(isCollapsed && !isMobileOpen);

   return (
      <aside 
         ref={sidebarRef}
         className={`bg-card border-r border-border transition-all duration-300 
         ${isTextVisible ? "w-64" : "w-16"} 
         ${isMobileOpen ? "fixed inset-y-0 left-0 z-[60] shadow-2xl" : "hidden md:flex fixed left-0 top-0 bottom-0 z-40"} 
         ${className} flex flex-col`}
      >
         <div className="flex flex-col h-full relative">
            <div className={`flex items-center px-4 py-6 border-b border-border/50 ${!isTextVisible ? "justify-center" : "justify-between"}`}>
               <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleLogoClick}>
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden bg-background/50 border border-border/50 shadow-sm shrink-0">
                     <img src={logo} alt="Logo Acciona" className="max-w-full max-h-full p-1" style={{ objectFit: 'contain' }} />
                  </div>
                  {isTextVisible && (
                     <div className="flex flex-col overflow-hidden">
                        <h1 className="text-lg font-semibold text-foreground leading-tight truncate">NexoDesk Acciona</h1>
                        <span className="text-[10px] text-muted-foreground font-mono truncate">Panel de administración</span>
                     </div>
                  )}
               </div>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden no-scrollbar">
               {MENU_STRUCTURE.map((item) => {
                  if (!hasPermission(item.roles)) return null;

                  const isActive = location.pathname === item.path || item.children?.some(c => c.path === location.pathname);
                  const isOpen = openMenus[item.name];
                  const isFloatingActive = floatingMenu?.name === item.name;

                  return (
                     <div key={item.name} className="relative">
                        <button
                           onClick={(e) => handleItemClick(item, e)}
                           className={`w-full flex items-center rounded-lg px-3 py-3 transition-all duration-200
                              ${(isActive || isFloatingActive) ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"}
                              ${!isTextVisible ? "justify-center" : "justify-between"}`}
                           title={!isTextVisible ? item.name : ""}
                        >
                           <div className="flex items-center">
                              <Icon name={item.icon} size={20} className={isTextVisible ? "mr-3" : ""} />
                              {isTextVisible && <span className="text-sm font-semibold">{item.name}</span>}
                           </div>
                           {isTextVisible && item.children && (
                              <Icon name={isOpen ? "ChevronDown" : "ChevronRight"} size={14} className="opacity-50" />
                           )}
                        </button>

                        {isOpen && isTextVisible && item.children && (
                           <div className="space-y-1 mx-2 mt-1 animate-in fade-in slide-in-from-top-1">
                              {item.children.map(child => (
                                 <button
                                    key={child.path}
                                    onClick={() => handleNavigation(child.path)}
                                    className={`w-full flex items-center rounded-lg pl-10 pr-3 py-2 text-sm transition-all
                                       ${location.pathname === child.path ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                                 >
                                    <Icon name={child.icon} size={14} className="mr-3" />
                                    <span className="truncate">{child.name}</span>
                                 </button>
                              ))}
                           </div>
                        )}
                     </div>
                  );
               })}
            </nav>

            {!isTextVisible && floatingMenu && (
               <div 
                  ref={floatingRef}
                  className="fixed left-[70px] bg-card border border-border shadow-2xl rounded-xl p-2 z-[100] min-w-[220px] animate-in fade-in zoom-in-95 duration-200"
                  style={{ top: `${floatingMenu.top}px` }}
               >
                  <div className="px-3 py-2 border-b border-border/50 mb-1">
                     <span className="text-[10px] font-black text-primary uppercase tracking-widest">{floatingMenu.name}</span>
                  </div>
                  {floatingMenu.children.map(child => (
                     <button
                        key={child.path}
                        onClick={() => handleNavigation(child.path)}
                        className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5
                           ${location.pathname === child.path ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                     >
                        <Icon name={child.icon} size={16} className="mr-3 opacity-80" />
                        <span className="truncate">{child.name}</span>
                     </button>
                  ))}
               </div>
            )}

            <div className="p-3 border-t border-border space-y-1">
               <button onClick={onToggleCollapse} className={`w-full flex items-center rounded-lg px-3 py-3 text-muted-foreground hover:bg-muted hover:text-foreground ${!isTextVisible ? "justify-center" : ""}`} title={isTextVisible ? "Contraer menú" : "Expandir menú"}>
                  <Icon name={isMobileOpen ? "X" : isTextVisible ? "ChevronLeft" : "ChevronRight"} size={20} className={isTextVisible ? "mr-2" : ""} />
                  {isTextVisible && <div className="text-sm font-medium">Contraer menú</div>}
               </button>
               <button onClick={() => handleNavigation("/perfil")} className={`w-full flex items-center rounded-lg px-3 py-3 text-muted-foreground hover:bg-muted hover:text-foreground ${!isTextVisible ? "justify-center" : ""}`} title={!isTextVisible ? "Ir a mi Perfil" : ""}>
                  <Icon name="User" size={20} className={isTextVisible ? "mr-2" : ""} />
                  {isTextVisible && <div className="text-sm font-medium">Ir a mi Perfil</div>}
               </button>
               <div className="p-2 flex items-center mt-2">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0">
                     {userRole.substring(0, 2)}
                  </div>
                  {isTextVisible && (
                     <div className="ml-3 overflow-hidden">
                        <p className="text-sm font-medium truncate">{user}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{userRole}</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </aside>
   );
};

export default Sidebar;