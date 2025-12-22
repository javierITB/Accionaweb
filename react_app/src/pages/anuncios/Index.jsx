// react_app/src/pages/anuncios/Index.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import AnuncioCreator from './components/AnuncioCreator';
import './anuncios.css';

const AnunciosPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
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
    <div className="flex min-h-screen bg-background">
      <Sidebar 
        activeItem="anuncios"
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        isMobileOpen={isMobileSidebarOpen}
        onNavigate={handleNavigate}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        <Header 
          title="Crear Anuncio" 
          subtitle="Envía notificaciones masivas a usuarios"
          onMenuClick={toggleMobileSidebar}
        />
        
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