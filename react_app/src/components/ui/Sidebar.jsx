import React from 'react';
import Icon from '../AppIcon';
import Button from './Button';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ isCollapsed = false, onToggleCollapse, className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = sessionStorage.getItem("user");

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard-home', icon: 'LayoutDashboard', description: 'Pagina principal de admin' },
    { name: 'Formularios', path: '/form-center', icon: 'FileText', description: 'Panel gestion de formularios' },
    { name: 'Respuestas', path: '/RespuestasForms', icon: 'FileText', description: 'Gestionar respuestas de formularios' },
    { name: 'Seguimiento de Solicitudes', path: '/request-tracking', icon: 'Clock', description: 'Monitorear estado de solicitudes' },
    { name: 'Soporte', path: '/support-portal', icon: 'HelpCircle', description: 'Conseguir ayuda y recuros' },
    
  ];

  const quickActions = [
    { name: 'Tiempo de respuesta', icon: 'Calendar', path: '/form-center?type=timeoff' },
    { name: 'Reporte de gastos', icon: 'Receipt', path: '/form-center?type=expense' },
    { name: 'Soporte de TI', icon: 'Monitor', path: '/support-portal?category=it' },
  ];

  const handleNavigation = (path) => navigate(path);

  return (
    <aside className={`fixed left-0 top-16 bottom-0 z-40 bg-card border-r border-border transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} ${className}`}>
      <div className="flex flex-col h-full">

        {/* Header */}
        {!isCollapsed && (
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Navegación</h2>
            <p className="text-xs text-muted-foreground">Acceso a herramientas</p>
          </div>
        )}

        {/* Main navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center rounded-lg transition-all duration-300 
                  ${isActive ? 'bg-primary text-primary-foreground shadow-brand' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}
                  ${isCollapsed ? 'justify-center px-2 py-3' : 'justify-start px-3 py-3'}
                `}
                title={isCollapsed ? item.name : ''}
              >
                <Icon
                  name={item.icon}
                  size={isCollapsed ? 24 : 20} // tamaño dinámico según colapso
                  className={`${isActive ? 'text-primary-foreground' : ''} ${!isCollapsed ? 'mr-3' : ''} transition-transform duration-300`}
                />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs opacity-75 truncate">{item.description}</div>
                  </div>
                )}
                {!isCollapsed && isActive && <div className="w-2 h-2 bg-primary-foreground rounded-full ml-2"></div>}
              </button>
            );
          })}
        </nav>

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="p-4 border-t border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
            <div className="space-y-1 mt-2">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => handleNavigation(action.path)}
                  className="w-full flex items-center px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all duration-300"
                >
                  <Icon name={action.icon} size={isCollapsed ? 24 : 16} className="mr-3" />
                  {action.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User Status */}
        <div className="p-4 border-t border-border flex items-center justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-success to-accent rounded-full flex items-center justify-center">
            <Icon name="User" size={isCollapsed ? 24 : 20} color="white" />
          </div>
          {!isCollapsed && (
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
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse} // <- se controla desde afuera
            iconName={isCollapsed ? "ChevronRight" : "ChevronLeft"}
            iconSize={16}
            className={`w-full ${isCollapsed ? 'px-2' : 'px-3'} py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300`}
          >
            {!isCollapsed && 'Collapse'}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
