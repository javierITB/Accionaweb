import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header'; // Ruta Ajustada
import Sidebar from '../../components/ui/Sidebar'; // Ruta Ajustada
import RegisterForm from './components/RegisterForm';
import Icon from '../../components/AppIcon'; // Ruta Ajustada
import Button from '../../components/ui/Button'; // Necesario para el botón de editar

// Función utilitaria para convertir el objeto { fileData, mimeType } en Data URL
const createDataURL = (logoObj) => {
  if (logoObj && logoObj.fileData && logoObj.mimeType) {
    return `data:${logoObj.mimeType};base64,${logoObj.fileData}`;
  }
  return null;
};

const CompanyReg = () => {
  const [empresas, setEmpresas] = useState([]);
  const [editingEmpresa, setEditingEmpresa] = useState(null); // Nuevo estado para edición
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    direccion: '',
    encargado: '',
    logo: null,
    logoUrl: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('register');

  // 🔄 ESTADOS PARA LA ADAPTABILIDAD
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

  // 🔄 FUNCIÓN AÑADIDA: Toggle Unificado para Desktop y Móvil
  const toggleSidebar = () => {
    if (isMobileScreen) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsDesktopOpen(!isDesktopOpen);
    }
  };

  // 🔄 FUNCIÓN AÑADIDA: Lógica de navegación para cerrar el Sidebar en móvil
  const handleNavigation = () => {
    if (isMobileScreen) {
      setIsMobileOpen(false);
    }
  };

  // 🔄 EFECTO AÑADIDO: Manejo de Redimensionamiento
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileScreen(isMobile);

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

  // Función de limpieza de formulario
  const clearForm = () => {
    setFormData({
      nombre: '',
      rut: '',
      direccion: '',
      encargado: '',
      logo: null,
      logoUrl: null
    });
    setEditingEmpresa(null);
    setActiveTab('register');
    // Limpiar la URL después de la edición/cancelación
    if (window.history.replaceState) {
      window.history.replaceState(null, null, window.location.pathname);
    }
  };

  // 🔄 FUNCIÓN: GET Empresa por ID y prepara el formulario para la edición
  const handleEditEmpresa = async (empresaId) => {
    setIsLoading(true);
    setActiveTab('register');
    setEditingEmpresa(null); // Limpieza temporal

    try {
      const response = await fetch(`https://accionaapi.vercel.app/api/auth/empresas/${empresaId}`);
      if (!response.ok) {
        throw new Error('Error al cargar la empresa para editar');
      }
      const empresa = await response.json();

      // 💡 CONVERSIÓN DE LOGO: Transformar el objeto logo a Data URL
      const logoDataURL = createDataURL(empresa.logo);

      setEditingEmpresa(empresa);

      // Precargar formData con los datos existentes
      setFormData({
        nombre: empresa.nombre || '',
        rut: empresa.rut || '',
        direccion: empresa.direccion || '',
        encargado: empresa.encargado || '',
        logo: null, // El archivo logo se maneja como null a menos que se suba uno nuevo
        logoUrl: logoDataURL // Usar Data URL para la previsualización existente
      });

      // Asegurar que la URL tenga el ID para refrescos/compartir
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
        const response = await fetch(`https://accionaapi.vercel.app/api/auth/empresas/${empresaId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al eliminar la empresa');
        }

        alert('Empresa eliminada exitosamente');
        
        // Limpiar formulario y recargar lista
        clearForm();
        fetchEmpresas();

    } catch (error) {
        console.error('Error eliminando empresa:', error);
        alert(`Error al eliminar la empresa: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  // 🔄 EFECTO AÑADIDO: Detectar ID en la URL al cargar
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const empresaId = urlParams.get('id');

    // Si existe 'id', iniciamos la carga de datos para edición
    if (empresaId) {
      handleEditEmpresa(empresaId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const fetchEmpresas = async () => {
    try {
      const response = await fetch('https://accionaapi.vercel.app/api/auth/empresas/todas');
      if (response.ok) {
        const empresasData = await response.json();

        // 💡 CONVERSIÓN DE LOGO EN EL LISTADO
        const transformedData = empresasData.map(empresa => ({
          ...empresa,
          // Sobrescribir logo si es un objeto con la Data URL para visualización
          logo: empresa.logo && typeof empresa.logo === 'object'
            ? createDataURL(empresa.logo)
            : empresa.logo // Ya es una URL o null
        }));

        setEmpresas(transformedData);
      }
    } catch (error) {
      console.error('Error cargando empresas:', error);
      console.error('No se pudo cargar la lista de empresas');
    }
  };

  // Cargar empresas desde la base de datos
  useEffect(() => {
    fetchEmpresas();
  }, []);

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 🔄 FUNCIÓN: Maneja POST (Registro) o PUT (Actualización)
  const handleRegisterEmpresa = async () => {
    // Validaciones básicas
    if (!formData.nombre || !formData.rut) {
      alert('Por favor completa los campos obligatorios: Nombre y RUT');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Preparar datos
      const submitData = new FormData();
      submitData.append('nombre', formData.nombre);
      submitData.append('rut', formData.rut);
      submitData.append('direccion', formData.direccion || '');
      submitData.append('encargado', formData.encargado || '');

      // Si formData.logo es un objeto File, lo adjuntamos (nuevo o editado)
      if (formData.logo instanceof File) {
        submitData.append('logo', formData.logo);
      } else if (editingEmpresa && editingEmpresa.logo && !formData.logoUrl) {
        // Caso: Se estaba editando, tenía logo antiguo, y el usuario lo eliminó
        submitData.append('logo', 'DELETE_LOGO');
      }

      // 2. Definir método y URL
      const isUpdating = !!editingEmpresa;
      const method = isUpdating ? 'PUT' : 'POST';
      const url = isUpdating
        ? `https://accionaapi.vercel.app/api/auth/empresas/${editingEmpresa._id}`
        : 'https://accionaapi.vercel.app/api/auth/empresas/register';

      // 3. Ejecutar la llamada
      const response = await fetch(url, {
        method: method,
        body: submitData, // FormData se envía directamente sin Content-Type
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error al ${isUpdating ? 'actualizar' : 'registrar'} la empresa`);
      }

      alert(`Empresa ${isUpdating ? 'actualizada' : 'registrada'} exitosamente`);

      // 4. Limpiar y Recargar
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
            isEditing={!!editingEmpresa} // Indica al formulario si está editando
            onCancelEdit={clearForm} // Permite al usuario cancelar la edición
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
                      <th className="px-4 py-2 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empresas.map((empresa) => (
                      empresa.nombre != "Todas" &&
                      <tr key={empresa._id} className="border-t hover:bg-muted/30 transition">
                        <td className="px-4 py-2">
                          {/* Usa empresa.logo que ya fue transformado a Data URL */}
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
                        <td className="px-4 py-2 text-sm">
                          {empresa.encargado || '—'}
                        </td>
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
          <Button
            onClick={toggleSidebar}
            className="w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors min-touch-target"
            iconName="Menu"
            iconSize={24}
          />
        </div>
      )}

      {/* 🔄 Contenido Principal: Aplicar margen adaptable */}
      <main className={`transition-all duration-300 ${mainMarginClass} pt-20 md:pt-16`}>
        <div className="p-6 space-y-6 container-main"> {/* Usar container-main para padding lateral */}
          {/* Header de la página */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestión de Empresas</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Administra el registro y información de empresas en la plataforma
              </p>
            </div>

            {/* Botón para volver a registrar si estamos editando */}
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

          {/* Tabs de Navegación */}
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
