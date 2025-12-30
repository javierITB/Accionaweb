// react_app/src/pages/anuncios/Index.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import AnuncioCreator from './components/AnuncioCreator';
import Button from '../../components/ui/Button';
import './anuncios.css';

const AnunciosPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileScreen(isMobile);
      if (isMobile) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobileScreen) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleNavigate = (path) => {
    setIsMobileSidebarOpen(false);
    navigate(path);
  };

  const handleAnuncioSuccess = () => {
    // Redirigir al dashboard después de enviar exitosamente
    navigate('/dashboard-home');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {(isMobileSidebarOpen || !isMobileScreen) && (
        <Sidebar 
          activeItem="anuncios"
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          isMobileOpen={isMobileSidebarOpen}
          onNavigate={handleNavigate}
        />
      )}
      
      {isMobileScreen && isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40" onClick={toggleSidebar}></div>
      )}

      {/* BOTÓN FLOTANTE MÓVIL */}
      {!isMobileSidebarOpen && isMobileScreen && (
        <div className="fixed bottom-4 left-4 z-50">
          <Button
            variant="default"
            size="icon"
            onClick={toggleSidebar}
            iconName="Menu"
            className="w-12 h-12 rounded-full shadow-brand-active"
          />
        </div>
      )}

      <div className={`flex flex-col transition-all duration-300 ${
        isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">Nuevo Anuncio</h1>
              <p className="text-muted-foreground">Completa el formulario para enviar notificaciones</p>
            </div>
            
            <AnuncioCreator onSuccess={handleAnuncioSuccess} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AnunciosPage;