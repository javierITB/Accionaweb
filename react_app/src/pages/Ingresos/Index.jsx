import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const createDataURL = (logoObj) => {
  if (logoObj && logoObj.fileData && logoObj.mimeType) {
    return `data:${logoObj.mimeType};base64,${logoObj.fileData}`;
  }
  return null;
};

const CompanyReg = () => {
  const [Logins, setLogins] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    direccion: '',
    encargado: '',
    rut_encargado: '',
    logo: null,
    logoUrl: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('register');

  // ESTADOS DEL SIDEBAR - ACTUALIZADOS
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

  // EFECTO PARA MANEJAR REDIMENSIONAMIENTO - ACTUALIZADO
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileScreen(isMobile);

      if (isMobile) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobileScreen) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsDesktopOpen(!isDesktopOpen);
    }
  };

  const handleNavigation = () => {
    if (isMobileScreen) {
      setIsMobileOpen(false);
    }
  };

  const fetchLogins = async () => {
    try {
      const response = await fetch('https://accionaapi.vercel.app/api/auth/logins/todos');
      if (response.ok) {
        const loginsData = await response.json();
        setLogins(loginsData);
      }
    } catch (error) {
      console.error('Error cargando logins:', error);
      console.error('No se pudo cargar la lista de loginsData');
    }
  };

  useEffect(() => {
    fetchLogins();
  }, []);

  const getTabContent = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Logins registrados</h3>
        {Logins.length === 0 ? (
          <p className="text-muted-foreground">No hay Logins registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-border rounded-lg">
              <thead className="bg-muted text-sm text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">Logo</th>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">RUT</th>
                  <th className="px-4 py-2 text-left">Dirección</th>
                  <th className="px-4 py-2 text-left">Encargado</th>
                  <th className="px-4 py-2 text-left">RUT Encargado</th>
                  <th className="px-4 py-2 text-left">Fecha Registro</th>
                </tr>
              </thead>
              <tbody>
                {Logins.map((empresa) => (
                  empresa.nombre != "Todas" &&
                  <tr key={empresa._id} className="border-t hover:bg-muted/30 transition">
                    <td className="px-4 py-2">
                      {empresa.logo ? (
                        <img
                          src={empresa.logo}
                          alt={`Logo ${empresa.nombre}`}
                          className="w-10 h-10 object-contain rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <Icon name="Building2" size={16} className="text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 font-medium text-sm">{empresa.nombre}</td>
                    <td className="px-4 py-2 text-sm whitespace-nowrap">{empresa.rut}</td>
                    <td className="px-4 py-2 text-sm">{empresa.direccion || '—'}</td>
                    <td className="px-4 py-2 text-sm">{empresa.encargado || '—'}</td>
                    <td className="px-4 py-2 text-sm whitespace-nowrap">{empresa.rut_encargado || '—'}</td>
                    <td className="px-4 py-2">
                      {empresa.createdAt
                        ? new Date(empresa.createdAt).toLocaleDateString('es-CL')
                        : '—'}
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // CLASE DE MARGEN - ACTUALIZADA
  const mainMarginClass = isMobileScreen
    ? 'ml-0'
    : isDesktopOpen ? 'ml-64' : 'ml-16';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {(isMobileOpen || !isMobileScreen) && (
        <>
          <Sidebar
            isCollapsed={!isDesktopOpen}
            onToggleCollapse={toggleSidebar}
            isMobileOpen={isMobileOpen}
            onNavigate={handleNavigation}
          />

          {isMobileScreen && isMobileOpen && (
            <div
              className="fixed inset-0 bg-foreground/50 z-40"
              onClick={toggleSidebar}
            ></div>
          )}
        </>
      )}

      {!isMobileOpen && isMobileScreen && (
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

      {/* CONTENIDO PRINCIPAL - ACTUALIZADO */}
      <main className={`transition-all duration-300 ${mainMarginClass} pt-20 md:pt-16`}>
        <div className="p-6 space-y-6 container-main">
          {/* HEADER CON BOTÓN DE TOGGLE - AGREGADO */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Registro de Logins</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Verifica el registro e información de Logins en la plataforma
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* BOTÓN DE TOGGLE DEL SIDEBAR - AGREGADO */}
              <div className="hidden md:flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  iconName={isDesktopOpen ? "PanelLeftClose" : "PanelLeftOpen"}
                  iconSize={20}
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg">
            <div className="p-6">
              {getTabContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompanyReg;