import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

// Definimos la URL base (ajusta esto si la variable viene de un archivo de configuración)
const IP_API = "https://back-acciona.vercel.app"; // O la URL que estés usando

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

// --- Función Auxiliar para Archivos (Tomada de FormPreview) ---
// --- Función Auxiliar para Archivos (CORREGIDA: Elimina el prefijo Base64) ---
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        // Obtenemos la URL de datos y eliminamos el prefijo (data:mime/type;base64,)
        const base64String = reader.result.split(',')[1];
        if (!base64String) {
            reject(new Error("No se pudo obtener la cadena Base64 del archivo."));
            return;
        }
        resolve(base64String); // Devolvemos solo la cadena limpia
    };
    reader.onerror = error => reject(error);
  });
};

// --- Componente Principal ---
const MessageForm = () => {
  // 1. Estados del Formulario
  const [formData, setFormData] = useState({
    destino: '',
    asunto: '',
    mensaje: '',
  });

  const [recipients, setRecipients] = useState([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);

  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // 2. Estados de Layout (Se mantienen igual)
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

  // 3. Efecto para manejo de pantalla (Se mantiene igual)
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

  // 4. FETCH DE DESTINATARIOS (Contiene la lógica para obtener mongoId)
  useEffect(() => {
    const fetchRecipients = async () => {
      setIsLoadingRecipients(true);
      try {
        const response = await fetch(`${IP_API}/api/auth/solicitud`);

        if (!response.ok) {
          throw new Error('Error al obtener solicitudes');
        }

        const data = await response.json();
        const uniqueUsersMap = new Map();

        data.forEach(item => {
          // Intentamos obtener el ID de MongoDB, si no existe usamos el correo
          // El campo '_id' debería ser el ObjectId
          const mongoId = item._id || item.id || item.correo;

          const userId = item.correo;
          const userEmpresa = item.empresa || "";
          const userName = item.nombre + " " + (item.apellido || "");
          const userEmail = item.correo || "";

          if (!uniqueUsersMap.has(userId)) {
            uniqueUsersMap.set(userId, {
              id: userId, // Es el email (se usa como key/value para el select)
              label: userEmail ? `${userName} (${userEmpresa})` : userName,
              value: userId,
              profileData: {
                ...item,
                mongoId: mongoId // Guardamos el ID de MongoDB aquí
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
    };

    fetchRecipients();
  }, []);

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

  // 6. Lógica del Formulario (handleInputChange, removeFile se mantienen igual)
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

  const FORM_ID_SIMULADO = "6902379d46e3a2e6e0d8a57f";
  const FORM_TITLE_SIMULADO = "ENVÍO DE DOCUMENTOS";
  const Q_NOMBRE_TRABAJADOR_TITLE = "Nombre del trabajador"; // Usaremos esto para el asunto
  const Q_DOCUMENTO_ADJUNTO_TITLE = "Adjuntar documento aquí"; // Usaremos esto para los archivos

  // *** LÓGICA DE ENVÍO DE FORMULARIO ADAPTADA Y CORREGIDA ***
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.destino || !formData.asunto || files.length === 0) {
      alert("Por favor selecciona un destinatario, ingresa un asunto y adjunta al menos un archivo.");
      return;
    }

    setIsLoading(true);

    try {
      // --- 1. Obtener Datos de Usuarios ---
      const loggedUserMail = sessionStorage.getItem("email");
      const loggedUserName = sessionStorage.getItem("usuario");
      const loggedUserCargo = sessionStorage.getItem("cargo");
      const loggedUserToken = sessionStorage.getItem("token");

      // Buscar el perfil completo del destinatario seleccionado
      const selectedRecipient = recipients.find(r => r.value === formData.destino);
      if (!selectedRecipient) {
        throw new Error("Destinatario no encontrado en la lista de solicitudes.");
      }

      // Datos del Destinatario (será el 'user' del payload, el solicitante)
      const recipientProfile = selectedRecipient.profileData;

      // Aseguramos que el UID sea el ObjectId si tiene 24 caracteres, o el correo.
      const recipientUid = recipientProfile.mongoId && recipientProfile.mongoId.length === 24 ? recipientProfile.mongoId : recipientProfile.correo;

      const userPayload = {
        uid: recipientUid,
        nombre: recipientProfile.nombre + " " + (recipientProfile.apellido || ""),
        empresa: recipientProfile.empresa,
        mail: recipientProfile.correo,
        token: loggedUserToken || ""
      };

      // Datos del Usuario Logeado (para registrar quién lo envió)
      const senderInfo = `Nombre: ${loggedUserName || 'Desconocido'}, Email: ${loggedUserMail || 'Desconocido'}, Cargo: ${loggedUserCargo || 'N/A'}`;

      // --- 2. Simulación de la estructura de respuestas (responses) ---
      // Mapeamos los campos del formulario de mensaje a los campos requeridos del formulario real:

      const cleanAnswers = {
        // Campo requerido del formulario real: "Nombre del trabajador"
        [Q_NOMBRE_TRABAJADOR_TITLE]: formData.asunto, // Usamos el ASUNTO para cumplir con el 'Nombre del trabajador'

        // Campo de seguimiento: ¿Quién lo recibe?
        "Destinatario Seleccionado (Sistema)": selectedRecipient.label,

        // El cuerpo del mensaje como respuesta adicional:
        "Cuerpo del Mensaje (Información Adicional)": formData.mensaje,

        // El usuario logeado que lo envió (para trazabilidad en las respuestas)
        "Enviado Por (Usuario Logeado)": senderInfo
      };

      // NOTA: El campo de archivo "Adjuntar documento aquí" no va aquí, se maneja en el paso 4.


      // --- 3. Payload Base (Envío sin archivos) ---
      const payloadBase = {
        formId: FORM_ID_SIMULADO, // ID real del formulario "ENVÍO DE DOCUMENTOS"
        formTitle: FORM_TITLE_SIMULADO,
        responses: cleanAnswers,
        mail: "",
        submittedAt: new Date().toISOString(),
        user: userPayload,
        adjuntos: []
      };

      console.log('Enviando respuestas base (Simulando Formulario)...');
      const res = await fetch(`${IP_API}/api/respuestas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBase),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error al enviar respuestas base: ${errorText}`);
      }

      const data = await res.json();
      const responseId = data._id;
      console.log('✅ Respuesta base guardada. ID de Respuesta:', responseId);

      // --- 4. Procesar y Enviar Archivos ---
      if (files.length > 0) {
        console.log('Procesando y enviando archivos...');

        const todosLosArchivos = [];

        // Usamos el título del campo de archivo real del formulario
        const questionTitle = Q_DOCUMENTO_ADJUNTO_TITLE;

        const filePromises = files.map(async (file, fileIndex) => {
          try {
            const fileData = await fileToBase64(file);
            return {
              adjunto: {
                pregunta: questionTitle, // Usamos el título de la pregunta de archivo del formulario real
                fileName: file.name,
                fileData: fileData,
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
              console.log(`Enviando archivo ${i + 1} de ${todosLosArchivos.length}:`, archivoData.adjunto.fileName);

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
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          console.log(`✅ Total archivos procesados: ${todosLosArchivos.length}`);
        }
      } else {
        // Ya se validó al inicio, pero por si acaso, lanzamos error si no hay archivos (el formulario los requiere)
        throw new Error("El formulario requiere que adjuntes al menos un documento.");
      }

      alert("Mensaje/Documento enviado con éxito y registrado en las respuestas.");

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
                  <label className="text-sm font-medium text-foreground">Asunto</label>
                  <Input
                    name="asunto"
                    value={formData.asunto}
                    onChange={handleInputChange}
                    placeholder="Escribe el asunto del mensaje"
                    required
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>

                {/* Campo: Carga de Archivos */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Adjuntar Archivos</label>
                  <div className={`border-2 border-dashed border-border rounded-lg p-6 hover:bg-muted/50 transition-colors text-center ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => !isLoading && fileInputRef.current?.click()}>
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
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, JPG, etc. (No hay validación estricta de tipo aquí)</p>
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