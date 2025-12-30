import React, { useState, useEffect, useMemo } from 'react';
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

  // ESTADO PARA ORDENAMIENTO
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'asc' });

  // ESTADOS DEL SIDEBAR
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileScreen(isMobile);
      if (isMobile) setIsMobileOpen(false);
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
    if (isMobileScreen) setIsMobileOpen(false);
  };

  const fetchEmpresas = async () => {
    try {
      const response = await fetch('https://back-vercel-iota.vercel.app/api/auth/empresas/todas');
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
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  // LÓGICA DE ORDENAMIENTO
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedEmpresas = useMemo(() => {
    let sortableItems = [...empresas].filter(e => e.nombre !== "Todas");
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ? String(a[sortConfig.key]).toLowerCase() : '';
        const bValue = b[sortConfig.key] ? String(b[sortConfig.key]).toLowerCase() : '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [empresas, sortConfig]);

  const clearForm = () => {
    setFormData({
      nombre: '', rut: '', direccion: '', encargado: '', rut_encargado: '', logo: null, logoUrl: null
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
    try {
      const response = await fetch(`https://back-vercel-iota.vercel.app/api/auth/empresas/${empresaId}`);
      if (!response.ok) throw new Error('Error al cargar la empresa');
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
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveEmpresa = async (empresaId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta empresa?")) return;
    setIsLoading(true);
    try {
      const response = await fetch(`https://back-vercel-iota.vercel.app/api/auth/empresas/${empresaId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      alert('Empresa eliminada exitosamente');
      clearForm();
      fetchEmpresas();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterEmpresa = async () => {
    if (!formData.nombre || !formData.rut) {
      alert('Por favor completa los campos obligatorios: Nombre y RUT');
      return;
    }
    setIsLoading(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'logo' && formData[key] instanceof File) {
          submitData.append('logo', formData[key]);
        } else if (key !== 'logo' && key !== 'logoUrl') {
          submitData.append(key, formData[key] || '');
        }
      });

      const isUpdating = !!editingEmpresa;
      const url = isUpdating 
        ? `https://back-vercel-iota.vercel.app/api/auth/empresas/${editingEmpresa._id}` 
        : 'https://back-vercel-iota.vercel.app/api/auth/empresas/register';

      const response = await fetch(url, {
        method: isUpdating ? 'PUT' : 'POST',
        body: submitData,
      });

      if (!response.ok) throw new Error('Error en el servidor');
      alert(`Empresa ${isUpdating ? 'actualizada' : 'registrada'} exitosamente`);
      clearForm();
      fetchEmpresas();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <Icon name="ChevronsUpDown" size={14} className="ml-1 inline opacity-30" />;
    return sortConfig.direction === 'asc' 
      ? <Icon name="ChevronUp" size={14} className="ml-1 inline text-primary" />
      : <Icon name="ChevronDown" size={14} className="ml-1 inline text-primary" />;
  };

  const getTabContent = () => {
    if (activeTab === 'register') {
      return (
        <RegisterForm
          formData={formData}
          onUpdateFormData={(f, v) => setFormData(p => ({ ...p, [f]: v }))}
          onRegister={handleRegisterEmpresa}
          isLoading={isLoading}
          isEditing={!!editingEmpresa}
          onCancelEdit={clearForm}
        />
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Empresas Registradas</h3>
        {empresas.length <= 1 ? (
          <p className="text-muted-foreground">No hay empresas registradas.</p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="min-w-full">
              <thead className="bg-muted text-sm text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Logo</th>
                  <th className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted-foreground/10 transition-colors" onClick={() => requestSort('nombre')}>
                    Nombre {renderSortIcon('nombre')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted-foreground/10 transition-colors" onClick={() => requestSort('rut')}>
                    RUT {renderSortIcon('rut')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted-foreground/10 transition-colors" onClick={() => requestSort('direccion')}>
                    Dirección {renderSortIcon('direccion')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted-foreground/10 transition-colors" onClick={() => requestSort('encargado')}>
                    Encargado {renderSortIcon('encargado')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted-foreground/10 transition-colors" onClick={() => requestSort('createdAt')}>
                    Fecha {renderSortIcon('createdAt')}
                  </th>
                  <th className="px-4 py-3 text-center font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedEmpresas.map((empresa) => (
                  <tr key={empresa._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      {empresa.logo ? (
                        <img src={empresa.logo} alt="" className="w-10 h-10 object-contain rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <Icon name="Building2" size={16} className="text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{empresa.nombre}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{empresa.rut}</td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">{empresa.direccion || '—'}</td>
                    <td className="px-4 py-3 text-sm">{empresa.encargado || '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      {empresa.createdAt ? new Date(empresa.createdAt).toLocaleDateString('es-CL') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEmpresa(empresa._id)}
                          iconName="Edit"
                          className="h-8 px-2"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveEmpresa(empresa._id)}
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                        >
                          <Icon name="Trash2" size={14} />
                        </Button>
                      </div>
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

  const mainMarginClass = isMobileScreen ? 'ml-0' : isDesktopOpen ? 'ml-64' : 'ml-16';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {(isMobileOpen || !isMobileScreen) && (
        <Sidebar
          isCollapsed={!isDesktopOpen}
          onToggleCollapse={toggleSidebar}
          isMobileOpen={isMobileOpen}
          onNavigate={handleNavigation}
        />
      )}
      
      {isMobileScreen && isMobileOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40" onClick={toggleSidebar}></div>
      )}

      {/* BOTÓN FLOTANTE MÓVIL */}
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

      <main className={`transition-all duration-300 ${mainMarginClass} pt-20 md:pt-16 lg:pt-20`}>
        <div className="p-6 space-y-6 container-main">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestión de Empresas</h1>
              <p className="text-muted-foreground mt-1 text-sm">Administra la información de las empresas registradas.</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:flex">
                <Icon name={isDesktopOpen ? "PanelLeftClose" : "PanelLeftOpen"} />
              </Button>
              {editingEmpresa && (
                <Button variant="ghost" onClick={clearForm} iconName="Plus">Nueva Empresa</Button>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="flex gap-2 p-4 bg-muted/20 border-b border-border">
              <button
                onClick={() => setActiveTab('register')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'register' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon name="Plus" size={16} className="inline mr-2" />
                {editingEmpresa ? 'Modificar' : 'Registrar'}
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon name="List" size={16} className="inline mr-2" />
                Lista ({empresas.length})
              </button>
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