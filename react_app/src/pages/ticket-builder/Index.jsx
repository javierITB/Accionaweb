import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { apiFetch, API_BASE_URL } from '../../utils/api';

const TicketBuilder = () => {

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
    if (isMobileScreen) setIsMobileOpen(!isMobileOpen);
    else setIsDesktopOpen(!isDesktopOpen);
  };

  const handleNavigation = () => {
    if (isMobileScreen) setIsMobileOpen(false);
  };

  const mainMarginClass = isMobileScreen ? 'ml-0' : isDesktopOpen ? 'ml-64' : 'ml-16';

  const [ticketData, setTicketData] = useState({
    subject: '',
    category: '',
    subcategory: '',
    priority: 'Media',
    description: '',
    files: [],
    assignedTo: '',
    estimatedCompletionAt: ''
  });

  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/auth/solicitud`);
      if (response.ok) {
        const data = await response.json();
        const uniqueUsersMap = new Map();

        data.forEach(item => {
          const uid = item.uid || item._id;
          const email = item.correo || item.mail || item.email;
          const key = uid || email;

          if (key && !uniqueUsersMap.has(key)) {
            uniqueUsersMap.set(key, {
              value: key,
              label: `${item.nombre} (${item.empresa || 'Sin empresa'})`,
              nombre: item.nombre
            });
          }
        });

        setUsers(Array.from(uniqueUsersMap.values()));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // Categorías
  const categories = [
    { value: 'sistema', label: 'Sistema' },
    { value: 'domicilio_virtual', label: 'Domicilio Virtual' }
  ];

  // Mapeo de subcategorías
  const subcategoriesMap = {
    sistema: [
      { value: 'error_acceso', label: 'Error de Inicio de Sesión' },
      { value: 'error_visualizacion', label: 'Problema de Visualización' },
      { value: 'error_guardado', label: 'Error al Guardar Datos' },
      { value: 'lentitud', label: 'Lentitud del Sistema' },
      { value: 'funcionalidad_rota', label: 'Funcionalidad No Responde' },
      { value: 'otro', label: 'Otro' }
    ],
    domicilio_virtual: [
      { value: 'anual', label: 'Domicilio Virtual Anual' },
      { value: 'semestral', label: 'Domicilio Virtual Semestral' },
      { value: 'constitucion', label: 'Constitucion De Empresa' }
    ]
  };

  const priorities = [
    { value: 'Baja', label: 'Baja' },
    { value: 'Media', label: 'Media' },
    { value: 'Alta', label: 'Alta' },
    { value: 'Critica', label: 'Crítica' }
  ];

  const handleInputChange = (field, value) => {
    setTicketData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'category') {
        newData.subcategory = '';
      }
      return newData;
    });
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      alert('Solo se permiten archivos PDF e imágenes (JPG, PNG, WEBP)');
      event.target.value = '';
      return;
    }

    if (ticketData.files.length + files.length > MAX_FILES) {
      alert(`Máximo ${MAX_FILES} archivos permitidos.`);
      event.target.value = '';
      return;
    }

    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      alert('Algunos archivos exceden el límite de 5MB');
      event.target.value = '';
      return;
    }

    setTicketData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }));
    event.target.value = '';
  };

  const removeFile = (index) => {
    setTicketData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const email = sessionStorage.getItem("email");
      if (!email) return;

      try {
        const res = await apiFetch(`${API_BASE_URL}/auth/full/${email}`);
        if (res.ok) {
          const userData = await res.json();
          setCurrentUser(userData);
          if (userData._id) sessionStorage.setItem("uid", userData._id);
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ticketData.subject || !ticketData.category || !ticketData.subcategory || !ticketData.description) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (confirm('¿Estás seguro de crear este ticket?')) {
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        const userEmail = sessionStorage.getItem("email");

        const userId = currentUser?._id || currentUser?.uid || sessionStorage.getItem("uid");
        const userName = currentUser?.nombre || sessionStorage.getItem("user");
        const userCompany = currentUser?.empresa || sessionStorage.getItem("company");

        if (!userId) {
          throw new Error("No se pudo identificar al usuario. Por favor recarga la página.");
        }

        // --- CAMPOS PARA TU API ---
        formData.append('formId', 'ticket_constructor');
        formData.append('formTitle', 'Constructor de Tickets');
        formData.append('mail', userEmail);

        if (ticketData.assignedTo) {
          const assignedUser = users.find(u => u.value === ticketData.assignedTo);
          if (assignedUser) {
            formData.append('assignedTo', assignedUser.nombre);
          }
        }

        if (ticketData.estimatedCompletionAt) {
          formData.append('estimatedCompletionAt', ticketData.estimatedCompletionAt);
        }

        formData.append('user', JSON.stringify({
          nombre: userName,
          email: userEmail,
          empresa: userCompany,
          uid: userId,
          token: sessionStorage.getItem("token")
        }));

        const categoryLabel = categories.find(c => c.value === ticketData.category)?.label;
        const subcategoryLabel = subcategoriesMap[ticketData.category]?.find(s => s.value === ticketData.subcategory)?.label;

        formData.append('responses', JSON.stringify({
          Asunto: ticketData.subject,
          Descripción: ticketData.description,
          Prioridad: ticketData.priority,
          Categoría: categoryLabel,
          Subcategoría: subcategoryLabel
        }));

        formData.append('category', ticketData.category);

        if (ticketData.files && ticketData.files.length > 0) {
          ticketData.files.forEach((file) => {
            formData.append('adjuntos', file);
          });
        }

        const res = await apiFetch(`${API_BASE_URL}/soporte/`, {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          alert('Ticket creado exitosamente');
          setTicketData({
            subject: '',
            category: '',
            subcategory: '',
            priority: 'Media',
            description: '',
            files: [],
            assignedTo: '',
            estimatedCompletionAt: ''
          });
        } else {
          const err = await res.json();
          throw new Error(err.message || err.error || 'Error al crear ticket');
        }

      } catch (error) {
        console.error(error);
        alert('Ocurrió un error al crear el ticket: ' + error.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
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
            <div className="fixed inset-0 bg-black/50 z-40" onClick={toggleSidebar}></div>
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
            className="w-12 h-12 rounded-full shadow-lg"
          />
        </div>
      )}

      <main className={`transition-all duration-300 ${mainMarginClass} pt-20 px-6 pb-10`}>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Constructor de Tickets</h1>
            <p className="text-muted-foreground mt-1">
              Crea y gestiona tickets de soporte administrativo con herramientas avanzadas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Icon name="FileText" className="mr-2 text-primary" size={20} />
                Detalles del Ticket
              </h2>

              <div className="space-y-4">
                <Input
                  label="Asunto"
                  placeholder="Ej: Falla al subir archivos adjuntos en Respuestas"
                  value={ticketData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  required
                />

                <Select
                  label="Asignar Ticket a"
                  name="assignedTo"
                  value={ticketData.assignedTo}
                  onChange={(val) => handleInputChange('assignedTo', val)}
                  disabled={isSubmitting || isLoadingUsers}
                  placeholder="Selecciona a quién asignar"
                  options={[{ value: '', label: 'Sin Asignar' }, ...users]}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Categoría"
                    options={categories}
                    value={ticketData.category}
                    onChange={(val) => handleInputChange('category', val)}
                    placeholder="Selecciona una categoría"
                  />
                  <Select
                    label="Subcategoría"
                    options={ticketData.category ? subcategoriesMap[ticketData.category] : []}
                    value={ticketData.subcategory}
                    onChange={(val) => handleInputChange('subcategory', val)}
                    placeholder="Selecciona subcategoría"
                    disabled={!ticketData.category}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Prioridad"
                    name="priority"
                    value={ticketData.priority}
                    onChange={(val) => handleInputChange('priority', val)}
                    options={priorities}
                    disabled={isSubmitting}
                  />
                  <Input
                    type="date"
                    label="Fecha Estimada"
                    value={ticketData.estimatedCompletionAt}
                    onChange={(e) => handleInputChange('estimatedCompletionAt', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Descripción Detallada</label>
                  <textarea
                    className="w-full min-h-[150px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Describe el problema con el mayor detalle posible..."
                    value={ticketData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Icon name="Paperclip" className="mr-2 text-primary" size={20} />
                Adjuntos
              </h2>

              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/30 transition cursor-pointer"
                onClick={() => fileInputRef.current?.click()}>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,image/*"
                />
                <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
                  <Icon name="Upload" size={24} />
                </div>
                <p className="font-medium">Haz clic para subir archivos</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG (Máx 5MB)</p>
              </div>

              {ticketData.files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {ticketData.files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-md group">
                      <div className="flex items-center overflow-hidden">
                        <Icon name="File" className="text-muted-foreground mr-3 flex-shrink-0" size={18} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(idx)}
                        className="text-muted-foreground hover:text-red-500 transition p-1"
                      >
                        <Icon name="X" size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-24">
              <h3 className="font-semibold text-lg mb-4">Acciones</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Revisa los detalles antes de enviar.
              </p>

              <Button
                className="w-full mb-3"
                size="lg"
                onClick={handleSubmit}
                loading={isSubmitting}
                iconName="Send"
                iconPosition="right"
              >
                Crear Ticket
              </Button>
            </div>
          </div>
        </div>
      </main >
    </div >
  );
};

export default TicketBuilder;