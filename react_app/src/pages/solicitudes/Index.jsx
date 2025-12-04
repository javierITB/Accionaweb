import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

// Definimos la URL base (ajusta esto si la variable viene de un archivo de configuración)
const IP_API = "https://https://back-acciona.vercel.app"; // O la URL que estés usando

// --- FUNCIÓN PARA OBTENER DATOS DEL ADMIN/REMITENTE DESDE SESSION STORAGE ---
// Usado para la trazabilidad y la token del usuario logeado
const getSenderData = () => {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return {
      mail: sessionStorage.getItem('email'),
      nombre: sessionStorage.getItem('user'), // Asumo 'user' contiene el nombre completo
      cargo: sessionStorage.getItem('cargo'),
      token: sessionStorage.getItem('token'),
      uid: sessionStorage.getItem('uid'),
      empresa: sessionStorage.getItem('empresa')
    };
  }
  return {};
};
// --- FIN FUNCIÓN PARA OBTENER DATOS DEL ADMIN/REMITENTE ---

// --- Componentes UI reutilizados (Se mantienen igual) ---
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

// --- Función Auxiliar para Archivos (Base64) ---
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      if (!base64String) {
        reject(new Error("No se pudo obtener la cadena Base64 del archivo."));
        return;
      }
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};

// --- Componente Principal ---
const MessageForm = () => {
  // 1. Estados del Formulario
  const [formData, setFormData] = useState({
    destino: '', // Valor del select (Email o ID)
    asunto: '',
    mensaje: '',
  });

  const [recipients, setRecipients] = useState([]);
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

  // 4. FETCH DE DESTINATARIOS (Restaurado el useCallback para mejor manejo)
  const fetchRecipients = useCallback(async () => {
    setIsLoadingRecipients(true);
    try {
      // Endpoint para obtener la lista de posibles destinatarios (usuarios)
      const response = await fetch(`${IP_API}/api/auth/solicitud`);

      if (!response.ok) {
        throw new Error('Error al obtener la lista de usuarios');
      }

      const data = await response.json();
      const uniqueUsersMap = new Map();

      data.forEach(item => {
        // Usamos el UID de mongo si existe, o el correo como fallback
        const uid = item.uid || item._id;
        const email = item.correo || item.mail || item.email; // Aseguramos el email
        const key = uid || email; // Clave única para el mapa

        if (key && !uniqueUsersMap.has(key)) {
          const userName = item.nombre;
          const userEmpresa = item.empresa || "";

          uniqueUsersMap.set(key, {
            id: key, // Clave para el mapa
            label: email ? `${userName} (${userEmpresa}) - ${email}` : `${userName} (${userEmpresa})`,
            value: key, // El valor del select será el UID o el Email
            profileData: {
              uid: uid, // Usamos el uid real (ObjectId)
              nombre: userName,
              apellido: item.apellido || "",
              empresa: userEmpresa,
              correo: email,
              // Añade aquí cualquier otro campo necesario (ej: cargo)
            }
          });
        }
      });

      setRecipients(Array.from(uniqueUsersMap.values()));

    } catch (error) {
      console.error("Error cargando destinatarios:", error);
    } finally {
      setIsLoadingRecipients(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  // 5. Funciones de Layout (Se mantienen igual)
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

  // --- Constantes del Formulario de Backend que se está simulando ---
  const FORM_ID_SIMULADO = "6902379d46e3a2e6e0d8a57f";
  const FORM_TITLE_SIMULADO = "Solicitud para Cliente";
  const Q_NOMBRE_TRABAJADOR_TITLE = "Nombre del trabajador";
  const Q_DOCUMENTO_ADJUNTO_TITLE = "Adjuntar documento aquí";
  // --- FIN Constantes ---

  // *** LÓGICA DE ENVÍO DE FORMULARIO (MODIFICADA PARA INYECTAR) ***
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.destino || !formData.asunto || files.length === 0) {
      alert("Por favor selecciona un destinatario, ingresa un asunto y adjunta al menos un archivo.");
      return;
    }

    setIsLoading(true);

    try {
      // --- 1. Obtener Datos del Remitente y Destinatario ---
      const senderData = getSenderData(); // <<< DATOS DEL ADMINISTRADOR LOGEADO
      
      // Asegurarse de que el administrador tenga token para la validación
      if (!senderData.token) {
         throw new Error("Token de sesión de administrador no encontrado. Por favor, vuelva a iniciar sesión.");
      }
      
      const senderInfo = `Nombre: ${senderData.nombre || 'Desconocido'}, Email: ${senderData.mail || 'Desconocido'}, Cargo: ${senderData.cargo || 'N/A'}, UID: ${senderData.uid || 'N/A'}`;

      const selectedRecipient = recipients.find(r => r.value === formData.destino);
      if (!selectedRecipient) {
        throw new Error("Destinatario no encontrado en la lista de solicitudes.");
      }

      // Perfil del Destinatario (usado para inyectar en DB)
      const recipientProfile = selectedRecipient.profileData;
      
      // --- EXTRACCIÓN Y SEPARACIÓN CLAVE PARA EL BACKEND ---
      const destinatarioNombreCompleto = recipientProfile.nombre;
      const destinatarioEmpresa = recipientProfile.empresa;
      // -----------------------------------------------------

      // --- 2. Simulación de la estructura de respuestas (responses) ---
      const cleanAnswers = {
        // CAMPOS REQUERIDOS POR EL BACKEND ADMINISTRATIVO para buscar al usuario
        "Destinatario": destinatarioNombreCompleto,
        "EmpresaDestino": destinatarioEmpresa,
        
        // Contenido y trazabilidad
        [Q_NOMBRE_TRABAJADOR_TITLE]: formData.asunto,
        "Cuerpo del Mensaje (Información Adicional)": formData.mensaje,
        "Enviado Por (Usuario Logeado)": senderInfo,
      };


      // --- 3. Payload Base (Envío sin archivos) ---
      const payloadBase = {
        formId: FORM_ID_SIMULADO,
        formTitle: FORM_TITLE_SIMULADO,
        responses: cleanAnswers, 
        mail: recipientProfile.correo,
        submittedAt: new Date().toISOString(),
        
        // *** CAMBIO CLAVE AQUÍ ***
        // El campo 'user' debe ser el objeto del ADMINISTRADOR (con token) para la validación del endpoint /admin
        user: senderData, 
        
        adjuntos: []
      };

      console.log('Enviando respuestas base a /admin (Para validación de token)...');

      // Se mantiene la URL correcta
      const res = await fetch(`${IP_API}/api/respuestas/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadBase),
      });

      if (!res.ok) {
        const errorText = await res.text();
        // Intentar parsear el JSON para mostrar el error específico del backend (401 o 400)
        let errorBody = { error: errorText };
        try {
            errorBody = JSON.parse(errorText);
        } catch (e) { /* no es JSON */ }
        
        throw new Error(`Error al enviar respuestas base: ${errorBody.error || errorText}`);
      }

      const data = await res.json();
      const responseId = data._id;
      console.log('✅ Respuesta base guardada. ID de Respuesta:', responseId);

      // --- 4. Procesar y Enviar Archivos (al endpoint de adjuntos) ---
      if (files.length > 0) {
        console.log('Procesando y enviando archivos...');
        const todosLosArchivos = [];
        const questionTitle = Q_DOCUMENTO_ADJUNTO_TITLE;

        const filePromises = files.map(async (file, fileIndex) => {
          try {
            const fileData = await fileToBase64(file);
            return {
              adjunto: {
                pregunta: questionTitle,
                fileName: file.name,
                fileData: fileData, // Base64
                mimeType: file.type,
                size: file.size
              },
              index: fileIndex,
              total: files.length
            };
          } catch (error) {
            console.error('Error procesando archivo:', error);
            return null;
          }
        });

        const processedFiles = await Promise.all(filePromises);
        const validFiles = processedFiles.filter(file => file !== null);
        todosLosArchivos.push(...validFiles);

        if (todosLosArchivos.length > 0) {
          console.log(`Enviando ${todosLosArchivos.length} archivos...`);

          for (let i = 0; i < todosLosArchivos.length; i++) {
            const archivoData = todosLosArchivos[i];

            try {
              const uploadRes = await fetch(`${IP_API}/api/respuestas/${responseId}/adjuntos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(archivoData),
              });

              if (!uploadRes.ok) {
                const errorText = await uploadRes.text();
                console.warn(`Error subiendo archivo ${i + 1}:`, errorText);
              } else {
                console.log(`✅ Archivo ${i + 1} subido exitosamente.`);
              }
            } catch (chunkError) {
              console.error(`Error en archivo ${i + 1}:`, chunkError);
            }
            await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña pausa
          }
        }
      }

      alert("Mensaje/Documento enviado con éxito y registrado en las respuestas del destinatario.");

      // Limpiar
      setFormData({ destino: '', asunto: '', mensaje: '' });
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (error) {
      console.error("Error al enviar el mensaje/formulario:", error);
      alert(`Error al enviar el mensaje: ${error.message}`);
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
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Inyección de Solicitud (Administrativo)</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Envía un documento/solicitud que aparecerá en el menú del usuario destinatario.
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
                    disabled={isLoadingRecipients || isLoading}
                    required
                  >
                    <option value="">
                      {isLoadingRecipients ? "Cargando usuarios..." : "Selecciona un destinatario"}
                    </option>

                    {!isLoadingRecipients && recipients.map((user) => (
                      <option key={user.id} value={user.value}>
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
                  <label className="text-sm font-medium text-foreground">Asunto (Se mapea a: "{Q_NOMBRE_TRABAJADOR_TITLE}")</label>
                  <Input
                    name="asunto"
                    value={formData.asunto}
                    onChange={handleInputChange}
                    placeholder="Escribe el asunto del mensaje/documento"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Campo: Mensaje */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mensaje (Se guarda como campo de trazabilidad)</label>
                  <Textarea
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleInputChange}
                    placeholder="Escribe tu mensaje aquí..."
                    rows={6}
                    disabled={isLoading}
                  />
                </div>

                {/* Campo: Carga de Archivos */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Adjuntar Archivos (Se mapea a: "{Q_DOCUMENTO_ADJUNTO_TITLE}")</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 hover:bg-muted/50 transition-colors text-center" onClick={() => !isLoading && fileInputRef.current?.click()}>
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isLoading}
                    />
                    <Icon name="UploadCloud" size={32} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">Haz clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, JPG, etc.</p>
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
                            disabled={isLoading}
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
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    disabled={isLoading}
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
                        Enviar Documento/Solicitud
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