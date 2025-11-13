import React, { useState, useEffect } from 'react';
import Header from '../components/ui/Header';
import QuickActionsCard from './components/QuickActionsCard';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';

const DashboardHome = ( {section} ) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
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
      
      {/* Main Content */}
      <main className={`transition-all duration-300 pt-16 lg:pt-20`}>
        <div className="px-4 sm:px-6 lg:p-6 space-y-4 lg:space-y-6 max-w-7xl mx-auto">
          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 gap-4 lg:gap-6 w-full my-4">
            {/* Left Column - Primary Actions */}
            <div className="xl:col-span-2 space-y-6 lg:space-y-12 w-full">
              {/* Quick Actions */}
              <QuickActionsCard section={section}/>
            </div>
          </div>

          {/* Footer Section - RESPONSIVE */}
          <div className="bg-card rounded-xl shadow-brand border border-border p-4 lg:p-6 mt-6 lg:mt-8 w-full">
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