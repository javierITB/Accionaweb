import React, { useState, useEffect } from 'react';
import Header from '../components/ui/Header';
import WelcomeCard from './components/WelcomeCard';
import QuickActionsCard from './components/QuickActionsCard';
import RecentActivityCard from './components/RecentActivityCard';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';

const DashboardHome = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
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

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Main Content: Ajustamos el padding top para móvil y desktop */}
      <main className={`transition-all duration-300 pt-16 lg:pt-20`}>
        {/* 💡 CONTENEDOR PRINCIPAL RESPONSIVE */}
        <div className="px-4 sm:px-6 lg:px-8 xl:px-20 py-4 lg:py-6 space-y-4 lg:space-y-6 max-w-8xl mx-auto"> 
           {/* Welcome Section (Se mueve dentro de la columna derecha) */}
              <div className="w-full">
                <WelcomeCard user={currentUser} />
              </div>
          {/* Main Dashboard Grid - ESTRUCTURA DE DOS COLUMNAS PRINCIPALES */}
          <div className="w-full lg:flex lg:space-x-6"> 
            
            {/* 1. Columna Izquierda: Acciones Rápidas (Ancho fijo) */}
            {user && (
                <div className="w-full lg:w-80 flex-shrink-0 mb-4 lg:mb-0">
                    {/* El WelcomeCard ya no está aquí */}
                    <QuickActionsCard orientation="vertical" />
                </div>
            )}
            
            {/* 2. Columna Derecha: Contenido Principal (WelcomeCard + Mis Solicitudes) */}
            <div className=" w-full lg:flex-grow"> 
              {/* Mensaje de Login */}
              {!user && (
                <div className="bg-card border border-border rounded-xl shadow-brand p-4 lg:p-6 text-center space-y-3 lg:space-y-4 w-full"> 
                  <Icon name="LogIn" size={40} className="mx-auto text-muted-foreground opacity-70 lg:w-12 lg:h-12" />
                  <h3 className="text-lg lg:text-xl font-semibold text-foreground">Inicie sesión para utilizar la plataforma.</h3>
                  <p className="text-sm lg:text-base text-muted-foreground px-2"> 
                    Acceda a su cuenta para ver la actividad reciente, formularios personalizados y notificaciones.
                  </p>
                  <Button
                    variant="default"
                    onClick={handleLoginRedirect}
                    iconName="LogIn"
                    iconPosition="left"
                    size="default"
                    className="w-full sm:w-auto"
                  >
                    Iniciar Sesión
                  </Button>
                </div>
              )}

              {/* Mis Solicitudes (RecentActivityCard) (Se mueve y se alinea a la derecha) */}
              {user && (
                <div className="w-full">
                  <RecentActivityCard />
                </div>
              )}
            </div>
          </div>

          {/* Footer Section - Mejorado para móvil */}
          <div className="bg-card rounded-xl shadow-brand border border-border p-4 lg:p-6 mt-6 lg:mt-8 w-full"> {/* Added full width */}
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-3 lg:space-x-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <Icon name="Building2" size={20} color="white" className="lg:w-6 lg:h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm lg:text-base">Acciona HR Portal</h4>
                  <p className="text-xs lg:text-sm text-muted-foreground">
                    Tu plataforma integral de recursos humanos
                  </p>
                </div>
              </div>
              
              {/* Info text - Mejor disposición en móvil */}
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
                © {new Date().getFullYear()} Acciona. Todos los derechos reservados.
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