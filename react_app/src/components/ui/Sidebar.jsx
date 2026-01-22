import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../AppIcon";

const Sidebar = ({ isCollapsed = false, onToggleCollapse, className = "", isMobileOpen = false, onNavigate }) => {

   const MENU_STRUCTURE = [
      {
         name: "Gestión Principal",
         icon: "LayoutDashboard",
         isAccordion: true,
         roles: ["admin", "RRHH"], // Solo estos cargos ven el acordeón completo
         children: [
            { name: "Solicitudes de Clientes", path: "/RespuestasForms", icon: "FileText", roles: ["admin", "RRHH"] },
            { name: "Solicitudes a Cliente", path: "/Solicitudes", icon: "Pencil", roles: ["admin", "RRHH"] },
            { name: "Tickets", path: "/Tickets", icon: "FileText", roles: ["admin", "RRHH", "soporte"] },
            { name: "Domicilio Virtual", path: "/DomicilioVirtual", icon: "Home", roles: ["admin"] },
         ]
      },
      {
         name: "Rendimiento",
         path: "/dashboard-home",
         icon: "BarChart2",
         roles: ["admin"]
      },
      {
         name: "Configuración",
         icon: "Settings",
         isAccordion: true,
         roles: ["admin", "RRHH"],
         children: [
            { name: "Formularios", path: "/form-center", icon: "FileText", roles: ["admin", "RRHH"] },
            { name: "Plantillas", path: "/template-builder", icon: "FileText", roles: ["admin", "RRHH"] },
            { name: "Config. Tickets", path: "/config-tickets", icon: "Settings", roles: ["admin"] },
            { name: "Anuncios", path: "/anuncios", icon: "Megaphone", roles: ["admin", "RRHH"] },
         ]
      },
      {
         name: "Administración",
         icon: "Shield",
         isAccordion: true,
         roles: ["admin", "RRHH"],
         children: [
            { name: "Usuarios", path: "/users", icon: "User", roles: ["admin", "RRHH"] },
            { name: "Empresas", path: "/empresas", icon: "Building2", roles: ["admin", "RRHH"] },
         ]
      },
   ];


   const location = useLocation();
   const navigate = useNavigate();

   const [openMenus, setOpenMenus] = useState({ "Gestión Principal": true });

   // Obtenemos los datos del usuario para el filtro de permisos
   const user = sessionStorage.getItem("user") || "Usuario";
   const userRole = sessionStorage.getItem("rol") || "guest"; // Cargo actual del usuario

   useEffect(() => {
      // Buscamos si la ruta actual pertenece a algún hijo de un acordeón
      MENU_STRUCTURE.forEach(item => {
         if (item.isAccordion && item.children) {
            const hasActiveChild = item.children.some(child => child.path === location.pathname);

            if (hasActiveChild) {
               setOpenMenus(prev => ({
                  ...prev,
                  [item.name]: true // Abrimos el acordeón padre
               }));
            }
         }
      });
   }, [location.pathname]);

   // --- SISTEMA DE GESTIÓN DE PERMISOS ---
   const hasPermission = (itemRoles) => {
      if (!itemRoles) return true; // Si no hay roles definidos, es público
      return itemRoles.includes(userRole);
   };

   const toggleAccordion = (name) => {
      setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
   };

   const handleNavigation = (path) => {
      navigate(path);
      if (onNavigate) onNavigate(path);
   };

   const isTextVisible = !(isCollapsed && !isMobileOpen);

   const renderNavLink = (item, isChild = false) => {
      // Validamos permiso antes de renderizar
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
         ${isMobileOpen ? "fixed inset-y-0 left-0 z-[60] shadow-2xl" : "hidden md:flex fixed left-0 top-16 bottom-0 z-40"} 
         ${className} flex flex-col`}>

         <div className="flex flex-col h-full">
            {isMobileOpen && (
               <div className="flex items-center justify-between p-4 border-b border-border">
                  <span className="font-bold text-lg">Menú</span>
                  <button onClick={onToggleCollapse} className="p-2 hover:bg-muted rounded-md">
                     <Icon name="X" size={24} />
                  </button>
               </div>
            )}

            <nav className={`flex-1 ${isMobileOpen ? "mt-2" : "mt-4"} p-3 space-y-1 overflow-y-auto overflow-x-hidden`}>
               {MENU_STRUCTURE.map((item) => {
                  // Validar si el usuario tiene permiso para ver el ítem principal o acordeón
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

            {/* Profile Link Pinned to Bottom */}
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

            {/* User Info Footer */}
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