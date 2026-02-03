import React, { useState, useEffect } from "react";
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
            { name: "Gestor de Roles", path: "/gestor-roles", icon: "Users", roles: ["admin"] },
            { name: "Gestor Notificaciones", path: "/config-notificaciones", icon: "Bell", roles: ["admin", "RRHH"] },
            { name: "Registro de cambios", path: "/registro-cambios", icon: "FileText", roles: ["admin", "RRHH", "SoloLectura"] },
            { name: "Registro de ingresos", path: "/registro-ingresos", icon: "LogIn", roles: ["admin"] },
         ]
      },
   ];

   const location = useLocation();
   const navigate = useNavigate();

   const [openMenus, setOpenMenus] = useState({ "Gestión Principal": true });

   const user = sessionStorage.getItem("user") || "Usuario";
   const userRole = sessionStorage.getItem("rol") || "guest";

   useEffect(() => {
      MENU_STRUCTURE.forEach(item => {
         if (item.isAccordion && item.children) {
            const hasActiveChild = item.children.some(child => child.path === location.pathname);
            if (hasActiveChild) {
               setOpenMenus(prev => ({
                  ...prev,
                  [item.name]: true
               }));
            }
         }
      });
   }, [location.pathname]);

   const hasPermission = (itemRoles) => {
      if (!itemRoles) return true;
      return itemRoles.includes(userRole);
   };

   const toggleAccordion = (name) => {
      setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
   };

   const handleNavigation = (path) => {
      navigate(path);
      if (onNavigate) onNavigate(path);
   };

   // Corrección: Función específica para el logo que limpia el modo oscuro
   const handleLogoClick = () => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      handleNavigation('/');
   };

   const isTextVisible = !(isCollapsed && !isMobileOpen);

   const renderNavLink = (item, isChild = false) => {
      if (!hasPermission(item.roles)) return null;

      const isActive = location.pathname === item.path;
      return (
         <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className={`w-full flex items-center rounded-lg transition-all duration-200 mb-1
               ${isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted hover:text-foreground"}
               ${!isTextVisible ? "justify-center px-2 py-3" : isChild ? "pl-10 pr-3 py-2" : "px-3 py-3"}
            `}
            title={!isTextVisible ? item.name : ""}
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
                  className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleLogoClick}
               >
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

            <nav className={`flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden`}>
               {MENU_STRUCTURE.map((item) => {
                  if (!hasPermission(item.roles)) return null;
                  if (!item.isAccordion) return renderNavLink(item);

                  const isOpen = openMenus[item.name];

                  return (
                     <div key={item.name} className="space-y-1">
                        <button
                           onClick={() => toggleAccordion(item.name)}
                           className={`w-full flex items-center rounded-lg px-3 py-3 text-muted-foreground hover:bg-muted transition-all
                              ${!isTextVisible ? "justify-center" : "justify-between"}`}
                        >
                           <div className="flex items-center">
                              <Icon name={item.icon} size={20} className={isTextVisible ? "mr-3" : ""} />
                              {isTextVisible && <span className="text-sm font-semibold">{item.name}</span>}
                           </div>
                           {isTextVisible && (
                              <Icon name={isOpen ? "ChevronDown" : "ChevronRight"} size={14} className="opacity-50" />
                           )}
                        </button>

                        {isOpen && isTextVisible && (
                           <div className="space-y-1 mx-2 mt-1 animate-in fade-in slide-in-from-top-1">
                              {item.children.map(child => renderNavLink(child, true))}
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
                     ${!isTextVisible ? "justify-center" : ""}
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
      </aside>
   );
};

export default Sidebar;