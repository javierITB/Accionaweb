import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../AppIcon";
// Importamos LOGO_TENANT para la lógica de imágenes y API_BASE_URL para los permisos
import { API_BASE_URL, LOGO_TENANT } from "../../utils/api";
import { MENU_STRUCTURE } from "../../config/menuStructure";

const Sidebar = ({ isCollapsed = false, onToggleCollapse, className = "", isMobileOpen = false, onNavigate }) => {

   // --- LÓGICA DINÁMICA DEL LOGO ---
   const [logoSrc, setLogoSrc] = useState(`/logos/${LOGO_TENANT}/logo-header.png`);

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

   const [openMenus, setOpenMenus] = useState({ "Gestión Principal": true });
   const [userPermissions, setUserPermissions] = useState([]);
   const [isAdminRole, setIsAdminRole] = useState(false);
   const accordionRefs = useRef({});

   const user = sessionStorage.getItem("user") || "Usuario";
   const userRole = sessionStorage.getItem("cargo"); // Nombre del Rol

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

   // Fetch permissons based on Role Name
   useEffect(() => {
      const fetchPermissions = async () => {
         if (!userRole) return;

         // 1. Intentar leer de sessionStorage
         const cachedPermissions = sessionStorage.getItem("permissions");
         if (cachedPermissions) {
            try {
               const parsed = JSON.parse(cachedPermissions);
               setUserPermissions(parsed);
               if (userRole === 'Admin') setIsAdminRole(true);
               return;
            } catch (e) {
               console.error("Error parsing permissions from storage", e);
            }
         }

         // 2. Fallback: Fetch si no están en storage
         try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/roles/name/${encodeURIComponent(userRole)}`, {
               headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
               const data = await res.json();
               const perms = data.permissions || [];
               setUserPermissions(perms);
               sessionStorage.setItem("permissions", JSON.stringify(perms));
               if (data.name === 'Admin') setIsAdminRole(true);
            }
         } catch (error) {
            console.error("Error fetching permissions for sidebar:", error);
         }
      };
      fetchPermissions();
   }, [userRole]);


   const hasPermission = (itemPermission) => {
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
   };

   // Corrección: Función específica para el logo que limpia el modo oscuro
   const handleLogoClick = () => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      handleNavigation('/');
   };

   const isTextVisible = !(isCollapsed && !isMobileOpen);

   const renderNavLink = (item, isChild = false) => {
      if (!hasPermission(item.permission)) return null;

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
                     <img 
                        src={logoSrc} 
                        alt={`Logo ${LOGO_TENANT}`} 
                        onError={handleImageError} 
                        className="max-w-full max-h-full p-1" 
                        style={{ objectFit: 'contain' }} 
                     />
                  </div>
                  {isTextVisible && (
                     <div className="flex flex-col overflow-hidden">
                        <h1 className="text-lg font-semibold text-foreground leading-tight truncate capitalize">
                           {LOGO_TENANT === 'api' ? 'NexoDesk Acciona' : LOGO_TENANT}
                        </h1>
                        <span className="text-[10px] text-muted-foreground font-mono truncate">Panel de administración</span>
                     </div>
                  )}
               </div>
            </div>

            <nav className={`flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden`}>
               {MENU_STRUCTURE.map((item) => {
                  if (!shouldShowSection(item)) return null;
                  if (!item.isAccordion) return renderNavLink(item);

                  const isOpen = openMenus[item.name];

                  return (
                     <div key={item.name} className="space-y-1" ref={(el) => (accordionRefs.current[item.name] = el)}>
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