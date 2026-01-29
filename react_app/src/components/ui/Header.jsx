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

  const audioRef = useRef(new Audio('/bell.mp3'));
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

        if (!isInitialLoad && newUnreadCount > prevUnreadCountRef.current) {
          audioRef.current.play().catch(error => console.log("Audio bloqueado", error));
          setShouldShake(true);
          setTimeout(() => setShouldShake(false), 1500);
        } else if (isInitialLoad && newUnreadCount > 0) {
          setShouldShake(true);
          setTimeout(() => setShouldShake(false), 1500);
        }

        setUnreadCount(newUnreadCount);
        prevUnreadCountRef.current = newUnreadCount;
      } catch (error) {
        console.error("Error en polling:", error);
      }
    };

    fetchUnreadCount(true);
    intervalId = setInterval(() => fetchUnreadCount(false), 10000);
    return () => clearInterval(intervalId);
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
    <div className="fixed top-4 right-1 sm:right-1 lg:right-2 z-50 flex flex-col items-end pointer-events-none">
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
          flex items-center
          ${isHeaderHidden ? 'w-14 h-14 justify-center' : 'h-16 md:h-20 pl-3 pr-1 md:pl-5 md:pr-1 min-w-[320px] md:min-w-[550px] lg:min-w-[200px] justify-between'}
          ${className}
        `}
      >
        <div className="flex items-center space-x-2 md:space-x-3">
          
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
              <div className="hidden sm:block">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleTheme} 
                    iconName={theme === 'dark' ? "Sun" : "Moon"} 
                    className="rounded-xl w-10 h-10 md:w-11 md:h-11" 
                    iconSize={20}
                />
              </div>

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

              <div className="flex items-center space-x-2 md:space-x-3 pl-2 md:pl-3 border-l border-border/60">
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

              <div className="md:hidden">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMenu}
                    className="rounded-xl w-10 h-10"
                    iconName={isMenuOpen ? "X" : "Menu"}
                />
              </div>
            </>
          )}
        </div>

        {isNotiOpen && !isHeaderHidden && (
          <div className="absolute top-full right-0 mt-3 pointer-events-auto animate-scale-in origin-top-right w-full min-w-full">
            <div className="bg-popover border border-border rounded-xl shadow-brand-hover overflow-hidden w-full">
              <NotificationsCard user={userMail} onUnreadChange={setUnreadCount} />
            </div>
          </div>
        )}
      </header>

      {isMenuOpen && !isHeaderHidden && (
        <div className="md:hidden pointer-events-auto w-full mt-2 px-4 pb-4 pt-1 space-y-2 bg-card rounded-2xl border border-border shadow-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            iconName={theme === 'dark' ? "Sun" : "Moon"}
            className="w-full justify-start rounded-xl text-muted-foreground py-3"
            iconPosition="left"
          >
            {theme === 'dark' ? "Modo Claro" : "Modo Oscuro"}
          </Button>
          {user && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation('/perfil')}
                iconName="User"
                className="w-full justify-start rounded-xl text-muted-foreground py-3"
                iconPosition="left"
              >
                Mi Perfil
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                iconName="LogOut"
                className="w-full justify-start rounded-xl text-error hover:bg-error/5 py-3"
                iconPosition="left"
              >
                Cerrar Sesión
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(Header);