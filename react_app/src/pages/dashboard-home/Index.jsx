import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import QuickActionsCard from './components/QuickActionsCard';
import PendingTasksCard from './components/PendingTasksCard';
import StatsOverviewCard from './components/StatsOverviewCard';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const DashboardHome = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const user = sessionStorage.getItem("user");
  const mail = sessionStorage.getItem("email");
  
  // Detectar si es móvil
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileScreen(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Mock user data
  const currentUser = {
    id: 1,
    name: user,
    email: mail,
    department: "Recursos Humanos",
    position: "HR Specialist",
    employeeId: "ACC-2024-001",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
  };

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const toggleSidebar = () => {
    if (isMobileScreen) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleNavigation = () => {
    if (isMobileScreen) {
      setIsMobileOpen(false);
    }
  };

  const handleEmergencyContact = () => {
    window.location.href = '/support-portal?category=emergency';
  };

  const handleQuickHelp = () => {
    window.location.href = '/support-portal?section=help';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />
      
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        isMobileOpen={isMobileOpen}
        onNavigate={handleNavigation}
      />
      
      {/* Mobile Overlay */}
      {isMobileScreen && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" 
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content - RESPONSIVE */}
      <main className={`transition-all duration-300 ${
        isMobileScreen ? 'lg:ml-0' : sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      } pt-16 lg:pt-20`}>
        <div className="px-4 sm:px-6 lg:p-6 space-y-4 lg:space-y-6 max-w-7xl mx-auto">
          {/* Page Header - RESPONSIVE */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="lg:hidden w-10 h-10"
              >
                <Icon name="Menu" size={20} />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Panel de Control</h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  Gestiona tus solicitudes y mantente al día con las novedades
                </p>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid - RESPONSIVE */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
            {/* Left Column - Primary Actions */}
            <div className="xl:col-span-2 space-y-4 lg:space-y-6">
              {/* Quick Actions */}
              <QuickActionsCard />
              
              {/* Stats Overview */}
              <StatsOverviewCard />
            </div>

            {/* Right Column - Secondary Info */}
            <div className="space-y-4 lg:space-y-6">
              {/* Pending Tasks */}
              <PendingTasksCard />
              
              {/* System Status Card - RESPONSIVE */}
              <div className="bg-card rounded-xl shadow-brand border border-border p-4 lg:p-6">
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                  <h3 className="text-base lg:text-lg font-semibold text-foreground">Estado del Sistema</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse-subtle"></div>
                    <span className="text-sm text-success font-medium">Operativo</span>
                  </div>
                </div>
                <div className="space-y-2 lg:space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Portal RRHH</span>
                    <span className="text-success">✓ Online</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sistema de Documentos</span>
                    <span className="text-success">✓ Online</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Notificaciones</span>
                    <span className="text-success">✓ Online</span>
                  </div>
                  <div className="pt-2 lg:pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Última actualización: {currentTime?.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Section - RESPONSIVE */}
          <div className="bg-card rounded-xl shadow-brand border border-border p-4 lg:p-6 mt-6 lg:mt-8">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-3 lg:space-x-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <Icon name="Building2" size={20} color="white" className="lg:w-6 lg:h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm lg:text-base">Acciona HR Portal</h4>
                  <p className="text-sm text-muted-foreground text-xs lg:text-sm">
                    Tu plataforma integral de recursos humanos
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:flex lg:items-center lg:justify-end lg:space-x-6 text-xs lg:text-sm text-muted-foreground">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <Icon name="Shield" size={14} className="lg:w-4 lg:h-4" />
                  <span>Seguro y Confiable</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <Icon name="Clock" size={14} className="lg:w-4 lg:h-4" />
                  <span>24/7 Disponible</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <Icon name="Users" size={14} className="lg:w-4 lg:h-4" />
                  <span>Soporte Dedicado</span>
                </div>
              </div>
            </div>
            <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                © {new Date()?.getFullYear()} Acciona. Todos los derechos reservados. 
                <br className="sm:hidden" />
                Portal desarrollado para mejorar tu experiencia laboral.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardHome;