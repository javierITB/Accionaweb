import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header'; // 🔄 Ruta Ajustada
import Sidebar from '../../components/ui/Sidebar'; // 🔄 Ruta Ajustada
import RegisterForm from './components/RegisterForm';
import Icon from '../../components/AppIcon';// 🔄 Ruta Ajustada

const CompanyReg = () => {
  const [empresas, setEmpresas] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    direccion: '',
    encargado: '',
    logo: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('register');
  
  // 🔄 ESTADOS AÑADIDOS PARA LA ADAPTABILIDAD
  const [isDesktopOpen, setIsDesktopOpen] = useState(true); // Controla el colapso en Desktop
  const [isMobileOpen, setIsMobileOpen] = useState(false); // Controla la apertura total en Mobile
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

  // 🔄 FUNCIÓN AÑADIDA: Toggle Unificado para Desktop y Móvil
  const toggleSidebar = () => {
    if (isMobileScreen) {
      // En móvil, alternar el estado de apertura/cierre
      setIsMobileOpen(!isMobileOpen);
    } else {
      // En desktop, alternar el estado de abierto/colapsado
      setIsDesktopOpen(!isDesktopOpen);
    }
  };
  
  // 🔄 FUNCIÓN AÑADIDA: Lógica de navegación para cerrar el Sidebar en móvil
  const handleNavigation = () => {
    if (isMobileScreen) {
      setIsMobileOpen(false); // Cierra el sidebar al navegar
    }
  };

  // 🔄 EFECTO AÑADIDO: Manejo de Redimensionamiento
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileScreen(isMobile);
      
      // Si pasa a móvil, forzar cerrado. Si pasa a desktop, forzar abierto (por defecto).
      if (isMobile) {
        setIsMobileOpen(false); 
      } else {
        setIsDesktopOpen(true); 
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar empresas desde la base de datos
  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    try {
      const response = await fetch('https://accionaapi.vercel.app/api/auth/empresas/todas');
      if (response.ok) {
        const empresasData = await response.json();
        setEmpresas(empresasData);
      }
    } catch (error) {
      console.error('Error cargando empresas:', error);
      // Usar console.error en lugar de alert
      console.error('No se pudo cargar la lista de empresas');
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para registrar nueva empresa
  const handleRegisterEmpresa = async () => {
    // Validaciones básicas
    if (!formData.nombre || !formData.rut) {
      alert('Por favor completa los campos obligatorios: Nombre y RUT');
      return;
    }

    setIsLoading(true);

    try {
      // Crear FormData para enviar archivos
      const submitData = new FormData();
      submitData.append('nombre', formData.nombre);
      submitData.append('rut', formData.rut);
      submitData.append('direccion', formData.direccion || '');
      submitData.append('encargado', formData.encargado || '');
      
      if (formData.logo) {
        submitData.append('logo', formData.logo);
      }

      const response = await fetch('https://accionaapi.vercel.app/api/auth/empresas/register', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar la empresa');
      }

      // const result = await response.json(); // No se usa result
      
      alert('Empresa registrada exitosamente');
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        rut: '',
        direccion: '',
        encargado: '',
        logo: null
      });

      // Recargar lista de empresas
      fetchEmpresas();

    } catch (error) {
      console.error('Error registrando empresa:', error);
      alert('Error al registrar la empresa: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'register':
        return (
          <RegisterForm
            formData={formData}
            onUpdateFormData={updateFormData}
            onRegister={handleRegisterEmpresa}
            isLoading={isLoading}
          />
        );
      case 'list':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Empresas Registradas</h3>
            {empresas.length === 0 ? (
              <p className="text-muted-foreground">No hay empresas registradas.</p>
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
                      <th className="px-4 py-2 text-left">Fecha Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empresas.map((empresa) => (
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
                        <td className="px-4 py-2 font-medium">{empresa.nombre}</td>
                        <td className="px-4 py-2">{empresa.rut}</td>
                        <td className="px-4 py-2">{empresa.direccion || '—'}</td>
                        <td className="px-4 py-2">
                          {empresa.encargado || '—'}
                        </td>
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
      default:
        return null;
    }
  };
  
  // 🔄 CLASE DE MARGEN: Definir el margen para <main>
  const mainMarginClass = isMobileScreen 
    ? 'ml-0' 
    : isDesktopOpen ? 'ml-64' : 'ml-16';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* 🔄 Sidebar: Renderiza si está abierto en desktop O si está abierto en móvil */}
      {(isDesktopOpen || isMobileOpen) && (
        <>
          <Sidebar 
            isCollapsed={isMobileScreen ? false : !isDesktopOpen} 
            onToggleCollapse={toggleSidebar} 
            isMobileOpen={isMobileOpen} 
            onNavigate={handleNavigation} 
          />
          
          {/* 🔄 Overlay semi-transparente en móvil cuando el sidebar está abierto */}
          {isMobileScreen && isMobileOpen && (
            <div 
              className="fixed inset-0 bg-foreground/50 z-40" 
              onClick={toggleSidebar} // Cierra el sidebar al hacer clic en el overlay
            ></div>
          )}
        </>
      )}
      
      {/* 🔄 Botón Flotante para Abrir el Sidebar (Visible solo en móvil cuando está cerrado) */}
      {!isMobileOpen && isMobileScreen && (
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={toggleSidebar}
            className="w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors min-touch-target"
          >
            {/* Ícono de menú */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {/* 🔄 Contenido Principal: Aplicar margen adaptable */}
      <main className={`transition-all duration-300 ${mainMarginClass} pt-16`}>
        <div className="p-6 space-y-6 container-main"> {/* Usar container-main para padding lateral */}
          {/* Header de la página */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestión de Empresas</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Administra el registro y información de empresas en la plataforma
              </p>
            </div>
          </div>

          {/* Tabs de Navegación */}
          <div className="bg-card border border-border rounded-lg">
            <div className="border-b border-border">
              <div className="flex flex-wrap gap-2 p-4">
                <button
                  onClick={() => setActiveTab('register')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors min-touch-target ${
                    activeTab === 'register'
                      ? 'bg-primary text-primary-foreground shadow-brand'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon name="Plus" size={16} className="inline mr-2" />
                  Registrar Empresa
                </button>
                <button
                  onClick={() => setActiveTab('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors min-touch-target ${
                    activeTab === 'list'
                      ? 'bg-primary text-primary-foreground shadow-brand'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon name="List" size={16} className="inline mr-2" />
                  Lista de Empresas ({empresas.length})
                </button>
              </div>
            </div>
            
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
