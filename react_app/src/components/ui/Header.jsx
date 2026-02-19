import React, { useState, useEffect, useRef, memo } from 'react';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import Icon from '../AppIcon';
import Button from './Button';
import NotificationsCard from './NotificationsCard';
import { usePermissions } from '../../context/PermissionsContext';
import ChatLegalSidebar from './ChatSidebar'; // Asegúrate de que la ruta sea correcta

const Header = ({ className = '' }) => {
  const [isHeaderHidden, setIsHeaderHidden] = useState(() => {
    return localStorage.getItem('isHeaderHidden') === 'true';
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false); // Estado para el Asesor Legal

  const user = sessionStorage.getItem("user");
  const userMail = sessionStorage.getItem("email");
  const { userRole, userPermissions } = usePermissions();
  const [unreadCount, setUnreadCount] = useState(0);
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
    localStorage.setItem('isHeaderHidden', isHeaderHidden);
  }, [isHeaderHidden]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
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

  const toggleTheme = () => setTheme(curr => (curr === 'light' ? 'dark' : 'light'));
  const toggleNoti = () => setIsNotiOpen(!isNotiOpen);
  const handleLogout = () => { sessionStorage.clear(); window.location.href = '/'; };

  return (
    <div
      className={`
        fixed top-4 z-50 flex flex-col pointer-events-none transition-all duration-500
        ${isHeaderHidden
          ? 'right-1 sm:right-1 lg:right-2 items-end'
          : 'left-1/2 -translate-x-1/2 w-full max-w-[95%] items-center md:left-auto md:translate-x-0 md:right-1 lg:right-2 md:w-auto md:items-end'}
      `}
    >
      <header
        ref={(el) => { menuRef.current = el; notiRef.current = el; }}
        className={`
          relative pointer-events-auto bg-card border border-border rounded-2xl shadow-brand transition-all duration-500 ease-in-out flex items-center px-2
          ${isHeaderHidden ? 'w-14 h-14 justify-center' : 'h-16 md:h-20 w-auto justify-center gap-2 md:gap-3'}
          ${className}
        `}
      >
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setIsHeaderHidden(!isHeaderHidden); setIsNotiOpen(false); }}
            iconName={isHeaderHidden ? "Eye" : "EyeOff"}
            className="rounded-xl w-10 h-10 md:w-11 md:h-11 text-muted-foreground"
            iconSize={20}
          />

          {!isHeaderHidden && (
            <>
              {/* Botón Chat - Modo Abierto */}
              {userPermissions.includes('view_chatbot') && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  iconName="MessageSquare"
                  className={`rounded-xl w-10 h-10 md:w-11 md:h-11 transition-all ${isChatOpen ? 'bg-primary text-white shadow-lg scale-105' : 'text-muted-foreground'}`}
                  iconSize={18}
                />
              )}

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
                  className={`relative hover:bg-primary transition-brand rounded-xl w-10 h-10 md:w-11 md:h-11 ${shouldShake ? 'animate-bell-shake' : ''} ${isNotiOpen ? 'bg-primary text-white' : ''}`}
                  iconName="Bell"
                  iconSize={18}
                >
                  {unreadCount > 0 && (
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
                      onClick={() => { window.location.href = "/perfil" }}
                      className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm hover:scale-105 active:scale-95 transition-all"
                    >
                      {user.charAt(0).toUpperCase()}
                    </button>
                  </div>
                )}
                <button
                  onClick={() => { user ? handleLogout() : (window.location.href = '/login') }}
                  className="w-10 h-10 md:w-12 md:h-12 bg-muted/50 hover:bg-error/10 hover:text-error rounded-xl flex items-center justify-center text-muted-foreground transition-colors"
                  title={user ? "Cerrar Sesión" : "Iniciar Sesión"}
                >
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

      {/* Botón Chat - Modo Cerrado (Debajo del ojo) */}
      {isHeaderHidden && userPermissions.includes('view_chatbot') && (
        <div className="mt-3 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-500">
          <Button
            variant="default"
            size="icon"
            onClick={() => setIsChatOpen(!isChatOpen)}
            iconName="Scale"
            className={`w-14 h-14 rounded-2xl shadow-brand transition-all duration-300 ${isChatOpen ? 'bg-accent text-white rotate-12 scale-110' : 'bg-card text-primary border border-border hover:bg-primary hover:text-white'}`}
            iconSize={24}
          />
        </div>
      )}

      {/* Isla del Chat Legal */}
      <ChatLegalSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
};

export default memo(Header);