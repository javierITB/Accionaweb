import React, { useState, useEffect, useRef, memo } from 'react';
import { apiFetch, API_BASE_URL } from '../../utils/api';
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

  const [shouldShake, setShouldShake] = useState(false);
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  // REF para el audio y para seguir el rastro del conteo anterior sin disparar re-renders
  const audioRef = useRef(new Audio('/bell.mp3')); // Ruta a tu archivo en public
  const prevUnreadCountRef = useRef(0);

  const [theme, setTheme] = useState(
    localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  const menuRef = useRef(null);
  const notiRef = useRef(null);
  const userMenuRef = useRef(null);
  const userMail = sessionStorage.getItem("email");

  // --- EFECTOS ---

  // Efecto para el audio (opcional: ajustar volumen)
  useEffect(() => {
    audioRef.current.volume = 1.0; // Volumen al máximo
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        if (!userMail) return;
        const response = await apiFetch(`${API_BASE_URL}/auth/full/${userMail}`);
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.rol || cargo || 'Usuario');
          return;
        }
      } catch (error) {
        console.error('Error obteniendo rol del usuario:', error);
      }
    };
    fetchUserRole();
  }, [userMail, cargo]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false);
      if (notiRef.current && !notiRef.current.contains(event.target)) setIsNotiOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Polling de Notificaciones con lógica de sonido
  useEffect(() => {
    if (!userMail) return;

    let intervalId;

    const fetchUnreadCount = async (isInitialLoad = false) => {
      try {
        const response = await apiFetch(`${API_BASE_URL}/noti/${userMail}/unread-count`);
        const data = await response.json();
        const newUnreadCount = data.unreadCount || 0;

        // LÓGICA DE SONIDO Y AGITACIÓN
        // Si el nuevo conteo es mayor al que teníamos guardado en la referencia
        if (!isInitialLoad && newUnreadCount > prevUnreadCountRef.current) {
          // 1. Reproducir sonido
          audioRef.current.play().catch(error => {
            console.log("El navegador bloqueó el audio hasta que el usuario interactúe con la página.", error);
          });

          // 2. Activar agitación visual
          setShouldShake(true);
          setTimeout(() => setShouldShake(false), 1500);
        }
        else if (isInitialLoad && newUnreadCount > 0) {
          // Agitación inicial sin sonido (opcional)
          setShouldShake(true);
          setTimeout(() => setShouldShake(false), 1500);
        }

        // Actualizar estados y referencias
        setUnreadCount(newUnreadCount);
        prevUnreadCountRef.current = newUnreadCount;

      } catch (error) {
        console.error("Error en polling de no leídas:", error);
      }
    };

    fetchUnreadCount(true);
    intervalId = setInterval(() => fetchUnreadCount(false), 10000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [userMail]);

  const toggleTheme = () => setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
  const toggleNoti = () => setIsNotiOpen(!isNotiOpen);
  const handleNavigation = (path) => { window.location.href = path; };
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = '/';
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-brand ${className}`}>
      <div className="flex items-center justify-between h-20 px-6">
        <button
          onClick={() => handleNavigation('/')}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden">
            <img src={logo} alt="Logo Acciona" className="max-w-full max-h-full" style={{ objectFit: 'contain' }} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-foreground leading-tight">NexoDesk Acciona</h1> 
            <span className="text-xs text-muted-foreground font-mono hidden sm:block">Panel de administración</span>
          </div>
        </button>

        <nav className="hidden lg:flex items-center space-x-1">
          {/* Los botones de Inicio y Ayuda han sido removidos */}
        </nav>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:block">
            <Button variant="ghost" size="icon" onClick={toggleTheme} iconName={theme === 'dark' ? "Sun" : "Moon"} />
          </div>

          <div ref={notiRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleNoti}
              className={`relative hover:bg-primary transition-brand w-10 h-10 lg:w-12 lg:h-12 ${shouldShake ? 'animate-bell-shake' : ''}`}
              iconName="Bell"
              iconSize={18}
            >
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 min-w-[1.25rem] h-5 px-1.5 text-xs font-bold text-white bg-error rounded-full flex items-center justify-center">
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

          <div className="hidden sm:flex items-center space-x-3 pl-3 border-l border-border">
            {user && (
              <div className="hidden md:block text-right" >
                <p className="text-sm font-medium text-foreground">{user}</p>
                <p className="text-xs text-muted-foreground">{userRole}</p>
              </div>
            )}
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => { window.location.href = "/perfil" }} className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold">
                  {user.charAt(0).toUpperCase()}
                </button>
              </div>
            )}
            <div className="relative">
              <button onClick={() => { user ? handleLogout() : window.location.href = "/login" }} className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white">
                <Icon name={user ? "LogOut" : "LogIn"} size={16} />
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

      {/* Mobile Menu - Solo modo claro/oscuro y perfil/cierre de sesión */}
      {isMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-4 space-y-2 bg-card border-t border-border">
          <div className="border-b border-border pb-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              iconName={theme === 'dark' ? "Sun" : "Moon"}
              className="w-full justify-start px-4 py-2 text-md font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              iconPosition="left"
            >
              {theme === 'dark' ? "Modo Claro" : "Modo Oscuro"}
            </Button>
          </div>

          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation('/perfil')}
                iconName="User"
                className="w-full justify-start px-4 py-2 text-md font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                iconPosition="left"
              >
                Mi Perfil
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                iconName="LogOut"
                className="w-full justify-start px-4 py-2 text-md font-medium text-error hover:bg-error/10 hover:text-error"
                iconPosition="left"
              >
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation('/login')}
              iconName="LogIn"
              className="w-full justify-start px-4 py-2 text-md font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              iconPosition="left"
            >
              Iniciar Sesión
            </Button>
          )}
        </div>
      )}
    </header>
  );
};

export default memo(Header);