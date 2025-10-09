import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import WelcomeCard from './components/WelcomeCard';
import QuickActionsCard from './components/QuickActionsCard';
import PendingTasksCard from './components/PendingTasksCard';
import RecentActivityCard from './components/RecentActivityCard';
import StatsOverviewCard from './components/StatsOverviewCard';
import NotificationsCard from './components/NotificationsCard';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const DashboardHome = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const user = sessionStorage.getItem("user");
  const mail = sessionStorage.getItem("email");
  
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
    setSidebarCollapsed(!sidebarCollapsed);
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
      <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)
        } />
      {/* Main Content */}
      <main className={`transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      } pt-16`}>
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="lg:hidden"
              >
                <Icon name="Menu" size={20} />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Panel de Control</h1>
                <p className="text-muted-foreground mt-1">
                  Gestiona tus solicitudes y mantente al día con las novedades
                </p>
              </div>
            </div>
            
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Primary Actions */}
            <div className="xl:col-span-2 space-y-6">
              {/* Quick Actions */}
              <QuickActionsCard />
              
              {/* Stats Overview */}
              <StatsOverviewCard />
              
              
            </div>

            {/* Right Column - Secondary Info */}
            <div className="space-y-6">
              {/* Pending Tasks */}
              <PendingTasksCard />
              
              {/* System Status Card */}
              <div className="bg-card rounded-xl shadow-brand border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Estado del Sistema</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse-subtle"></div>
                    <span className="text-sm text-success font-medium">Operativo</span>
                  </div>
                </div>
                <div className="space-y-3">
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
                  <div className="pt-3 border-t border-border">
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

          {/* Footer Section */}
          <div className="bg-card rounded-xl shadow-brand border border-border p-6 mt-8">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <Icon name="Building2" size={24} color="white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Acciona HR Portal</h4>
                  <p className="text-sm text-muted-foreground">
                    Tu plataforma integral de recursos humanos
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Icon name="Shield" size={16} />
                  <span>Seguro y Confiable</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon name="Clock" size={16} />
                  <span>24/7 Disponible</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon name="Users" size={16} />
                  <span>Soporte Dedicado</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                © {new Date()?.getFullYear()} Acciona. Todos los derechos reservados. 
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