import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import RegisterForm from './components/RegisterForm';
import Button from '../../components/ui/Button';

const FormReg = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    mail: '',
    empresa: '',
    cargo: '',
    rol: 'user'
  });
  const [activeTab, setActiveTab] = useState('properties');

  // ESTADO PARA FILTROS
  const [filters, setFilters] = useState({
    field: null,
    value: null
  });

  // ESTADOS DEL SIDEBAR
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

  const [editingUser, setEditingUser] = useState(null);

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
    if (isMobileScreen) {
      setIsMobileOpen(false);
    }
  };

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        setLoadingEmpresas(true);
        const response = await fetch('https://back-acciona.vercel.app/api/auth/empresas/todas');
        if (!response.ok) throw new Error('Error al cargar empresas');
        const empresasData = await response.json();
        const empresasOptions = empresasData.map(empresa => ({
          value: empresa.nombre,
          label: empresa.nombre
        }));
        setEmpresas(empresasOptions);
      } catch (error) {
        console.error('Error cargando empresas:', error);
        setEmpresas([
          { value: 'Acciona', label: 'Acciona' },
          { value: 'Empresa Ejemplo 1', label: 'Empresa Ejemplo 1' },
          { value: 'Empresa Ejemplo 2', label: 'Empresa Ejemplo 2' },
        ]);
      } finally {
        setLoadingEmpresas(false);
      }
    };
    fetchEmpresas();
  }, []);

  const cargos = [
    { value: 'admin', label: 'Administrador' },
    { value: 'RRHH', label: 'Recursos Humanos' },
    { value: 'Cliente', label: 'Cliente' },
  ];

  const roles = [
    { value: 'Admin', label: 'Administrador' },
    { value: 'user', label: 'Cliente' },
  ];

  const fetchUsers = async () => {
    try {
      const res = await fetch(`https://back-acciona.vercel.app/api/auth/`);
      if (!res.ok) throw new Error('Usuarios no encontrados');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Error cargando los usuarios:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // LOGICA DE FILTRADO
  const handleFilter = (field, value) => {
    if (filters.field === field && filters.value === value) {
      setFilters({ field: null, value: null });
    } else {
      setFilters({ field, value });
    }
  };

  const filteredUsers = useMemo(() => {
    if (!filters.field || !filters.value) return users;
    return users.filter(user => 
      String(user[filters.field]).toLowerCase() === String(filters.value).toLowerCase()
    );
  }, [users, filters]);

  const clearForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      mail: '',
      empresa: '',
      cargo: '',
      rol: 'user',
    });
    setEditingUser(null);
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const isUpdating = !!editingUser;
    if (!formData.nombre || !formData.apellido || !formData.mail || !formData.empresa || !formData.cargo || !formData.rol) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const method = isUpdating ? 'PUT' : 'POST';
    const url = isUpdating
      ? `https://back-acciona.vercel.app/api/auth/users/${editingUser._id}`
      : 'https://back-acciona.vercel.app/api/auth/register';

    try {
      setIsLoading(true);
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isUpdating ? { ...formData, estado: formData.estado } : { ...formData, pass: "", estado: "pendiente" }),
      });

      if (!response.ok) throw new Error('Error en la operación');

      if (!isUpdating) {
        const saved = await response.json();
        const savedUser = saved?.user;
        await fetch('https://back-acciona.vercel.app/api/mail/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessKey: "wBlL283JH9TqdEJRxon1QOBuI0A6jGVEwpUYchnyMGz",
            to: [formData.mail],
            subject: "Completa tu registro",
            html: `<h2>Bienvenido ${formData.nombre}</h2><p>Tu cuenta ha sido creada.</p>`
          }),
        });
        alert('Usuario registrado y correo enviado.');
      } else {
        alert('Usuario actualizado exitosamente.');
      }
      clearForm();
      await fetchUsers();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      mail: user.mail || '',
      empresa: user.empresa || '',
      cargo: user.cargo || '',
      rol: user.rol || 'user',
      estado: user.estado || 'pendiente'
    });
  };

  const handleRemoveUser = async (userId) => {
    if (!window.confirm("¿Estás seguro?")) return;
    setIsLoading(true);
    try {
      const response = await fetch(`https://back-acciona.vercel.app/api/auth/users/${userId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      alert('Usuario eliminado');
      fetchUsers();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTabContent = () => (
    <RegisterForm
      formData={formData}
      empresas={empresas}
      cargos={cargos}
      roles={roles}
      onUpdateFormData={updateFormData}
      onRegister={handleSave}
      isLoading={isLoading}
      isEditing={!!editingUser}
      onCancelEdit={clearForm}
    />
  );

  const mainMarginClass = isMobileScreen ? 'ml-0' : isDesktopOpen ? 'ml-64' : 'ml-16';

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
            <div className="fixed inset-0 bg-foreground/50 z-40" onClick={toggleSidebar}></div>
          )}
        </>
      )}

      <main className={`transition-all duration-300 ${mainMarginClass} pt-16`}>
        <div className="p-6 space-y-6 container-main">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
              <p className="text-muted-foreground">Administra los usuarios. Haz clic en los datos de la tabla para filtrar.</p>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                iconName={isDesktopOpen ? "PanelLeftClose" : "PanelLeftOpen"}
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            {getTabContent()}
          </div>

          <div className="bg-card border border-border rounded-lg mt-8 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Usuarios registrados {filters.field && `(Filtrado por ${filters.field})`}</h2>
              {filters.field && (
                <button 
                  onClick={() => setFilters({ field: null, value: null })}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {users.length === 0 ? (
              <p className="text-muted-foreground">No hay usuarios registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-border rounded-lg">
                  <thead className="bg-muted text-sm text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Nombre</th>
                      <th className="px-4 py-2 text-left">Empresa</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Cargo</th>
                      <th className="px-4 py-2 text-left">Rol</th>
                      <th className="px-4 py-2 text-left">Estado</th>
                      <th className="px-4 py-2 text-left">Creado</th>
                      <th className="px-4 py-2 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredUsers.map((u) => (
                      <tr key={u._id} className="border-t hover:bg-muted/30 transition">
                        <td className="px-4 py-2 text-xs font-mono text-muted-foreground">{u._id}</td>
                        <td 
                          className="px-4 py-2 cursor-pointer hover:text-blue-500"
                          onClick={() => handleFilter('nombre', u.nombre)}
                        >
                          {u.nombre} {u.apellido}
                        </td>
                        <td 
                          className="px-4 py-2 cursor-pointer hover:text-blue-500 font-medium"
                          onClick={() => handleFilter('empresa', u.empresa)}
                        >
                          {u.empresa || '—'}
                        </td>
                        <td className="px-4 py-2">{u.mail}</td>
                        <td 
                          className="px-4 py-2 cursor-pointer hover:text-blue-500"
                          onClick={() => handleFilter('cargo', u.cargo)}
                        >
                          {u.cargo || '—'}
                        </td>
                        <td 
                          className="px-4 py-2 cursor-pointer hover:text-blue-500"
                          onClick={() => handleFilter('rol', u.rol)}
                        >
                          {u.rol || '—'}
                        </td>
                        <td className="px-4 py-2">
                          <span 
                            onClick={() => handleFilter('estado', u.estado)}
                            className={`px-2 py-1 text-xs rounded-full cursor-pointer ${
                              u.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 
                              u.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {u.estado}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button onClick={() => handleEditUser(u)} className="text-blue-600 hover:text-blue-800">Editar</button>
                            <button onClick={() => handleRemoveUser(u._id)} className="text-red-600 hover:text-red-800">Borrar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">No hay resultados para este filtro.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FormReg;