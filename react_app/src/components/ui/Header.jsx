import React, { useState, useEffect, useRef, memo } from 'react';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import Icon from '../AppIcon';
import Button from './Button';
import NotificationsCard from './NotificationsCard';

const Header = ({ className = '' }) => {
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const user = sessionStorage.getItem("user");
  const cargo = sessionStorage.getItem("cargo");
  const userMail = sessionStorage.getItem("email");
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRole, setUserRole] = useState(cargo || 'Usuario');
  const [shouldShake, setShouldShake] = useState(false);

  // REF para el audio y para seguir el rastro del conteo anterior sin disparar re-renders
  const audioRef = useRef(new Audio('/bell.mp3')); // Ruta a tu archivo en public
  const prevUnreadCountRef = useRef(0);
  const menuRef = useRef(null);
  const notiRef = useRef(null);
  const userMenuRef = useRef(null);

  const [theme, setTheme] = useState(
    localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  useEffect(() => {
    audioRef.current.volume = 1.0;
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
    <div 
      className={`
        fixed top-4 z-50 flex flex-col pointer-events-none transition-all duration-500
        /* Lógica Responsiva: */
        ${isHeaderHidden 
          ? 'right-1 sm:right-1 lg:right-2 items-end' 
          : 'left-1/2 -translate-x-1/2 w-full max-w-[95%] items-center md:left-auto md:translate-x-0 md:right-1 lg:right-2 md:w-auto md:items-end'}
      `}
    >
      <header 
        ref={(el) => {
          menuRef.current = el;
          notiRef.current = el;
        }}
        className={`
          relative pointer-events-auto
          bg-card border border-border 
          rounded-2xl shadow-brand 
          transition-all duration-500 ease-in-out
          flex items-center px-2
          ${isHeaderHidden ? 'w-14 h-14 justify-center' : 'h-16 md:h-20 w-auto justify-center gap-2 md:gap-3'}
          ${className}
        `}
      >
        <div className="flex items-center gap-2 md:gap-3">
          
          <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                setIsHeaderHidden(!isHeaderHidden);
                setIsNotiOpen(false);
              }} 
              iconName={isHeaderHidden ? "Eye" : "EyeOff"} 
              className="rounded-xl w-10 h-10 md:w-11 md:h-11 text-muted-foreground" 
              iconSize={20}
          />

          {!isHeaderHidden && (
            <>
              <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleTheme} 
                  iconName={theme === 'dark' ? "Sun" : "Moon"} 
                  className="rounded-xl w-10 h-10 md:w-11 md:h-11" 
                  iconSize={20}
              />

              <div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleNoti}
                  /* RECUPERADO: hover:bg-primary y transition-brand */
                  className={`relative hover:bg-primary transition-brand rounded-xl w-10 h-10 md:w-11 md:h-11 ${shouldShake ? 'animate-bell-shake' : ''} ${isNotiOpen ? 'bg-primary text-white' : ''}`}
                  iconName="Bell"
                  /* RECUPERADO: iconSize={18} */
                  iconSize={18}
                >
                  {unreadCount > 0 && (
                    /* RECUPERADO: Sin borde (border-2 border-card eliminado) */
                    <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 min-w-[1.25rem] h-5 px-1.5 text-xs font-bold text-white bg-error rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-3 border-l border-border/60">
                {user && (
                  <div className="hidden lg:block text-right leading-tight pr-1">
                    <p className="text-sm font-bold text-foreground truncate max-w-[150px]">{user}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{userRole}</p>
                  </div>
                )}
                
                {user && (
                  <div className="relative" ref={userMenuRef}>
                    <button 
                      /* RECUPERADO: window.location.href directo */
                      onClick={() => { window.location.href = "/perfil" }} 
                      className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm hover:scale-105 active:scale-95 transition-all"
                    >
                      {user.charAt(0).toUpperCase()}
                    </button>
                  </div>
                )}

                <button 
                  onClick={() => { user ? handleLogout() : handleNavigation('/login') }} 
                  className="w-10 h-10 md:w-12 md:h-12 bg-muted/50 hover:bg-error/10 hover:text-error rounded-xl flex items-center justify-center text-muted-foreground transition-colors"
                  /* RECUPERADO: Atributo title */
                  title={user ? "Cerrar Sesión" : "Iniciar Sesión"}
                >
                  {/* RECUPERADO: size={16} para el Logout */}
                  <Icon name={user ? "LogOut" : "LogIn"} size={16} />
                </button>
              </div>
            </>
          )}
        </div>

        {isNotiOpen && !isHeaderHidden && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-0 mt-3 pointer-events-auto animate-scale-in origin-top w-full min-w-full">
            <div className="bg-popover border border-border rounded-xl shadow-brand-hover overflow-hidden w-full">
              <NotificationsCard user={userMail} onUnreadChange={setUnreadCount} />
            </div>
          </div>
        )}
      </header>
    </div>
  );
};

export default memo(Header);