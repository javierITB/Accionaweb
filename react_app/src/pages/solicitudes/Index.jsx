import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

// Definimos la URL base (ajusta esto si la variable viene de un archivo de configuración)
const IP_API = "https://back-acciona.vercel.app"; // O la URL que estés usando

// --- Componentes UI reutilizados ---
const Input = React.forwardRef((props, ref) => (
  <input
    ref={ref}
    {...props}
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  />
));

const Textarea = React.forwardRef(({ className = '', ...props }, ref) => (
  <textarea
    ref={ref}
    {...props}
    className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y ${className}`}
  />
));

// --- Componente Select Personalizado para mantener estilo ---
const Select = React.forwardRef(({ children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      {...props}
      className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </select>
    <Icon 
      name="ChevronDown" 
      size={16} 
      className="absolute right-3 top-3 text-muted-foreground pointer-events-none" 
    />
  </div>
));

// --- Componente Principal ---
const MessageForm = () => {
  // 1. Estados del Formulario
  const [formData, setFormData] = useState({
    destino: '', // Aquí guardaremos el ID o valor seleccionado
    asunto: '',
    mensaje: '',
  });
  
  const [recipients, setRecipients] = useState([]); // Lista de destinatarios
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // 2. Estados de Layout
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

  // 3. Efecto para manejo de pantalla
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

  // 4. FETCH DE DESTINATARIOS
  useEffect(() => {
    const fetchRecipients = async () => {
      setIsLoadingRecipients(true);
      try {
        const response = await fetch(`${IP_API}/api/auth/solicitud`);
        
        if (!response.ok) {
          throw new Error('Error al obtener solicitudes');
        }
        
        const data = await response.json();
        
        // NOTA: Como el endpoint es /solicitudes, es probable que traiga un array de objetos
        // donde cada objeto tiene info del usuario. Haremos un map para extraer usuarios únicos.
        // Asumimos que data es un array. Ajusta los campos 'solicitante', 'nombre', 'email' según tu JSON real.
        
        const uniqueUsersMap = new Map();

        data.forEach(item => {
          // Intentamos obtener un identificador único y un nombre legible
          // Ajusta 'item.nombre' o 'item.usuario.nombre' según tu estructura real
          const userId = item.correo; 
          const userEmpresa = item.empresa || "";
          const userName = item.nombre + " " + (item.apellido || "");
          const userEmail = item.correo || "";

          // Usamos el ID como clave para evitar duplicados
          if (!uniqueUsersMap.has(userId)) {
            uniqueUsersMap.set(userId, {
              id: userId,
              label: userEmail ? ` ${userName} (${userEmpresa})` : userName,
              value: userId // O el email si prefieres enviar al email
            });
          }
        });

        setRecipients(Array.from(uniqueUsersMap.values()));

      } catch (error) {
        console.error("Error cargando destinatarios:", error);
        // Opcional: Manejar error visualmente
      } finally {
        setIsLoadingRecipients(false);
      }
    };

    fetchRecipients();
  }, []);

  // 5. Funciones de Layout
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

  // 6. Lógica del Formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.destino || !formData.asunto) {
      alert("Por favor selecciona un destinatario e ingresa un asunto.");
      return;
    }

    setIsLoading(true);
    try {
        console.log("Enviando datos:", formData);
        console.log("Archivos:", files);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        alert("Mensaje enviado con éxito");
        
        setFormData({ destino: '', asunto: '', mensaje: '' });
        setFiles([]);
        if(fileInputRef.current) fileInputRef.current.value = "";

    } catch (error) {
        console.error(error);
        alert("Error al enviar el mensaje");
    } finally {
        setIsLoading(false);
    }
  };

  const mainMarginClass = isMobileScreen ? 'ml-0' : isDesktopOpen ? 'ml-64' : 'ml-16';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* SIDEBAR */}
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

      {/* BOTÓN MÓVIL */}
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

      {/* CONTENIDO PRINCIPAL */}
      <main className={`transition-all duration-300 ${mainMarginClass} pt-20 md:pt-16`}>
        <div className="p-6 space-y-6 container-main max-w-4xl mx-auto">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Nuevo Mensaje</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Redacta y envía notificaciones a usuarios registrados.
              </p>
            </div>
             <div className="hidden md:flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  iconName={isDesktopOpen ? "PanelLeftClose" : "PanelLeftOpen"}
                  iconSize={20}
                />
              </div>
          </div>

          {/* Formulario */}
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* CAMPO: DESTINATARIO (SELECT) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Destinatario</label>
                  <Select
                    name="destino"
                    value={formData.destino}
                    onChange={handleInputChange}
                    disabled={isLoadingRecipients}
                    required
                  >
                    <option value="">
                        {isLoadingRecipients ? "Cargando usuarios..." : "Selecciona un destinatario"}
                    </option>
                    
                    {!isLoadingRecipients && recipients.map((user) => (
                        <option key={user._id} value={user.value}>
                            {user.label}
                        </option>
                    ))}
                  </Select>
                  {recipients.length === 0 && !isLoadingRecipients && (
                      <p className="text-xs text-red-500">No se encontraron usuarios en las solicitudes.</p>
                  )}
                </div>

                {/* Campo: Asunto */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Asunto</label>
                  <Input
                    name="asunto"
                    value={formData.asunto}
                    onChange={handleInputChange}
                    placeholder="Escribe el asunto del mensaje"
                    required
                  />
                </div>

                {/* Campo: Mensaje */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mensaje</label>
                  <Textarea
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleInputChange}
                    placeholder="Escribe tu mensaje aquí..."
                    rows={6}
                  />
                </div>

                {/* Campo: Carga de Archivos */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Adjuntar Archivos</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 hover:bg-muted/50 transition-colors text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Icon name="UploadCloud" size={32} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">Haz clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, JPG (Max 10MB)</p>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md border border-border">
                          <div className="flex items-center space-x-2 overflow-hidden">
                            <Icon name="File" size={16} className="text-primary flex-shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 text-muted-foreground hover:text-red-500"
                          >
                            <Icon name="X" size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer del Formulario */}
                <div className="pt-4 border-t border-border flex justify-end space-x-3">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                            setFormData({ destino: '', asunto: '', mensaje: '' });
                            setFiles([]);
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        variant="default"
                        disabled={isLoading}
                        className="bg-primary text-white"
                    >
                        {isLoading ? (
                            <>
                                <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Icon name="Send" className="mr-2 h-4 w-4" />
                                Enviar Mensaje
                            </>
                        )}
                    </Button>
                </div>

              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default MessageForm;