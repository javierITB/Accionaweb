import React, { useState, useEffect, useRef, memo } from 'react'; // <-- Importar memo
import Icon from '../AppIcon';
import Button from './Button';
import NotificationsCard from './NotificationsCard';
import logo from "/logo2.png";

const Header = ({ className = '' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const user = sessionStorage.getItem("user");
  const cargo = sessionStorage.getItem("cargo");
  const [unreadCount, setUnreadCount] = useState(0); // Estado para el contador del ícono
  const [userRole, setUserRole] = useState(cargo || 'Usuario'); 

  // 1. 🌙 Estado del Tema
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
    { name: 'Settings', path: '/settings', icon: 'Settings' },
    { name: 'Help', path: '/help', icon: 'HelpCircle' },
  ];

  const [isNotiOpen, setIsNotiOpen] = useState(false);

  // Efecto 1: Obtener el rol del usuario (Ejecución única)
  useEffect(() => {
    const fetchUserRole = async () => {
      // ... (Lógica de fetchUserRole - se mantiene igual)
      try {
        if (!userMail) return;

        const response = await fetch(`https://accionaapi.vercel.app/api/auth/full/${userMail}`);
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.rol || cargo || 'Usuario');
          return;
        }

        const responseBasic = await fetch(`https://accionaapi.vercel.app/api/auth/${userMail}`);
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

  // Efecto 2: Aplicar tema (Se mantiene igual)
  useEffect(() => {
    const root = document.documentElement; 
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]); 

  // Efecto 3: Manejo de clics fuera (Se mantiene igual)
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

  // 💥 EFECTO 4: POLLING CONDICIONAL DE NO LEÍDAS 💥
  // Este efecto sólo inicia el intervalo si unreadCount es 0. 
  // Si unreadCount > 0, el polling se detiene, y solo se reinicia
  // cuando el usuario interactúa y el NotificationsCard resetea el conteo a 0.
  useEffect(() => {
    if (!userMail) return;

    let intervalId;
    
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`https://accionaapi.vercel.app/api/noti/${userMail}/unread-count`);
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


  // ... (Funciones auxiliares se mantienen igual)
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
              Acciona RRHH Portal
            </h1>
            <span className="text-xs text-muted-foreground font-mono">
              Panel de administración y gestión
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

          {/* Botón de Modo Oscuro/Claro */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-muted transition-brand"
            // Cambiar el icono dependiendo del tema actual
            iconName={theme === 'dark' ? "Sun" : "Moon"}
          />

          {/* Notifications (MODIFICADO para usar el estado 'unreadCount' actualizado por la Card) */}
          <div ref={notiRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleNoti}
              className="relative hover:bg-muted transition-brand"
              iconName="Bell"
            >
              {unreadCount > 0 && ( // usa el estado actualizado por el polling
                <span className="absolute top-1 -right-1 w-2 h-2 bg-error rounded-full animate-pulse-subtle"></span>
              )}
            </Button>

            {isNotiOpen && (
              <div className="absolute right-0 top-full mt-2 mr-2 bg-popover border border-border rounded-lg shadow-brand-hover animate-scale-in">
                <div className="py-2">
                  {/* El NotificationsCard tiene su propio polling de 3 segundos
                  y maneja el conteo cuando está abierto. */}
                  <NotificationsCard 
                    user={userMail} // Usar userMail
                    onUnreadChange={setUnreadCount} 
                  />
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
                  onClick={() => { window.location.href = "/profile" }}
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

// Envolver el Header en memo para evitar re-renderizaciones innecesarias
export default memo(Header);