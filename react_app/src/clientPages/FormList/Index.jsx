import React, { useState, useEffect } from 'react';
import Header from '../components/ui/Header';
import QuickActionsCard from './components/QuickActionsCard';

import BackButton from 'clientPages/components/BackButton';
import Footer from 'clientPages/components/ui/Footer.jsx';

const DashboardHome = ({ section, userPermissions = [] }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  if (!userPermissions.includes('view_formularios')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-card rounded-xl shadow-lg border border-border">
          <h2 className="text-xl font-bold text-red-500 mb-2">Acceso Restringido</h2>
          <p className="text-muted-foreground">No tienes permisos para ver la lista de formularios.</p>
        </div>
      </div>
    );
  }
  // const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCurrentTime(new Date());
  //   }, 60000);

  //   return () => clearInterval(timer);
  // }, []);

  // const toggleSidebar = () => {
  //   setSidebarCollapsed(!sidebarCollapsed);
  // };

  // const handleEmergencyContact = () => {
  //   window.location.href = '/support-portal?category=emergency';
  // };

  // const handleQuickHelp = () => {
  //   window.location.href = '/support-portal?section=help';
  // };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className={`transition-all duration-300 pt-16 lg:pt-20`}>
        <div className="px-4 sm:px-6 lg:p-6 space-y-4 lg:space-y-6 max-w-7xl mx-auto">


          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 gap-3 w-full mb-4">

            <div className="button-container text-md">
              <BackButton />
            </div>
            {/* Left Column - Primary Actions */}
            <div className="xl:col-span-2 space-y-6 lg:space-y-12 w-full">
              {/* Quick Actions */}
              <QuickActionsCard section={section} />
            </div>
          </div>

          <Footer />



        </div>
      </main>
    </div>
  );
};

export default DashboardHome;