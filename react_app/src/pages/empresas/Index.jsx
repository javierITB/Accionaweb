import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import RegisterForm from './components/RegisterForm';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const createDataURL = (logoObj) => {
  if (logoObj && logoObj.fileData && logoObj.mimeType) {
    return `data:${logoObj.mimeType};base64,${logoObj.fileData}`;
  }
  return null;
};

const CompanyReg = () => {
  const [empresas, setEmpresas] = useState([]);
  const [editingEmpresa, setEditingEmpresa] = useState(null);
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

  const clearForm = () => {
    setFormData({
      nombre: '',
      rut: '',
      direccion: '',
      encargado: '',
      rut_encargado: '',
      logo: null,
      logoUrl: null
    });
    setEditingEmpresa(null);
    setActiveTab('register');
    if (window.history.replaceState) {
      window.history.replaceState(null, null, window.location.pathname);
    }
  };

  const handleEditEmpresa = async (empresaId) => {
    setIsLoading(true);
    setActiveTab('register');
    setEditingEmpresa(null);

    try {
      const response = await fetch(`https://accionaweb.vercel.app/api/auth/empresas/${empresaId}`);
      if (!response.ok) {
        throw new Error('Error al cargar la empresa para editar');
      }
      const empresa = await response.json();

      const logoDataURL = createDataURL(empresa.logo);

      setEditingEmpresa(empresa);

      setFormData({
        nombre: empresa.nombre || '',
        rut: empresa.rut || '',
        direccion: empresa.direccion || '',
        encargado: empresa.encargado || '',
        rut_encargado: empresa.rut_encargado || '',
        logo: null,
        logoUrl: logoDataURL
      });

      if (window.history.replaceState) {
        window.history.replaceState(null, null, `?id=${empresaId}`);
      }

    } catch (error) {
      console.error('Error al editar empresa:', error);
      alert('No se pudo cargar la empresa para editar: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveEmpresa = async (empresaId) => {
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar esta empresa? Esta acción es irreversible.");
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
        const response = await fetch(`https://accionaweb.vercel.app/api/auth/empresas/${empresaId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al eliminar la empresa');
        }

        alert('Empresa eliminada exitosamente');
        
        clearForm();
        fetchEmpresas();

    } catch (error) {
        console.error('Error eliminando empresa:', error);
        alert(`Error al eliminar la empresa: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const empresaId = urlParams.get('id');

    if (empresaId) {
      handleEditEmpresa(empresaId);
    }
  }, []);

  const fetchEmpresas = async () => {
    try {
      const response = await fetch('https://accionaweb.vercel.app/api/auth/empresas/todas');
      if (response.ok) {
        const empresasData = await response.json();

        const transformedData = empresasData.map(empresa => ({
          ...empresa,
          logo: empresa.logo && typeof empresa.logo === 'object'
            ? createDataURL(empresa.logo)
            : empresa.logo
        }));

        setEmpresas(transformedData);
      }
    } catch (error) {
      console.error('Error cargando empresas:', error);
      console.error('No se pudo cargar la lista de empresas');
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegisterEmpresa = async () => {
    if (!formData.nombre || !formData.rut) {
      alert('Por favor completa los campos obligatorios: Nombre y RUT');
      return;
    }

    setIsLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('nombre', formData.nombre);
      submitData.append('rut', formData.rut);
      submitData.append('direccion', formData.direccion || '');
      submitData.append('encargado', formData.encargado || '');
      submitData.append('rut_encargado', formData.rut_encargado || '');

      if (formData.logo instanceof File) {
        submitData.append('logo', formData.logo);
      } else if (editingEmpresa && editingEmpresa.logo && !formData.logoUrl) {
        submitData.append('logo', 'DELETE_LOGO');
      }

      const isUpdating = !!editingEmpresa;
      const method = isUpdating ? 'PUT' : 'POST';
      const url = isUpdating
        ? `https://accionaweb.vercel.app/api/auth/empresas/${editingEmpresa._id}`
        : 'https://accionaweb.vercel.app/api/auth/empresas/register';

      const response = await fetch(url, {
        method: method,
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error al ${isUpdating ? 'actualizar' : 'registrar'} la empresa`);
      }

      alert(`Empresa ${isUpdating ? 'actualizada' : 'registrada'} exitosamente`);

      clearForm();
      fetchEmpresas();

    } catch (error) {
      console.error('Error procesando empresa:', error);
      alert(`Error al procesar la empresa: ${error.message}`);
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
            isEditing={!!editingEmpresa}
            onCancelEdit={clearForm}
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
                      <th className="px-4 py-2 text-left">RUT Encargado</th>
                      <th className="px-4 py-2 text-left">Fecha Registro</th>
                      <th className="px-4 py-2 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empresas.map((empresa) => (
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
                        <td className="px-4 py-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEmpresa(empresa._id)}
                            iconName="Edit"
                            iconSize={16}
                            className="text-primary hover:bg-primary/10"
                          >
                            Editar
                          </Button>
                        </td>
                        <td>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveEmpresa(empresa._id)}
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Icon name="Trash2" size={14} />
                          </Button>
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

  // CLASE DE MARGEN - ACTUALIZADA
  const mainMarginClass = isMobileScreen
    ? 'ml-0'
    : isDesktopOpen ? 'ml-64' : 'ml-16';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* IMPLEMENTACIÓN UNIFICADA DEL SIDEBAR - ACTUALIZADA */}
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
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestión de Empresas</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Administra el registro y información de empresas en la plataforma
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

              {editingEmpresa && (
                <Button
                  variant="ghost"
                  onClick={clearForm}
                  iconName="Plus"
                >
                  Registrar Nueva Empresa
                </Button>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg">
            <div className="border-b border-border">
              <div className="flex flex-wrap gap-2 p-4">
                <button
                  onClick={() => setActiveTab('register')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors min-touch-target ${activeTab === 'register'
                      ? 'bg-primary text-primary-foreground shadow-brand'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                  <Icon name="Plus" size={16} className="inline mr-2" />
                  {editingEmpresa ? 'Editar Empresa' : 'Registrar Empresa'}
                </button>
                <button
                  onClick={() => setActiveTab('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors min-touch-target ${activeTab === 'list'
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