import React, { useState, useEffect, useRef } from 'react';
// 💡 Ruta ajustada: Intenta subir dos niveles para encontrar AppIcon
import Icon from '../AppIcon';
// 💡 Ruta ajustada: Asume que Button es un componente hermano de la carpeta 'ui' o sube un nivel.
import Button from './Button';
// 💡 Ruta ajustada: Asume que NotificationsCard es un componente hermano.
import NotificationsCard from '../../../components/ui/NotificationsCard';

// 💡 Constante para usar la ruta del logo en JSX
const logoPath = "/logo2.png";

const Header = ({ className = '' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = sessionStorage.getItem("user");
  const cargo = sessionStorage.getItem("cargo");
  const userMail = sessionStorage.getItem("email");

  // Refs para detectar clics fuera
  const menuRef = useRef(null);
  const notiRef = useRef(null);
  const userMenuRef = useRef(null);

  const navigationItems = [
    { name: 'Inicio', path: '/', icon: 'Home' },
    { name: 'Remuneraciones', path: '/remuneraciones', icon: 'LayoutDashboard' },
    { name: 'Anexos', path: '/Anexos', icon: 'FileText' },
    { name: 'Finiquitos', path: '/Finiquitos', icon: 'Clock' },
    { name: 'Otras', path: '/otras', icon: 'HelpCircle' },
  ];

  const moreMenuItems = [
    { name: 'Settings', path: '/settings', icon: 'Settings' },
    { name: 'Help', path: '/help', icon: 'HelpCircle' },
    { name: 'Admin', path: '/RespuestasForms', icon: 'Shield' },
  ];

  const userMenuItems = [
    { name: 'Iniciar Sesión', path: '/login', icon: 'LogIn' },
  ];

  useEffect(() => {
      if (!userMail) return;
  
      let intervalId;
      
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch(`https://https://back-acciona.vercel.app/api/noti/${userMail}/unread-count`);
          const data = await response.json();
          
          const newUnreadCount = data.unreadCount || 0;
          console.log("No leídas:", newUnreadCount);
          
          // Actualizar el estado. Esto causa una re-ejecución del useEffect
          setUnreadCount(newUnreadCount); 
        } catch (error) {
          console.error("Error en polling de no leídas:", error);
        }
      };
      
      // Lógica Condicional:
      // Solo si NO hay notificaciones sin leer (unreadCount === 0), iniciamos el polling.
      if (unreadCount === 0) {
          // Primera ejecución inmediata
          fetchUnreadCount(); 
          // Iniciar el intervalo si el conteo actual es 0
          intervalId = setInterval(fetchUnreadCount, 10000); 
      } 
      // Si unreadCount > 0, no se inicia el intervalo, deteniendo el polling.
      // Cuando el usuario marque como leído (y setUnreadCount(0) se ejecute), 
      // el useEffect se re-ejecutará y el polling se reiniciará.
  
      // Función de limpieza: asegurar que el intervalo se detenga
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
  
    // Dependencias: 
    // userMail (para iniciar si cambia de usuario) 
    // unreadCount (para reiniciar y comenzar el polling cuando el conteo pasa a 0).
    }, [userMail, unreadCount]); 
  

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

      // ✅ CORRECCIÓN PRINCIPAL: Mantenemos la lógica de cierre del menú "Más" de desktop 
      // (que usa isMenuOpen) solo si no estamos en móvil, para que no interfiera.
      if (menuRef.current && !menuRef.current.contains(event.target) && window.innerWidth >= 1024) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleNavigation = (path) => {
    window.location.href = path;
    // 💡 Asegurar cierre inmediato.
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  // 💡 NUEVA FUNCIÓN: Click en el logo para ir al home
  const handleLogoClick = () => {
    window.location.href = '/';
  };

  const toggleNoti = () => {
    setIsNotiOpen(!isNotiOpen);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = '/';
    setIsUserMenuOpen(false);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 bg-card border-b border-border shadow-brand z-30 ${className}`}>
      <div className="flex items-center justify-between h-16 lg:h-20 px-4 sm:px-6 lg:px-8 bg-warning">
        {/* Logo Section - AHORA CLICKEABLE */}
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={handleLogoClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleLogoClick();
            }
          }}
        >
          <div className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-lg overflow-hidden">
            <img
              src={logoPath}
              alt="Logo Acciona"
              className="max-w-full max-h-full"
              style={{ objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/placeholder-logo.png";
              }}
              loading="lazy"
            />
          </div>

          <div className="flex flex-col">
            <h1 className="text-base lg:text-lg font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
              Portal Acciona
            </h1>
            <span className="text-xs text-muted-foreground font-mono xs:block">
              plataforma de asistencia a clientes
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
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
              onClick={toggleNoti}
              className="relative hover:bg-muted transition-brand w-10 h-10 lg:w-12 lg:h-12"
              iconName="Bell"
              iconSize={18}
            >
              {unreadCount > 0 && (
                <span className="absolute top-1 -right-1 w-2 h-2 bg-error rounded-full animate-pulse-subtle"></span>
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
          <div className="flex items-center space-x-2 lg:space-x-3 pl-2 lg:pl-3 border-l border-border">
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
                  onClick={() => { window.location.href = "/perfil" }}
                  className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {user ? (
                    <span className="text-sm font-semibold text-white">
                      {user.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <Icon name="User" size={16} className="text-white" />
                  )}
                </button>
              </div>
            )
            }
            < div className="relative" ref={userMenuRef}>
              <button
                onClick={() => { user ? handleLogout() : window.location.href = "/login"  }}
                className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
                title={user?"Cerrar sesión":"Log In"}
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
            className="lg:hidden hover:bg-muted transition-brand w-10 h-10"
          >
            <Icon name={isMenuOpen ? "X" : "Menu"} size={20} />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {
        isMenuOpen && (
          <div className="lg:hidden bg-card border-b border-border shadow-brand animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              {navigationItems?.map((item) => (
                <button
                  key={item?.path}
                  onClick={() => handleNavigation(item?.path)}
                  className="flex items-center w-full px-4 py-3 text-left text-foreground hover:bg-muted rounded-lg transition-brand"
                >
                  <Icon name={item?.icon} size={20} className="mr-3" />
                  <span className="font-medium">{item?.name}</span>
                </button>
              ))}

              {/* More items in mobile */}
              {moreMenuItems?.map((item) => (
                <button
                  key={item?.path}
                  onClick={() => handleNavigation(item?.path)}
                  className="flex items-center w-full px-4 py-3 text-left text-foreground hover:bg-muted rounded-lg transition-brand"
                >
                  <Icon name={item?.icon} size={20} className="mr-3" />
                  <span className="font-medium">{item?.name}</span>
                </button>
              ))}
            </div>
          </div>
        )
      }
    </header >
  );
};

export default Header;