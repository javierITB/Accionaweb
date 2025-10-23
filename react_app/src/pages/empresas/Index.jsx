import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import RegisterForm from './components/RegisterForm';
import Icon from '../../components/AppIcon';

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
      alert('No se pudo cargar la lista de empresas');
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

      const result = await response.json();
      
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="ml-64 pt-16">
        <div className="p-6 space-y-6">
          {/* Header de la página */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gestión de Empresas</h1>
              <p className="text-muted-foreground mt-1">
                Administra el registro y información de empresas en la plataforma
              </p>
            </div>
          </div>

          {/* Tabs de Navegación */}
          <div className="bg-card border border-border rounded-lg">
            <div className="border-b border-border">
              <div className="flex space-x-1 p-4">
                <button
                  onClick={() => setActiveTab('register')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'register'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon name="Plus" size={16} className="inline mr-2" />
                  Registrar Empresa
                </button>
                <button
                  onClick={() => setActiveTab('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'list'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
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