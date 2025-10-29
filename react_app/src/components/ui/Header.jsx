import React, { useState, useEffect, useRef } from 'react';
import Icon from '../AppIcon';
import Button from './Button';
import NotificationsCard from './NotificationsCard';
import logo from "/logo2.png";

const Header = ({ className = '' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const user = sessionStorage.getItem("user");
  const cargo = sessionStorage.getItem("cargo");
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. 🌙 Estado del Tema
  // Inicializar el estado del tema leyendo la clase 'dark' del <html> o el localStorage
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  // Refs para detectar clics fuera
  const menuRef = useRef(null);
  const notiRef = useRef(null);
  const userMenuRef = useRef(null);
  const userMail = sessionStorage.getItem("email");

  const navigationItems = [
    { name: 'Incio', path: '/', icon: 'Home' },
    { name: 'Settings', path: '/settings', icon: 'Settings' },
    { name: 'Help', path: '/help', icon: 'HelpCircle' },
  ];

  // (Nota: el array moreMenuItems no está definido en el código original, lo he quitado del Mobile Navigation para evitar un error)

  const [isNotiOpen, setIsNotiOpen] = useState(false);

  // 2. 🌙 Efecto para aplicar y persistir el tema
  useEffect(() => {
    const root = document.documentElement; // Es el elemento <html>

    // Aplicar la clase 'dark' o quitarla
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Guardar la preferencia en localStorage
    localStorage.setItem('theme', theme);
  }, [theme]); // Se ejecuta cada vez que 'theme' cambia

  // 3. 🌙 Función para cambiar el tema
  const toggleTheme = () => {
    setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  // Resto del código de useEffect para notificaciones (sin cambios)
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
  }, [userMail]); // Cambiado de 'user' a 'userMail' si es el usado en la API

  // Effect para detectar clics fuera de los menús (sin cambios)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // ... lógica de cierre de menús
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }

      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setIsNotiOpen(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleNoti = () => {
    setIsNotiOpen(!isNotiOpen);
  };

  const handleNavigation = (path) => {
    window.location.href = path;
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
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
      <div className="flex items-center justify-between h-20 px-6">
        {/* Logo Section (sin cambios) */}
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
              Acciona HR Portal
            </h1>
            <span className="text-xs text-muted-foreground font-mono">
              Employee Experience Platform
            </span>
          </div>
        </div>

        {/* Desktop Navigation (sin cambios) */}
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
              className="px-4 py-2 text-md font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-brand"
            >
              {item?.name}
            </Button>
          ))}
        </nav>

        {/* User Profile & Actions */}
        <div className="flex items-center space-x-3">

          {/* 4. 🌙 Botón de Modo Oscuro/Claro */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-muted transition-brand"
            // Cambiar el icono dependiendo del tema actual
            iconName={theme === 'dark' ? "Sun" : "Moon"}
          />

          {/* Notifications (sin cambios) */}
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
              <div className="absolute right-0 top-full mt-2 mr-2 bg-popover border border-border rounded-lg shadow-brand-hover animate-scale-in">
                <div className="py-2">
                  <NotificationsCard user={user} onUnreadChange={setUnreadCount} />
                </div>
              </div>
            )}
          </div>

          {/* User Profile (sin cambios) */}
          <div className="flex items-center space-x-3 pl-3 border-l border-border">
            {user && (
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-foreground">{user}</p>
                <p className="text-xs text-muted-foreground">{cargo}</p>
              </div>
            )}

            {/* User Avatar with Dropdown (sin cambios) */}
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

              {/* User Dropdown Menu - SOLO CERRAR SESIÓN (sin cambios) */}
              {isUserMenuOpen && user && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-lg shadow-brand-hover animate-scale-in z-50">
                  <div className="py-2">
                    {/* Información del usuario */}
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-popover-foreground">{user}</p>
                      <p className="text-xs text-muted-foreground">Sesión activa</p>
                    </div>

                    {/* Solo opción de Cerrar Sesión */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-brand"
                    >
                      <Icon name="LogOut" size={16} className="mr-3" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle (sin cambios) */}
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

      {/* Mobile Navigation Menu (sin cambios, excepto que quité el loop de moreMenuItems) */}
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
              {/* Opción de Modo Oscuro en el menú móvil */}
              <button
                onClick={toggleTheme}
                className="flex items-center w-full px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-brand"
              >
                <Icon name={theme === 'dark' ? "Sun" : "Moon"} size={18} className="mr-3" />
                {theme === 'dark' ? "Modo Claro" : "Modo Oscuro"}
              </button>
              {/* Nota: Quité el loop de moreMenuItems ya que no estaba definido. */}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;