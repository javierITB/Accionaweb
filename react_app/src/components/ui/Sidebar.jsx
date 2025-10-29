import React from 'react';
import Icon from '../AppIcon'; // Se mantiene la ruta a '../AppIcon'
import Button from './Button'; // 🔄 CORRECCIÓN: Se ajusta la ruta a './Button' (asumiendo que es un componente hermano en 'ui')
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// 💡 Agregamos los props isMobileOpen y onNavigate, que se pasan desde FormCenter.jsx
const Sidebar = ({ 
  isCollapsed = false, 
  onToggleCollapse, 
  className = '', 
  isMobileOpen = false, 
  onNavigate 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 1. Estados para la navegación dinámica y el estado de carga
  const [navigationItems, setNavigationItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Obtener datos del usuario
  const user = sessionStorage.getItem("user");
  const mail = sessionStorage.getItem("email");
  const token = sessionStorage.getItem("token");
  const cargo = sessionStorage.getItem("cargo");

  // 🔄 CORRECCIÓN CRÍTICA: La navegación real siempre usa navigate(path). 
  // onNavigate (si se pasa) solo se usa para el efecto secundario (cerrar el menú).
  const handleNavigation = (path) => {
    // 1. 🟢 ASEGURAMOS LA REDIRECCIÓN DE REACT ROUTER SIEMPRE
    navigate(path);
    
    // 2. Ejecutar la acción de cierre (si el padre la proporcionó, lo cual ocurre en móvil)
    if (onNavigate) { 
      onNavigate(path); 
    }
  };

  // 2. useEffect para la llamada a la API (sin cambios)
  useEffect(() => {
    if (!mail || !token || !cargo) {
        console.error("Datos de usuario insuficientes para filtrar el menú.");
        setIsLoading(false);
        return;
    }

    const fetchMenu = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`https://accionaapi.vercel.app/api/menu/filter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mail: mail,
            token: token,
            cargo: cargo,
          }),
        });

        if (!response.ok) {
          throw new Error(`Error en la respuesta del servidor: ${response.statusText}`);
        }

        const data = await response.json();
        setNavigationItems(data);
      } catch (error) {
        console.error("Fallo al obtener el menú filtrado:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, [mail, token, cargo]);

  const quickActions = [
    { name: 'Tiempo de respuesta', icon: 'Calendar', path: '/form-center?type=timeoff' },
    { name: 'Reporte de gastos', icon: 'Receipt', path: '/form-center?type=expense' },
    { name: 'Soporte de TI', icon: 'Monitor', path: '/support-portal?category=it' },
  ];

  // 🔄 Lógica de Clases Condicionales (Desktop vs Mobile)
  
  // 1. Visibilidad y posición: En móvil abierto, debe ser fixed y z-60.
  const mobileOpenClasses = isMobileOpen 
    ? 'fixed inset-y-0 left-0 h-screen w-64 z-[60] shadow-2xl'
    : 'hidden md:block fixed left-0 top-16 bottom-0 z-40'; // Oculto en móvil por defecto, fijo en desktop
    
  // 2. Ancho: W-64 en móvil abierto o desktop expandido, W-16 en desktop colapsado.
  const widthClasses = (isCollapsed && !isMobileOpen) ? 'w-16' : 'w-64';

  const finalClasses = `bg-card border-r border-border transition-all duration-300 ${widthClasses} ${mobileOpenClasses} ${className}`;

  if (isLoading) {
    // 💡 Ajuste en la vista de carga para que sea responsive
    return (
      <aside
        className={`fixed left-0 top-16 bottom-0 z-40 bg-card border-r border-border flex items-center justify-center ${
          (isCollapsed && !isMobileOpen) ? "w-16" : "w-64"
        } hidden md:flex ${className}`}
      >
        <span className="text-muted-foreground text-sm">Cargando menú...</span>
      </aside>
    );
  }

  return (
    <aside className={finalClasses}>
      <div className="flex flex-col h-full">

        {/* ❌ Botón de Cierre para Móvil (cuando está isMobileOpen) */}
        {isMobileOpen && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleCollapse} 
            className="absolute top-4 right-4 z-[70] text-foreground hover:bg-muted min-touch-target"
          >
            <Icon name="X" size={24} />
          </Button>
        )}

        {/* Header */}
        {!(isCollapsed && !isMobileOpen) && (
          <div className="p-4 border-b border-border pt-2">
            <h2 className="text-sm font-semibold text-foreground">Navegación</h2>
            <p className="text-xs text-muted-foreground">Acceso a herramientas</p>
          </div>
        )}

        {/* Main navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isTextVisible = !(isCollapsed && !isMobileOpen); // Es visible si no está colapsado Y no está en móvil
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center rounded-lg transition-all duration-300 min-touch-target
                  ${isActive ? 'bg-primary text-primary-foreground shadow-brand' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}
                  ${!isTextVisible ? 'justify-center px-2 py-3' : 'justify-start px-3 py-3'}
                `}
                title={!isTextVisible ? item.name : ''}
              >
                <Icon
                  name={item.icon}
                  size={!isTextVisible ? 24 : 20}
                  className={`${isActive ? 'text-primary-foreground' : ''} ${isTextVisible ? 'mr-3' : ''} transition-transform duration-300`}
                />
                {isTextVisible && (
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs opacity-75 truncate">{item.description}</div>
                  </div>
                )}
                {isTextVisible && isActive && <div className="w-2 h-2 bg-primary-foreground rounded-full ml-2"></div>}
              </button>
            );
          })}
        </nav>

        {/* Quick Actions */}
        {!(isCollapsed && !isMobileOpen) && (
          <div className="p-4 border-t border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
            <div className="space-y-1 mt-2">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => handleNavigation(action.path)}
                  className="w-full flex items-center px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all duration-300 min-touch-target"
                >
                  <Icon name={action.icon} size={16} className="mr-3" />
                  {action.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User Status */}
        <div className="p-4 border-t border-border flex items-center justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-success to-accent rounded-full flex items-center justify-center">
            <Icon name="User" size={!isCollapsed ? 20 : 24} color="white" />
          </div>
          {!(isCollapsed && !isMobileOpen) && (
            <div className="flex-1 min-w-0 ml-3">
              <p className="text-sm font-medium text-foreground truncate">{user}</p>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <div className="p-4 border-t border-border hidden md:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            iconName={isCollapsed ? "ChevronRight" : "ChevronLeft"}
            iconSize={16}
            className={`w-full ${isCollapsed ? 'px-2' : 'px-3'} py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300 min-touch-target`}
          >
            {!isCollapsed && 'Collapse'}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
