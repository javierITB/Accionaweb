import React, { useState } from 'react';
import Icon from '../AppIcon';
import Button from './Button';
import NotificationsCard from './NotificationsCard';

const Header = ({ className = '' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotiOpen, setisNotiOpen] = useState(false);
  
  const user = sessionStorage.getItem("user");

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
   
  const handleNavigation = (path) => {
    window.location.href = path;
    setIsMenuOpen(false);
  };
  
  const toggleNoti = () => {
    setisNotiOpen(!isNotiOpen);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-brand ${className}`}>
      <div className="flex items-center justify-between h-16 px-6 bg-warning">
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg gradient-primary">
            <Icon name="Building2" size={24} color="white" strokeWidth={2} />
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
              className="px-4 py-2 text-sm font-medium text-foreground hover:text-foreground hover:bg-muted transition-brand"
            >
              {item?.name}
            </Button>
          ))}
          
          {/* More Menu */}
          <div className="relative">
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

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleNoti}
            className="relative hover:bg-muted transition-brand"
            iconName = "Bell"
          >
            <span className="absolute-top-1 -right-1 w-2 h-2 bg-error rounded-full animate-pulse-subtle"></span>
          </Button>
          
          {isNotiOpen && (
            <div className="absolute right-0 top-full mt-2 mr-2w-48 bg-popover border border-border rounded-lg shadow-brand-hover animate-scale-in">
                <div className="by-2">
                  <NotificationsCard />
                </div>
              </div>
            )} 



          {/* User Profile */}
          <div className="flex items-center space-x-3 pl-3 border-l border-border">
            {user && (<div className="hidden md:block text-right">
              <p className="text-sm font-medium text-foreground">{user}</p>
              <p className="text-xs text-muted-foreground">HR Specialist</p>
            </div>)
            }
            {user &&
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-white">SJ</span>
              </div>
            }
            {!user &&
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-white"></span>
              </div>
            }
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