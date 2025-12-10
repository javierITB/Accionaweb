import React, { useState, useEffect, useRef, memo } from 'react';
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
  const [userRole, setUserRole] = useState(cargo || 'Usuario');
  
  // NUEVO ESTADO: Controla la agitación de la campana
  const [shouldShake, setShouldShake] = useState(false); 
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  // 🌙 Estado del Tema
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
    { name: 'Inicio', path: '/', icon: 'Home' },
    { name: 'Ajustes', path: '/settings', icon: 'Settings' },
    { name: 'Ayuda', path: '/help', icon: 'Search' },
  ];

  // --- EFECTOS ---

  // Efecto 1: Obtener el rol del usuario
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        if (!userMail) return;

        const response = await fetch(`https://back-acciona.vercel.app/api/auth/full/${userMail}`);
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.rol || cargo || 'Usuario');
          return;
        }

        const responseBasic = await fetch(`https://back-acciona.vercel.app/api/auth/${userMail}`);
        if (responseBasic.ok) {
          const userData = await responseBasic.json();
          setUserRole(cargo || 'Usuario');
        }

      } catch (error) {
        console.error('Error obteniendo rol del usuario:', error);
        setUserRole(cargo || 'Usuario');
      }
    };

    fetchUserRole();
  }, [userMail, cargo]);

  // Efecto 2: Aplicar tema
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Efecto 3: Manejo de clics fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
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

  // Efecto 4: Polling de Notificaciones y Agitación Inicial
  useEffect(() => {
    if (!userMail) return;

    let intervalId;

    const fetchUnreadCount = async (isInitialLoad = false) => {
      try {
        const response = await fetch(`https://back-acciona.vercel.app/api/noti/${userMail}/unread-count`);
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

        // Si encontramos notificaciones sin leer, no hay necesidad de detener el polling aquí,
        // ya que queremos que el conteo se actualice regularmente si hay cambios.
        // La campana se agita solo en la carga inicial si hay algo que ver.

      } catch (error) {
        console.error("Error en polling de no leídas:", error);
      }
    };

    // La primera llamada (carga inicial)
    fetchUnreadCount(true); 

    // Iniciar el polling (revisa el conteo cada 10 segundos)
    intervalId = setInterval(() => fetchUnreadCount(false), 10000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [userMail]); // Dependencia solo en userMail para el polling

  // --- FUNCIONES AUXILIARES ---

  const toggleTheme = () => {
    setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
  };

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

  // --- RENDERIZADO ---

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-brand ${className}`}>
      <div className="flex items-center justify-between h-20 px-6">
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden ">
            <img
              src={logo}              
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
              Acciona RRHH Portal
            </h1>
            <span className="text-xs text-muted-foreground font-mono">
              Panel de administración y gestión
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
              className="px-4 py-2 text-md font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-brand"
            >
              {item?.name}
            </Button>
          ))}
        </nav>

        {/* User Profile & Actions */}
        <div className="flex items-center space-x-3">

          {/* Botón de Modo Oscuro/Claro */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-muted transition-brand"
            iconName={theme === 'dark' ? "Sun" : "Moon"}
          />

          {/* Notifications */}
          <div ref={notiRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleNoti}
              // APLICACIÓN DE LA CLASE DE AGITACIÓN
              className={`relative hover:bg-primary transition-brand w-10 h-10 lg:w-12 lg:h-12 ${shouldShake ? 'animate-bell-shake' : ''}`}
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
          <div className="flex items-center space-x-3 pl-3 border-l border-border">
            {user && (
              <div className="hidden md:block text-right" >
                <p className="text-sm font-medium text-foreground">{user}</p>
                <p className="text-xs text-muted-foreground">{userRole}</p>
              </div>
            )}

            {/* User Avatar with Dropdown */}
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => { window.location.href = "/perfil" }}
                  className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
                  title="perfil"
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
                onClick={() => { user ? handleLogout() : window.location.href = "/login" }}
                className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
                title={user ? "Cerrar sesión" : "Log In"}
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
            className="lg:hidden hover:bg-muted transition-brand"
          >
            <Icon name={isMenuOpen ? "X" : "Menu"} size={20} />
          </Button>
        </div>
      </div>

    </header>
  );
};

export default memo(Header);