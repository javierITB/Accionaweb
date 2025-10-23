import React, { useState, useEffect, useRef } from 'react';
import Icon from '../AppIcon';
import Button from './Button';
import NotificationsCard from '../../../components/ui/NotificationsCard';
import logo from "/logo2.png";

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
    { name: 'Incio', path: '/', icon: 'Home' },
    { name: 'Remuneraciones', path: '/remuneraciones', icon: 'LayoutDashboard' },
    { name: 'Anexos', path: '/Anexos', icon: 'FileText' },
    { name: 'Finiquitos', path: '/Finiquitos', icon: 'Clock' },
    { name: 'Otras', path: '/otras', icon: 'HelpCircle' },
    { name: 'Envío Documentos', path: '/support-portal', icon: 'FileText' },
  ];

  const moreMenuItems = [
    { name: 'Settings', path: '/settings', icon: 'Settings' },
    { name: 'Help', path: '/help', icon: 'HelpCircle' },
    { name: 'Admin', path: '/dashboard-home', icon: 'Shield' },
  ];

  const userMenuItems = [
    { name: 'Iniciar Sesión', path: '/login', icon: 'LogIn' },
  ];

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const response = await fetch(`https://accionaapi.vercel.app/api/noti/${userMail}/unread-count`);
      const data = await response.json();
      console.log("No leídas:", data.unreadCount);
      setUnreadCount(data.unreadCount);
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000); // cada 10 segundos
    return () => clearInterval(interval);
  }, [user]);


  // Effect para detectar clics fuera de los menús
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Cerrar menú principal si se hace clic fuera
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }

      // Cerrar notificaciones si se hace clic fuera
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setIsNotiOpen(false);
      }

      // Cerrar menú de usuario si se hace clic fuera
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavigation = (path) => {
    window.location.href = path;
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
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
    <header className={`fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-brand ${className}`}>
      <div className="flex items-center justify-between h-20 px-6 bg-warning">
        {/* Logo Section */}
       <div className="flex items-center space-x-3">
  <div className="flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden ">
    <img
      src={logo}              // archivo: public/logo.png
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
    <h1 className="text-lg font-semibold text-foreground leading-tight">
      Portal Acciona
    </h1>
    <span className="text-xs text-muted-foreground font-mono">
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
              <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-lg shadow-brand-hover animate-scale-in">
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
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <div ref={notiRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleNoti}
              className="relative hover:bg-muted transition-brand"
              iconName="Bell"
            >
              {unreadCount > 0 && ( // solo si hay sin leer
                <span className="absolute top-1 -right-1 w-2 h-2 bg-error rounded-full animate-pulse-subtle"></span>
              )}
            </Button>

            {isNotiOpen && (
              <div className="absolute right-0 top-full mt-2 mr-2  bg-popover border border-border rounded-lg shadow-brand-hover animate-scale-in">
                <div className="py-2">
                  <NotificationsCard user={user} onUnreadChange={setUnreadCount} />
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3 pl-3 border-l border-border">
            {user && (
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-foreground">{user}</p>
                <p className="text-xs text-muted-foreground">{cargo}</p>
              </div>
            )}

            {/* User Avatar with Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={toggleUserMenu}
                className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
              >
                {user ? (
                  <span className="text-sm font-semibold text-white">
                    {user.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <Icon name="User" size={16} className="text-white" />
                )}
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-lg shadow-brand-hover animate-scale-in z-50">
                  <div className="py-2">
                    {user ? (
                      // Menu cuando el usuario está logueado
                      <>
                        <div className="px-4 py-2 border-b border-border">
                          <p className="text-sm font-medium text-popover-foreground">{user}</p>
                          <p className="text-xs text-muted-foreground">Sesión activa</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-brand"
                        >
                          <Icon name="LogOut" size={16} className="mr-3" />
                          Cerrar Sesión
                        </button>
                      </>
                    ) : (
                      // Menu cuando el usuario NO está logueado
                      <>
                        <div className="px-4 py-2 border-b border-border">
                          <p className="text-sm font-medium text-popover-foreground">Invitado</p>
                          <p className="text-xs text-muted-foreground">No has iniciado sesión</p>
                        </div>
                        {userMenuItems?.map((item) => (
                          <button
                            key={item?.path}
                            onClick={() => handleNavigation(item?.path)}
                            className="flex items-center w-full px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-brand"
                          >
                            <Icon name={item?.icon} size={16} className="mr-3" />
                            {item?.name}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMenu}
            className="lg:hidden hover:bg-muted transition-brand"
          >
            <Icon name={isMenuOpen ? "X" : "Menu"} size={20} />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-card border-t border-border animate-slide-up">
          <nav className="px-6 py-4 space-y-2">
            {navigationItems?.map((item) => (
              <button
                key={item?.path}
                onClick={() => handleNavigation(item?.path)}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-brand"
              >
                <Icon name={item?.icon} size={18} className="mr-3" />
                {item?.name}
              </button>
            ))}

            <div className="border-t border-border pt-2 mt-4">
              {moreMenuItems?.map((item) => (
                <button
                  key={item?.path}
                  onClick={() => handleNavigation(item?.path)}
                  className="flex items-center w-full px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-brand"
                >
                  <Icon name={item?.icon} size={18} className="mr-3" />
                  {item?.name}
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;