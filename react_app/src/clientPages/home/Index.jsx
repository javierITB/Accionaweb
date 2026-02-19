import React from 'react';
import Header from '../components/ui/Header';
import QuickActionsCard from './components/QuickActionsCard';
import RecentActivityCard from './components/RecentActivityCard';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';
import Footer from 'clientPages/components/ui/Footer';

const DashboardHome = () => {
  // const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  // const [currentTime, setCurrentTime] = useState(new Date());

  const user = sessionStorage.getItem("user");
  // const mail = sessionStorage.getItem("email");

  // Mock user data
  // const currentUser = {
  //   id: 1,
  //   name: user,
  //   email: mail,
  //   department: "Recursos Humanos",
  //   position: "HR Specialist",
  //   employeeId: "ACC-2024-001",
  //   avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
  // };

  // Update time every minute
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCurrentTime(new Date());
  //   }, 60000);
  //   return () => clearInterval(timer);
  // }, []);


  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Main Content: Ajustamos el padding top para móvil y desktop */}
      <main className={`transition-all duration-300 pt-16 lg:pt-20`}>
        {/* CONTENEDOR PRINCIPAL RESPONSIVE */}
        <div className="px-4 sm:px-6 lg:px-8 xl:px-20 py-4 lg:py-6 space-y-4 lg:space-y-6 max-w-8xl mx-auto">
         
          {/* Main Dashboard Grid - ESTRUCTURA DE DOS COLUMNAS PRINCIPALES */}
          <div className="w-full xl:flex xl:space-x-6">

            {/* 1. Columna Izquierda: Acciones Rápidas (Ancho fijo) */}
            {user && (
              <div className="w-full xl:w-80 flex-shrink-0 mb-4 xl:mb-0">
                <QuickActionsCard orientation="vertical" />
              </div>
            )}

            {/* 2. Columna Derecha: Contenido Principal (WelcomeCard + Mis Solicitudes) */}
            <div className=" w-full xl:flex-grow">
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

          <Footer />
        </div>
      </main>
    </div>
  );
};

export default DashboardHome;