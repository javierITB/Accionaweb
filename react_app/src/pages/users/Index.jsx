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

  // ESTADOS AÑADIDOS PARA LA ADAPTABILIDAD
  const [isDesktopOpen, setIsDesktopOpen] = useState(true); // Controla el colapso en Desktop
  const [isMobileOpen, setIsMobileOpen] = useState(false); // Controla la apertura total en Mobile
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

  const [editingUser, setEditingUser] = useState(null);

  // FUNCIÓN AÑADIDA: Toggle Unificado para Desktop y Móvil
  const toggleSidebar = () => {
    if (isMobileScreen) {
      // En móvil, alternar el estado de apertura/cierre
      setIsMobileOpen(!isMobileOpen);
    } else {
      // En desktop, alternar el estado de abierto/colapsado
      setIsDesktopOpen(!isDesktopOpen);
    }
  };

  // FUNCIÓN AÑADIDA: Lógica de navegación para cerrar el Sidebar en móvil
  const handleNavigation = () => {
    if (isMobileScreen) {
      setIsMobileOpen(false); // Cierra el sidebar al navegar
    }
  };

  // EFECTO AÑADIDO: Manejo de Redimensionamiento
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
        // Fallback con empresas de ejemplo
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

  useEffect(() => { // Reemplaza el useEffect anterior de carga de usuarios
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
      // Estado no se incluye aquí ya que se maneja en edición, no en registro
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

    // 1. Validaciones básicas
    if (!formData.nombre || !formData.apellido || !formData.mail || !formData.empresa || !formData.cargo || !formData.rol) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }
    if (!formData.mail.includes('@')) {
      alert('Por favor ingresa un email válido');
      return;
    }

    // 2. Definir URL y Método
    const method = isUpdating ? 'PUT' : 'POST';
    const url = isUpdating
      ? `https://accionaapi.vercel.app/api/auth/users/${editingUser._id}` // URL para Actualizar (PUT)
      : 'https://accionaapi.vercel.app/api/auth/register'; // URL para Registrar (POST)

    // 3. Preparar el cuerpo del request
    let bodyData = {
      ...formData,
    };

    if (isUpdating) {
      // Si estamos actualizando, necesitamos el estado del usuario.
      // La contraseña (pass) NO se envía en la edición estándar.
      bodyData = {
        ...formData,
        estado: formData.estado,
      };
    } else {
      // Si estamos registrando, añadimos los campos iniciales de registro.
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

      // Si es registro, maneja el envío de correo. Si es edición, no.
      if (!isUpdating) {
        const savedUser = saved?.user;

        const mailResponse = await fetch('https://accionaapi.vercel.app/api/mail/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessKey: "MI_CLAVE_SECRETA_AQUI",
            to: [formData.mail],
            subject: "Completa tu registro en la plataforma",
            html: `... [TU CÓDIGO HTML COMPLETO AQUÍ] ...`
          }),
        });

        if (!mailResponse.ok) {
          throw new Error('Error al enviar el correo');
        }
        alert('Usuario registrado exitosamente. Se ha enviado un correo para establecer la contraseña.');
      } else {
        alert('Usuario actualizado exitosamente.');
      }

      // Limpiar formulario y actualizar tabla
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
    // 1. Establecer el usuario que se está editando
    setEditingUser(user);

    // 2. Llenar el formData con los datos del usuario, incluyendo el estado
    setFormData({
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      mail: user.mail || '',
      empresa: user.empresa || '',
      cargo: user.cargo || '',
      rol: user.rol || 'Cliente',
      estado: user.estado || 'pendiente' // Añadimos 'estado' aquí para edición
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
            onRegister={handleSave} // Cambiar a handleSave
            isLoading={isLoading} // Nuevo
            isEditing={!!editingUser} // Nuevo
            onCancelEdit={clearForm} // Nuevo
          />
        );
      default:
        return null;
    }
  };

  // CLASE DE MARGEN: Definir el margen para <main>
  const mainMarginClass = isMobileScreen
    ? 'ml-0'
    : isDesktopOpen ? 'ml-64' : 'ml-16';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Sidebar: Renderiza si está abierto en desktop O si está abierto en móvil */}
      {(isDesktopOpen || isMobileOpen) && (
        <>
          <Sidebar
            isCollapsed={isMobileScreen ? false : !isDesktopOpen}
            onToggleCollapse={toggleSidebar}
            isMobileOpen={isMobileOpen}
            onNavigate={handleNavigation}
          />

          {/* Overlay semi-transparente en móvil cuando el sidebar está abierto */}
          {isMobileScreen && isMobileOpen && (
            <div
              className="fixed inset-0 bg-foreground/50 z-40"
              onClick={toggleSidebar} // Cierra el sidebar al hacer clic en el overlay
            ></div>
          )}
        </>
      )}

      {/* Botón Flotante para Abrir el Sidebar (Visible solo en móvil cuando está cerrado) */}
      {!isMobileOpen && isMobileScreen && (
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={toggleSidebar}
            className="w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors min-touch-target"
          >
            {/* Ícono de menú */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
          </button>
        </div>
      )}

      {/* Contenido Principal: Aplicar margen adaptable */}
      <main className={`transition-all duration-300 ${mainMarginClass} pt-16`}>
        <div className="p-6 space-y-6 container-main"> {/* Usar container-main para padding lateral */}
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
                            onClick={() => handleEditUser(u)} // <-- Llama a la nueva función
                            iconName="Edit"
                            iconSize={16}
                            className="text-primary hover:bg-primary/10"
                          >
                            Editar
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
