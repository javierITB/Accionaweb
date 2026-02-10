import React, { useState, useEffect, useRef } from "react";
// 💡 Ruta ajustada: Intenta subir dos niveles para encontrar AppIcon
import Icon from "../AppIcon";
// 💡 Ruta ajustada: Asume que Button es un componente hermano de la carpeta 'ui' o sube un nivel.
import Button from "./Button";
// 💡 Ruta ajustada: Asume que NotificationsCard es un componente hermano.
import NotificationsCard from "../../../components/ui/NotificationsCard";
import { API_BASE_URL, LOGO_TENANT } from "../../../utils/api";

const Header = ({ className = "" }) => {
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [isNotiOpen, setIsNotiOpen] = useState(false);
   const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
   const [unreadCount, setUnreadCount] = useState(0);

   // --- LÓGICA DINÁMICA DEL LOGO ---
   const [logoSrc, setLogoSrc] = useState(`/logos/${LOGO_TENANT}/logo-header.png`);

   useEffect(() => {
      setLogoSrc(`/logos/${LOGO_TENANT}/logo-header.png`);
   }, [LOGO_TENANT]);

   const handleImageError = (e) => {
      e.currentTarget.onerror = null;
      e.currentTarget.src = "/placeholder-logo.png";
   };

   // NUEVO ESTADO: Controla la agitación de la campana
   const [shouldShake, setShouldShake] = useState(false);

   const user = sessionStorage.getItem("user");
   const cargo = sessionStorage.getItem("cargo");
   const userMail = sessionStorage.getItem("email");

   // Refs para detectar clics fuera
   const menuRef = useRef(null);
   const notiRef = useRef(null);
   const userMenuRef = useRef(null);

   const navigationItems = [
      { name: "Inicio", path: "/", icon: "Home" },
      { name: "Remuneraciones", path: "/remuneraciones", icon: "LayoutDashboard" },
      { name: "Anexos", path: "/Anexos", icon: "FileText" },
      { name: "Finiquitos", path: "/Finiquitos", icon: "Clock" },
      { name: "Otras", path: "/otras", icon: "Route" },
   ];

   const moreMenuItems = [
      { name: "Ayuda", path: "/soporte", icon: "Search" },
      { name: "Admin", path: "/panel", icon: "Shield" },
   ];

   // const userMenuItems = [{ name: "Iniciar Sesión", path: "/login", icon: "LogIn" }];

   // --- EFECTO DE POLLING Y AGITACIÓN ---
   useEffect(() => {
      if (!userMail) return;

      let intervalId;

      const fetchUnreadCount = async (isInitialLoad = false) => {
         try {
            const response = await fetch(`${API_BASE_URL}/noti/${userMail}/unread-count`);
            const data = await response.json();

            const newUnreadCount = data.unreadCount || 0;
            console.log("No leídas:", newUnreadCount);

            // Lógica de agitación: solo si es carga inicial Y hay notificaciones
            if (isInitialLoad && newUnreadCount > 0) {
               setShouldShake(true);
               // Desactivar la agitación después de 1.5 segundos
               setTimeout(() => setShouldShake(false), 1500);
            }

            setUnreadCount(newUnreadCount);
         } catch (error) {
            console.error("Error en polling de no leídas:", error);
         }
      };

      // La primera llamada (carga inicial)
      fetchUnreadCount(true);

      // Iniciar el polling (revisa el conteo cada 10 segundos)
      intervalId = setInterval(() => fetchUnreadCount(false), 10000);

      // Función de limpieza: asegurar que el intervalo se detenga
      return () => {
         if (intervalId) {
            clearInterval(intervalId);
         }
      };
   }, [userMail]); // Dependencia solo en userMail para el polling

   // Effect para detectar clics fuera de los menús
   useEffect(() => {
      const handleClickOutside = (event) => {
         // Cerrar Notificaciones si se hace clic fuera
         if (notiRef.current && !notiRef.current.contains(event.target)) {
            setIsNotiOpen(false);
         }

         // Cerrar menú de usuario si se hace clic fuera
         if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
            setIsUserMenuOpen(false);
         }

         // NUEVO: cerrar el menú "Más" solo cuando la navegación de desktop está visible (xl >= 1280px)
         if (
            menuRef.current &&
            !menuRef.current.contains(event.target) &&
            window.matchMedia("(min-width:1280px)").matches
         ) {
            setIsMenuOpen(false);
         }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
         document.removeEventListener("mousedown", handleClickOutside);
      };
   }, [isMenuOpen]);

   // --- FUNCIONES AUXILIARES ---

   const handleNavigation = (path) => {
      window.location.href = path;
      setIsMenuOpen(false);
      setIsUserMenuOpen(false);
   };

   const handleLogoClick = () => {
      window.location.href = "/";
   };

   const toggleNoti = () => {
      setIsNotiOpen(!isNotiOpen);
   };

   const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
   };

   // const toggleUserMenu = () => {
   //    setIsUserMenuOpen(!isUserMenuOpen);
   // };

   const handleLogout = () => {
      sessionStorage.clear();
      window.location.href = "/";
      setIsUserMenuOpen(false);
   };

   return (
      <header className={`fixed top-0 left-0 right-0 bg-card border-b border-border shadow-brand z-30 ${className}`}>
         <div className="flex items-center justify-between h-16 lg:h-20 px-4 sm:px-6 lg:px-8 bg-warning">
            {/* Logo Section - CLICKEABLE */}
            <div
               className="flex items-center space-x-3 cursor-pointer group"
               onClick={handleLogoClick}
               role="button"
               tabIndex={0}
               onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                     handleLogoClick();
                  }
               }}
            >
               <div className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-lg overflow-hidden">
                  <img
                     src={logoSrc}
                     alt={`Logo ${LOGO_TENANT}`}
                     className="max-w-full max-h-full"
                     style={{ objectFit: "contain" }}
                     onError={handleImageError}
                     loading="lazy"
                  />
               </div>

               <div className="flex flex-col">
                  <h1 className="text-base lg:text-lg font-semibold text-foreground leading-tight group-hover:text-primary transition-colors capitalize">
                      {LOGO_TENANT === 'api' ? 'Solunex acciona' :  `Solunex ${LOGO_TENANT}`}
                  </h1>
                  <span className="text-[10px] sm:text-xs text-amber-900/80 font-mono block leading-tight">
                     plataforma de asistencia a clientes
                  </span>
               </div>
            </div>

            {/* Desktop Navigation - Hidden on LG, visible on XL */}
            <nav className="hidden xl:flex items-center space-x-1">
               {navigationItems?.map((item) => (
                  <Button
                     key={item?.path}
                     variant="ghost"
                     size="sm"
                     onClick={() => handleNavigation(item?.path)}
                     iconName={item?.icon}
                     iconPosition="left"
                     iconSize={18}
                     className="px-4 py-2 text-md font-medium text-foreground hover:text-foreground hover:bg-muted transition-brand"
                  >
                     {item?.name}
                  </Button>
               ))}

               {/* More Menu */}
               <div className="relative" ref={menuRef}>
                  <Button
                     variant="ghost"
                     size="sm"
                     onClick={toggleMenu}
                     iconName="MoreHorizontal"
                     iconSize={18}
                     className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-brand"
                  >
                     Más
                  </Button>

                  {isMenuOpen && (
                     <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-lg shadow-brand-hover animate-scale-in z-50">
                        <div className="py-2">
                           {moreMenuItems?.map((item) => (
                              <button
                                 key={item?.path}
                                 onClick={() => handleNavigation(item?.path)}
                                 className="flex items-center w-full px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-brand"
                                 title={item.name}
                              >
                                 <Icon name={item?.icon} size={16} className="mr-3" />
                                 {item?.name}
                              </button>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </nav>

            {/* User Profile & Actions */}
            <div className="flex items-center space-x-2 lg:space-x-3">
               {/* Notifications */}
               <div ref={notiRef}>
                  <Button
                     variant="ghost"
                     size="icon"
                     title="Notificaciones"
                     onClick={toggleNoti}
                     // APLICACIÓN DE LA CLASE DE AGITACIÓN
                     className={`relative hover:bg-primary transition-brand w-10 h-10 lg:w-12 lg:h-12 ${shouldShake ? "animate-bell-shake" : ""}`}
                     iconName="Bell"
                     iconSize={18}
                  >
                     {unreadCount > 0 && (
                        <span
                           className="
                    absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4
                    min-w-[1.25rem] h-5 px-1.5 
                    text-xs font-bold text-white 
                    bg-error rounded-full flex items-center justify-center
                  "
                        >
                           {unreadCount}
                        </span>
                     )}
                  </Button>

                  {isNotiOpen && (
                     <div className="absolute right-0 top-full mt-2 mr-2 bg-popover border border-border rounded-lg shadow-brand-hover animate-scale-in z-50">
                        <div className="py-2">
                           <NotificationsCard user={userMail} onUnreadChange={setUnreadCount} />
                        </div>
                     </div>
                  )}
               </div>

               {/* User Profile */}
               <div className="hidden sm:flex items-center space-x-2 lg:space-x-3 pl-2 lg:pl-3 border-l border-border">
                  {user && (
                     <div className="hidden md:block text-right">
                        <p className="text-sm font-medium text-foreground">{user}</p>
                        <p className="text-xs text-muted-foreground">{cargo}</p>
                     </div>
                  )}

                  {/* User Avatar with Dropdown */}
                  {user && (
                     <div className="relative" ref={userMenuRef}>
                        <button
                           onClick={() => {
                              window.location.href = "/perfil";
                           }}
                           className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
                           title="Perfil de usuario"
                        >
                           {user ? (
                              <span className="text-sm font-semibold text-white">{user.charAt(0).toUpperCase()}</span>
                           ) : (
                              <Icon name="User" size={16} className="text-white" />
                           )}
                        </button>
                     </div>
                  )}
                  <div className="relative" ref={userMenuRef}>
                     <button
                        onClick={() => {
                           user ? handleLogout() : (window.location.href = "/login");
                        }}
                        className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
                        title={user ? "Cerrar sesión" : "Iniciar Sesión"}
                     >
                        {user ? (
                           <Icon name="LogOut" size={16} className="text-white" />
                        ) : (
                           <Icon name="LogIn" size={16} className="text-white" />
                        )}
                     </button>
                  </div>
               </div>

               {/* Mobile Menu Toggle */}
               <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMenu}
                  className="xl:hidden hover:bg-muted transition-brand w-10 h-10"
               >
                  <Icon name={isMenuOpen ? "X" : "Menu"} size={20} />
               </Button>
            </div>
         </div>

         {/* Mobile Navigation Menu */}
         {isMenuOpen && (
            <div className="xl:hidden bg-card border-b border-border shadow-brand animate-slide-down">
               <div className="px-4 py-3 space-y-1">
                  {navigationItems?.map((item) => (
                     <button
                        key={item?.path}
                        onClick={() => handleNavigation(item?.path)}
                        className="flex items-center w-full px-4 py-3 text-left text-foreground hover:bg-muted rounded-lg transition-brand"
                        title={item?.name}
                     >
                        <Icon name={item?.icon} size={20} className="mr-3" />
                        <span className="font-medium">{item?.name}</span>
                     </button>
                  ))}

                  {moreMenuItems?.map((item) => (
                     <button
                        key={item?.path}
                        onClick={() => handleNavigation(item?.path)}
                        className="flex items-center w-full px-4 py-3 text-left text-foreground hover:bg-muted rounded-lg transition-brand"
                        title={item?.name}
                     >
                        <Icon name={item?.icon} size={20} className="mr-3" />
                        <span className="font-medium">{item?.name}</span>
                     </button>
                  ))}

                  {/* User Actions Mobile */}
                  <div className="border-t border-border mt-2 pt-2">
                     {user ? (
                        <>
                           <button
                              onClick={() => handleNavigation("/perfil")}
                              className="flex items-center w-full px-4 py-3 text-left text-foreground hover:bg-muted rounded-lg transition-brand"
                           >
                              <Icon name="User" size={20} className="mr-3" />
                              <div className="flex flex-col">
                                 <span className="font-medium">Mi Perfil</span>
                                 <span className="text-xs text-muted-foreground">{user}</span>
                              </div>
                           </button>
                           <button
                              onClick={handleLogout}
                              className="flex items-center w-full px-4 py-3 text-left text-error hover:bg-error/10 rounded-lg transition-brand"
                           >
                              <Icon name="LogOut" size={20} className="mr-3" />
                              <span className="font-medium">Cerrar Sesión</span>
                           </button>
                        </>
                     ) : (
                        <button
                           onClick={() => handleNavigation("/login")}
                           className="flex items-center w-full px-4 py-3 text-left text-foreground hover:bg-muted rounded-lg transition-brand"
                        >
                           <Icon name="LogIn" size={20} className="mr-3" />
                           <span className="font-medium">Iniciar Sesión</span>
                        </button>
                     )}
                  </div>
               </div>
            </div>
         )}
      </header>
   );
};

export default Header;