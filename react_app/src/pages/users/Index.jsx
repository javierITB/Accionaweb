import React, { useState, useEffect } from 'react';
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
    rol: 'Cliente'
  });
  const [activeTab, setActiveTab] = useState('properties');

  // ESTADOS DEL SIDEBAR - ACTUALIZADOS
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

  const [editingUser, setEditingUser] = useState(null);

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

  // Cargar empresas desde MongoDB
  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        setLoadingEmpresas(true);
        const response = await fetch('https://accionaapi.vercel.app/api/auth/empresas/todas');

        if (!response.ok) {
          throw new Error('Error al cargar empresas');
        }

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
    { value: 'admin', label: 'Administrador' },
    { value: 'user', label: 'Cliente' },
  ];

  const fetchUsers = async () => {
    try {
      const res = await fetch(`https://accionaapi.vercel.app/api/auth/`);
      if (!res.ok) throw new Error('Usuarios no encontrados');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Error cargando los usuarios:', err);
      console.error('No se pudo cargar la lista de usuarios');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const clearForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      mail: '',
      empresa: '',
      cargo: '',
      rol: 'Cliente',
    });
    setEditingUser(null);
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    const isUpdating = !!editingUser;

    if (!formData.nombre || !formData.apellido || !formData.mail || !formData.empresa || !formData.cargo || !formData.rol) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }
    if (!formData.mail.includes('@')) {
      alert('Por favor ingresa un email válido');
      return;
    }

    const method = isUpdating ? 'PUT' : 'POST';
    const url = isUpdating
      ? `https://accionaapi.vercel.app/api/auth/users/${editingUser._id}`
      : 'https://accionaapi.vercel.app/api/auth/register';

    let bodyData = {
      ...formData,
    };

    if (isUpdating) {
      bodyData = {
        ...formData,
        estado: formData.estado,
      };
    } else {
      bodyData.pass = "";
      bodyData.estado = "pendiente";
    }

    try {
      setIsLoading(true);

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error al ${isUpdating ? 'actualizar' : 'guardar'} el usuario`);
      }

      const saved = await response.json();

      if (!isUpdating) {
        const savedUser = saved?.user;

        const mailResponse = await fetch('https://accionaapi.vercel.app/api/mail/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessKey: "MI_CLAVE_SECRETA_AQUI",
            to: [formData.mail],
            subject: "Completa tu registro en la plataforma",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3B82F6;">¡Bienvenido a la plataforma!</h2>
              <p>Hola <strong>${formData.nombre} ${formData.apellido}</strong>,</p>
              <p>Has sido registrado en nuestra plataforma. Para completar tu registro y establecer tu contraseña, haz clic en el siguiente botón:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://infoacciona.vercel.app/set-password?userId=${savedUser?.id || savedUser?._id}" 
                   style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Establecer Contraseña
                </a>
              </div>
              <p><strong>Datos de tu cuenta:</strong></p>
              <ul>
                <li><strong>Empresa:</strong> ${formData.empresa}</li>
                <li><strong>Cargo:</strong> ${formData.cargo}</li>
              </ul>
              <p style="color: #666; font-size: 12px;">Si no solicitaste este registro, por favor ignora este correo.</p>
            </div>
          `
          }),
      });

      if (!mailResponse.ok) {
        throw new Error('Error al enviar el correo');
      }
      alert('Usuario registrado exitosamente. Se ha enviado un correo para establecer la contraseña.');
    } else {
      alert('Usuario actualizado exitosamente.');
    }

    clearForm();
    await fetchUsers();

  } catch (error) {
    console.error(`Error en la ${isUpdating ? 'edición' : 'registro'}:`, error);
    alert(`Error al ${isUpdating ? 'actualizar' : 'registrar'} el usuario: ` + error.message);
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
    rol: user.rol || 'Cliente',
    estado: user.estado || 'pendiente'
  });
};

const getTabContent = () => {
  switch (activeTab) {
    case 'properties':
      return (
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
    <main className={`transition-all duration-300 ${mainMarginClass} pt-16`}>
      <div className="p-6 space-y-6 container-main">
        {/* HEADER CON BOTÓN DE TOGGLE - AGREGADO */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
              Administra y gestiona los usuarios del sistema
            </p>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              iconName={isDesktopOpen ? "PanelLeftClose" : "PanelLeftOpen"}
              iconSize={20}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg">
          <div className="p-6">{getTabContent()}</div>
        </div>

        <div className="bg-card border border-border rounded-lg mt-8 p-6">
          <h2 className="text-xl font-semibold mb-4">Usuarios registrados</h2>

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
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-muted/30 transition">
                      <td className="px-4 py-2 text-xs">{u._id}</td>
                      <td className="px-4 py-2 text-sm">{u.nombre || '—'}</td>
                      <td className="px-4 py-2 text-sm">{u.empresa || '—'}</td>
                      <td className="px-4 py-2 text-sm">{u.mail || '—'}</td>
                      <td className="px-4 py-2 text-sm">{u.cargo || '—'}</td>
                      <td className="px-4 py-2 text-sm">{u.rol || '—'}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${u.estado === 'pendiente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : u.estado === 'activo'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}>
                          {u.estado === 'pendiente' ? 'Pendiente' :
                            u.estado === 'activo' ? 'Activo' :
                              'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(u)}
                          iconName="Edit"
                          iconSize={16}
                          className="text-primary hover:bg-primary/10"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(u)}
                          iconName="X"
                          iconSize={16}
                          className="text-error hover:bg-primary/10"
                        >
                          Borrar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  </div>
);
};

export default FormReg;