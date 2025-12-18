// react_app/src/pages/anuncios/Index.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Button from '../../components/ui/Button';
import AnunciosList from './components/AnunciosList';
import AnuncioCreator from './components/AnuncioCreator';
import './anuncios.css';

const AnunciosPage = () => {
  const [showCreator, setShowCreator] = useState(false);
  const [selectedAnuncio, setSelectedAnuncio] = useState(null);
  const [stats, setStats] = useState({ totalAnuncios: 0, totalNotificaciones: 0 });
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

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('https://back-acciona.vercel.app/api/anuncios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const totalAnuncios = result.data.length;
          const totalNotificaciones = result.data.reduce((sum, anuncio) => {
            return sum + (anuncio.resultado?.modificados || 0);
          }, 0);
          
          setStats({
            totalAnuncios,
            totalNotificaciones
          });
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleAnuncioSuccess = () => {
    setShowCreator(false);
    setSelectedAnuncio(null);
    fetchStats();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
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
          title="Anuncios y Comunicados" 
          subtitle="Gestiona las notificaciones masivas para usuarios"
          onMenuClick={toggleMobileSidebar}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Anuncios</h1>
              <p className="text-gray-600">Crea y gestiona comunicados masivos</p>
            </div>
            
            <Button
              onClick={() => setShowCreator(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Anuncio
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AnunciosList 
                onSelectAnuncio={setSelectedAnuncio}
                onCreateNew={() => setShowCreator(true)}
              />
            </div>

            <div className="lg:col-span-1">
              {selectedAnuncio ? (
                <AnuncioPreview anuncio={selectedAnuncio} />
              ) : (
                <AnunciosStats stats={stats} />
              )}
            </div>
          </div>
        </main>

        {showCreator && (
          <AnuncioCreator
            anuncio={selectedAnuncio}
            onClose={() => {
              setShowCreator(false);
              setSelectedAnuncio(null);
            }}
            onSuccess={handleAnuncioSuccess}
          />
        )}
      </div>
    </div>
  );
};

const AnuncioPreview = ({ anuncio }) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <h3 className="text-lg font-semibold mb-4">Vista Previa</h3>
    <div className="space-y-4">
      <div className="p-4 rounded-lg border" style={{ borderLeftColor: anuncio.color, borderLeftWidth: '4px' }}>
        <div className="flex items-center mb-2">
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-3`} 
                style={{ backgroundColor: `${anuncio.color}20` }}>
            <span className="text-sm font-medium" style={{ color: anuncio.color }}>
              {anuncio.icono === 'paper' ? '📄' : 
               anuncio.icono === 'alert' ? '⚠️' : 
               anuncio.icono === 'info' ? 'ℹ️' : '📢'}
            </span>
          </span>
          <h4 className="font-semibold">{anuncio.titulo}</h4>
        </div>
        <p className="text-gray-600 text-sm">{anuncio.descripcion}</p>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Prioridad: {anuncio.prioridad}</span>
            <span>{new Date(anuncio.fechaEnvio).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AnunciosStats = ({ stats }) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
    <div className="space-y-4">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <p className="text-3xl font-bold text-blue-600">{stats.totalAnuncios}</p>
        <p className="text-sm text-blue-500">Anuncios enviados</p>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <p className="text-3xl font-bold text-green-600">{stats.totalNotificaciones}</p>
        <p className="text-sm text-green-500">Notificaciones enviadas</p>
      </div>
      <p className="text-sm text-gray-500 text-center">
        {stats.totalAnuncios === 0 ? 
          "Crea tu primer anuncio para comenzar" : 
          "Última actualización: ahora"}
      </p>
    </div>
  </div>
);

export default AnunciosPage;