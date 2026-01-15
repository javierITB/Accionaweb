import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import RegisterForm from './components/RegisterForm';
import Icon from '../../components/AppIcon';
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
  const [activeTab, setActiveTab] = useState('register');

  // ESTADOS PARA FILTROS Y BÚSQUEDA
  const [filters, setFilters] = useState({ field: null, value: null });
  const [searchTerm, setSearchTerm] = useState('');

  // ESTADO PARA ORDENAMIENTO
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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
    if (isMobileScreen) setIsMobileOpen(false);
  };

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        setLoadingEmpresas(true);
        const response = await apiFetch(`${API_BASE_URL}/auth/empresas/todas`);
        if (!response.ok) throw new Error('Error al cargar empresas');
        const empresasData = await response.json();
        setEmpresas(empresasData.map(e => ({ value: e.nombre, label: e.nombre })));
      } catch (error) {
        console.error('Error cargando empresas:', error);
      } finally {
        setLoadingEmpresas(false);
      }
    };
    fetchEmpresas();
    fetchUsers();
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
      const res = await apiFetch(`${API_BASE_URL}/auth/`);
      if (!res.ok) throw new Error('Usuarios no encontrados');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Error cargando los usuarios:', err);
    }
  };


  const handleFilter = (field, value) => {
    if (filters.field === field && filters.value === value) {
      setFilters({ field: null, value: null });
    } else {
      setFilters({ field, value });
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <Icon name="ChevronsUpDown" size={14} className="ml-1 opacity-30" />;
    return sortConfig.direction === 'asc'
      ? <Icon name="ChevronUp" size={14} className="ml-1 text-primary" />
      : <Icon name="ChevronDown" size={14} className="ml-1 text-primary" />;
  };

  const sortedUsers = useMemo(() => {
    let processData = [...users];

    // 1. Filtro por celda
    if (filters.field && filters.value) {
      processData = processData.filter(user =>
        String(user[filters.field]).toLowerCase() === String(filters.value).toLowerCase()
      );
    }

    // 2. Buscador Dinámico Global
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      processData = processData.filter(u =>
        Object.values(u).some(val => String(val).toLowerCase().includes(term)) ||
        `${u.nombre} ${u.apellido}`.toLowerCase().includes(term)
      );
    }

    // 3. Ordenamiento
    if (sortConfig.key) {
      processData.sort((a, b) => {
        const key = sortConfig.key;
        let vA = key === 'nombre' ? `${a.nombre} ${a.apellido}` : a[key];
        let vB = key === 'nombre' ? `${b.nombre} ${b.apellido}` : b[key];
        vA = String(vA || '').toLowerCase();
        vB = String(vB || '').toLowerCase();
        if (vA < vB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (vA > vB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return processData;
  }, [users, filters, sortConfig, searchTerm]);


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
      ? `${API_BASE_URL}/auth/users/${editingUser._id}`
      : `${API_BASE_URL}/auth/register`;

    try {
      setIsLoading(true);
      const response = await apiFetch(url, {
        method: method,
        body: JSON.stringify(isUpdating ? { ...formData, estado: formData.estado } : { ...formData, pass: "", estado: "pendiente" }),
      });

      if (!response.ok) throw new Error('Error en la operación');

      if (!isUpdating) {
        const saved = await response.json();
        const savedUser = saved?.userId;
        await apiFetch(`${API_BASE_URL}/mail/send`, {
          method: 'POST',
          body: JSON.stringify({
            accessKey: "wBlL283JH9TqdEJRxon1QOBuI0A6jGVEwpUYchnyMGz",
            to: [formData.mail],
            subject: "Completa tu registro",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3B82F6;">¡Bienvenido a la plataforma!</h2>
              <p>Hola <strong>${formData.nombre} ${formData.apellido}</strong>,</p>
              <p>Has sido registrado en nuestra plataforma. Para completar tu registro y establecer tu contraseña, haz clic en el siguiente botón:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://infodesa.vercel.app/set-password?userId=${savedUser}" 
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

  const clearForm = () => {
    setFormData({ nombre: '', apellido: '', mail: '', empresa: '', cargo: '', rol: 'user' });
    setEditingUser(null);
  };

  const handleRemoveUser = async (userId) => {
    if (!window.confirm("¿Estás seguro?")) return;
    try {
      setIsLoading(true);
      const response = await apiFetch(`${API_BASE_URL}/auth/users/${userId}`, { method: 'DELETE' });
      if (response.ok) fetchUsers();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTabContent = () => {
    if (activeTab === 'register') {
      return (
        <RegisterForm
          formData={formData}
          empresas={empresas}
          cargos={cargos}
          roles={roles}
          onUpdateFormData={(f, v) => setFormData(p => ({ ...p, [f]: v }))}
          onRegister={async () => { /* lógica handleSave */ }}
          isLoading={isLoading}
          isEditing={!!editingUser}
          onCancelEdit={clearForm}
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">Usuarios registrados</h2>
            {filters.field && (
              <button onClick={() => setFilters({ field: null, value: null })} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                Filtro: {filters.field} ✕
              </button>
            )}
          </div>

          {/* BUSCADOR INTEGRADO CON MODO OSCURO */}
          <div className="relative w-full md:w-80">
            {/* Icono de Lupa */}
            <Icon
              name="Search"
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500"
            />

            <input
              type="text"
              placeholder="Búsqueda rápida..."
              className="w-full pl-10 pr-10 py-2.5 
               bg-white border-gray-200 text-gray-900 placeholder:text-white-400
                dark:border-zinc-700  dark:placeholder:text-zinc-500 
               border rounded-xl text-sm 
               focus:ring-2 focus:ring-primary/20 focus:border-primary 
               dark:focus:ring-primary/40 dark:focus:border-primary/60
               outline-none transition-all shadow-sm dark:shadow-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Botón para limpiar (X) */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 
                 text-gray-400 dark:text-zinc-500 
                 hover:text-gray-600 dark:hover:text-zinc-200 
                 transition-colors"
              >
                <Icon name="X" size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {['nombre', 'empresa', 'mail', 'cargo', 'rol', 'estado', 'createdAt'].map(key => (
                  <th key={key} className="px-4 py-3 text-left cursor-pointer hover:bg-muted transition" onClick={() => handleSort(key)}>
                    <div className="flex items-center">{key.replace('_id', 'ID')} {getSortIcon(key)}</div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card text-sm">
              {sortedUsers.map((u) => (
                <tr key={u._id} className="hover:bg-muted/20 transition">
                  <td className="px-4 py-3 font-medium cursor-pointer hover:text-primary" onClick={() => handleFilter('nombre', u.nombre)}>{u.nombre} {u.apellido}</td>
                  <td className="px-4 py-3 cursor-pointer hover:text-primary" onClick={() => handleFilter('empresa', u.empresa)}>{u.empresa || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.mail}</td>
                  <td className="px-4 py-3 cursor-pointer hover:text-primary" onClick={() => handleFilter('cargo', u.cargo)}>{u.cargo || '—'}</td>
                  <td className="px-4 py-3 cursor-pointer hover:text-primary" onClick={() => handleFilter('rol', u.rol)}>{u.rol}</td>
                  <td className="px-4 py-3">
                    <span onClick={() => handleFilter('estado', u.estado)} className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md cursor-pointer ${u.estado === 'pendiente' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                      {u.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => { handleEditUser(u); setActiveTab('register'); }} className="text-primary hover:underline">Editar</button>
                      <button onClick={() => handleRemoveUser(u._id)} className="text-destructive hover:underline">Borrar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const mainMarginClass = isMobileScreen ? 'ml-0' : isDesktopOpen ? 'ml-64' : 'ml-16';

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />
      <Sidebar isCollapsed={!isDesktopOpen} onToggleCollapse={toggleSidebar} isMobileOpen={isMobileOpen} onNavigate={handleNavigation} />

      <main className={`transition-all duration-300 ${mainMarginClass} pt-20`}>
        <div className="p-6 space-y-6 container-main">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
            <Button variant="ghost" size="icon" onClick={toggleSidebar} iconName={isDesktopOpen ? "PanelLeftClose" : "PanelLeftOpen"} className="hidden md:flex" />
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="flex gap-2 p-4 bg-muted/20 border-b border-border">
              <button onClick={() => setActiveTab('register')} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'register' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                <Icon name="Plus" size={16} className="inline mr-2" /> {editingUser ? 'Modificar' : 'Registrar'}
              </button>
              <button onClick={() => setActiveTab('list')} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                <Icon name="List" size={16} className="inline mr-2" /> Lista ({users.length})
              </button>
            </div>
            <div className="p-6">{getTabContent()}</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FormReg;