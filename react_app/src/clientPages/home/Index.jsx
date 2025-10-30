import React, { useState, useEffect } from 'react';
import Header from '../components/ui/Header';
import WelcomeCard from './components/WelcomeCard';
import QuickActionsCard from './components/QuickActionsCard';
import RecentActivityCard from './components/RecentActivityCard';
import StatsOverviewCard from './components/StatsOverviewCard';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';

const DashboardHome = () => {

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  // 💡 Obteniendo el estado de usuario para el control de visibilidad
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

  // La función toggleSidebar no se usa, pero la dejamos por si el Header la necesita
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleEmergencyContact = () => {
    window.location.href = '/support-portal?category=emergency';
  };

  const handleQuickHelp = () => {
    window.location.href = '/support-portal?section=help';
  };

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Main Content: pt-20 compensa el header fijo */}
      <main className={`transition-all duration-300 pt-20`}>
        {/* 💡 APLICACIÓN DE LA CLASE CONTAINER-MAIN */}
        <div className="container-main py-6 space-y-6">


          {/* Welcome Section */}
          <WelcomeCard user={currentUser} />

          {/* Main Dashboard Grid */}
          {/* 💡 AJUSTE DE LA GRILLA PRINCIPAL */}
          <div >

            {/* Columna Principal: Ocupa 100% en móvil, 8/12 en tablet, 9/12 en desktop */}
            <div className="md:col-span-8 lg:col-span-9 space-y-6">

              {!user && (
                <div className="bg-card border border-border rounded-xl shadow-brand p-6 text-center space-y-4">
                  <Icon name="LogIn" size={48} className="mx-auto text-muted-foreground opacity-70" />
                  <h3 className="text-xl font-semibold text-foreground">Inicie sesión para utilizar la plataforma.</h3>
                  <p className="text-muted-foreground">
                    Acceda a su cuenta para ver la actividad reciente, formularios personalizados y notificaciones.
                  </p>
                  <Button
                    variant="default"
                    onClick={handleLoginRedirect}
                    iconName="LogIn"
                    iconPosition="left"
                    size="default"
                  >
                    Iniciar Sesión
                  </Button>
                </div>

              )}

              {/* Renderizado Condicional de Actividad Reciente */}
              {user && (
                <div>
                  <QuickActionsCard />
                  <RecentActivityCard />
                </div>
              )}

              {/* Stats Overview */}
              {/* Si la añades, puedes darle un ancho completo aquí */}
            </div>

          </div>

          {/* Footer Section: Eliminamos el padding redundante y usamos clases adaptables */}
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
              {/* Texto de información: Añadimos flex-wrap para evitar desbordamiento en móvil */}
              <div className="flex flex-wrap items-center justify-center md:justify-end space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2 mb-2 md:mb-0">
                  <Icon name="Shield" size={16} />
                  <span>Seguro y Confiable</span>
                </div>
                <div className="flex items-center space-x-2 mb-2 md:mb-0">
                  <Icon name="Clock" size={16} />
                  <span>24/7 Disponible</span>
                </div>
                <div className="flex items-center space-x-2 mb-2 md:mb-0">
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
