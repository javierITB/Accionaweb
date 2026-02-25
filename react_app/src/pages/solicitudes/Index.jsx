import React, { useState, useEffect, useRef, useCallback } from "react";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import CleanDocumentPreview from "../../components/ui/CleanDocumentPreview";
import { Navigate } from "react-router-dom";

import { apiFetch, API_BASE_URL } from "../../utils/api";

const IP_API = API_BASE_URL;

const getSenderData = () => {
   if (typeof window !== "undefined" && window.sessionStorage) {
      return {
         mail: sessionStorage.getItem("email"),
         nombre: sessionStorage.getItem("user"),
         cargo: sessionStorage.getItem("cargo"),
         token: sessionStorage.getItem("token"),
         uid: sessionStorage.getItem("uid"),
         empresa: sessionStorage.getItem("empresa"),
      };
   }
   return {};
};

// --- Componentes UI reutilizados ---
const Input = React.forwardRef((props, ref) => (
   <input
      ref={ref}
      {...props}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
   />
));

const Textarea = React.forwardRef(({ className = "", ...props }, ref) => (
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
      <Icon name="ChevronDown" size={16} className="absolute right-3 top-3 text-muted-foreground pointer-events-none" />
   </div>
));

const fileToBase64 = (file) => {
   return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
         const base64String = reader.result.split(",")[1];
         if (!base64String) {
            reject(new Error("No se pudo obtener la cadena Base64 del archivo."));
            return;
         }
         resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
   });
};

const MessageForm = ({ userPermissions = [] }) => {
   // 1. Estados del Formulario
   const [formData, setFormData] = useState({
      destino: "",
      asunto: "",
      mensaje: "",
   });

   const [recipients, setRecipients] = useState([]);
   const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
   const [files, setFiles] = useState([]);
   const [isLoading, setIsLoading] = useState(false);
   const fileInputRef = useRef(null);

   // --- NUEVOS ESTADOS PARA VISTA PREVIA ---
   const [showPreview, setShowPreview] = useState(false);
   const [previewDocument, setPreviewDocument] = useState(null);
   const [loadingPreviewIndex, setLoadingPreviewIndex] = useState(null);

   const canCreate = userPermissions.includes("create_solicitudes_a_cliente");

   // 2. Estados de Layout
   const [isDesktopOpen, setIsDesktopOpen] = useState(true);
   const [isMobileOpen, setIsMobileOpen] = useState(false);
   const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);

   useEffect(() => {
      const handleResize = () => {
         const isMobile = window.innerWidth < 768;
         setIsMobileScreen(isMobile);
         if (isMobile) setIsMobileOpen(false);
      };
      window.addEventListener("resize", handleResize);
      handleResize();
      return () => window.removeEventListener("resize", handleResize);
   }, []);

   // 4. FETCH DE DESTINATARIOS
   const fetchRecipients = useCallback(async () => {
      setIsLoadingRecipients(true);
      try {
         const response = await apiFetch(`${IP_API}/auth/solicitud`);
         if (!response.ok) throw new Error("Error al obtener la lista de usuarios");
         const data = await response.json();
         const uniqueUsersMap = new Map();

         data.forEach((item) => {
            const uid = item.uid || item._id;
            const email = item.correo || item.mail || item.email;
            const key = uid || email;

            if (key && !uniqueUsersMap.has(key)) {
               uniqueUsersMap.set(key, {
                  id: key,
                  label: email ? `${item.nombre} (${item.empresa || ""}) - ${email}` : `${item.nombre} (${item.empresa || ""})`,
                  value: key,
                  profileData: {
                     uid: uid,
                     nombre: item.nombre,
                     apellido: item.apellido || "",
                     empresa: item.empresa || "",
                     correo: email,
                  },
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

   // --- LÓGICA DE GESTIÓN DE VISTA PREVIA ---
   const cleanupPreviewUrl = (url) => {
      if (url && url.startsWith("blob:")) {
         URL.revokeObjectURL(url);
      }
   };

   useEffect(() => {
      return () => {
         if (previewDocument?.url) cleanupPreviewUrl(previewDocument.url);
      };
   }, [previewDocument]);

   const handlePreviewFile = (file, index) => {
      // Extraemos la extensión y limpiamos caracteres no alfanuméricos al final (ej: "xlsx#" -> "xlsx")
      let rawExtension = file.name.split('.').pop().toLowerCase();
      let docType = rawExtension.replace(/[^a-z0-9]+$/g, '');

      if (file.type && file.type.startsWith('image/')) {
         docType = 'image';
      }

      setLoadingPreviewIndex(index);

      // 4. Crear la URL temporal y abrir el modal con el tipo detectado
      const url = URL.createObjectURL(file);
      setPreviewDocument({ url, type: docType });
      setShowPreview(true);

      setLoadingPreviewIndex(null);
   };

   const canAccess = userPermissions.includes("view_solicitudes_a_cliente");
   if (!canAccess) return <Navigate to="/panel" replace />;

   const toggleSidebar = () => {
      if (isMobileScreen) setIsMobileOpen(!isMobileOpen);
      else setIsDesktopOpen(!isDesktopOpen);
   };

   const handleNavigation = () => {
      if (isMobileScreen) setIsMobileOpen(false);
   };

   const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
   };

   const handleFileChange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
         const newFiles = Array.from(e.target.files);
         setFiles((prev) => [...prev, ...newFiles]);
         e.target.value = ""; // Limpiar para permitir re-selección
      }
   };

   const removeFile = (indexToRemove) => {
      setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (!canCreate) {
         alert("No tienes permisos para crear solicitudes.");
         return;
      }
      if (!formData.destino || !formData.asunto || files.length === 0) {
         alert("Por favor selecciona un destinatario, ingresa un asunto y adjunta al menos un archivo.");
         return;
      }

      setIsLoading(true);

      try {
         const senderData = getSenderData();
         if (!senderData.token) throw new Error("Token de sesión no encontrado.");

         const senderInfo = `Nombre: ${senderData.nombre || "Desconocido"}, Email: ${senderData.mail || "Desconocido"}, Cargo: ${senderData.cargo || "N/A"}`;
         const selectedRecipient = recipients.find((r) => r.value === formData.destino);
         const recipientProfile = selectedRecipient.profileData;

         const payloadBase = {
            formId: "692dbd48cbdccb42fb466c22",
            formTitle: "Solicitud para Cliente",
            responses: {
               Destinatario: recipientProfile.nombre,
               EmpresaDestino: recipientProfile.empresa,
               "Nombre del trabajador": formData.asunto,
               "Cuerpo del Mensaje (Información Adicional)": formData.mensaje,
               "Enviado Por (Usuario Logeado)": senderInfo,
            },
            mail: recipientProfile.correo,
            submittedAt: new Date().toISOString(),
            user: senderData,
            adjuntos: [],
         };

         const res = await apiFetch(`${IP_API}/respuestas/admin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadBase),
         });

         if (!res.ok) throw new Error("Error al enviar la solicitud base");
         const dataRes = await res.json();
         const responseId = dataRes._id;

         for (let i = 0; i < files.length; i++) {
            const fileData = await fileToBase64(files[i]);
            await apiFetch(`${IP_API}/respuestas/${responseId}/adjuntos`, {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                  adjunto: {
                     pregunta: "Adjuntar documento aquí",
                     fileName: files[i].name,
                     fileData: fileData,
                     mimeType: files[i].type,
                     size: files[i].size,
                  },
                  index: i,
                  total: files.length,
               }),
            });
         }

         alert("Enviado con éxito.");
         setFormData({ destino: "", asunto: "", mensaje: "" });
         setFiles([]);
      } catch (error) {
         console.error("Error:", error);
         alert(`Error: ${error.message}`);
      } finally {
         setIsLoading(false);
      }
   };

   const mainMarginClass = isMobileScreen ? "ml-0" : isDesktopOpen ? "ml-64" : "ml-16";

   return (
      <div className="min-h-screen bg-background">
         <Header />
         {(isMobileOpen || !isMobileScreen) && (
            <>
               <Sidebar isCollapsed={!isDesktopOpen} onToggleCollapse={toggleSidebar} isMobileOpen={isMobileOpen} onNavigate={handleNavigation} />
               {isMobileScreen && isMobileOpen && <div className="fixed inset-0 bg-foreground/50 z-40" onClick={toggleSidebar}></div>}
            </>
         )}

         {!isMobileOpen && isMobileScreen && (
            <div className="fixed bottom-4 left-4 z-50">
               <Button variant="default" size="icon" onClick={toggleSidebar} iconName="Menu" className="w-12 h-12 rounded-full shadow-brand-active" />
            </div>
         )}

         <main className={`transition-all duration-300 ${mainMarginClass} pt-20 md:pt-16`}>
            <div className="p-6 space-y-6 container-main max-w-4xl mx-auto">
               <div className="mb-4">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-4">Inyección de Solicitud (Administrativo)</h1>
                  <p className="text-muted-foreground mt-1 text-sm md:text-base">Envía un documento que aparecerá en el menú del usuario.</p>
               </div>

               <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                  {!canCreate && (
                     <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 rounded-lg text-sm flex items-center gap-2">
                        <Icon name="AlertTriangle" size={16} />
                        <span>No tienes permisos para enviar solicitudes.</span>
                     </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Destinatario</label>
                        <Select name="destino" value={formData.destino} onChange={handleInputChange} disabled={isLoadingRecipients || isLoading || !canCreate} required>
                           <option value="">{isLoadingRecipients ? "Cargando..." : "Selecciona un destinatario"}</option>
                           {recipients.map((user) => <option key={user.id} value={user.value}>{user.label}</option>)}
                        </Select>
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Asunto</label>
                        <Input name="asunto" value={formData.asunto} onChange={handleInputChange} placeholder="Escribe el asunto" required disabled={isLoading || !canCreate} />
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Mensaje</label>
                        <Textarea name="mensaje" value={formData.mensaje} onChange={handleInputChange} placeholder="Mensaje adicional..." rows={4} disabled={isLoading || !canCreate} />
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Adjuntar Archivos</label>
                        <div
                           className={`border-2 border-dashed border-border rounded-lg p-6 transition-colors text-center ${!isLoading && canCreate ? "hover:bg-muted/50 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                           onClick={() => !isLoading && canCreate && fileInputRef.current?.click()}
                        >
                           <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={isLoading || !canCreate} />
                           <Icon name="UploadCloud" size={32} className="mx-auto text-muted-foreground mb-2" />
                           <p className="text-sm text-muted-foreground">Haz clic para subir o arrastra archivos</p>
                        </div>

                        {files.length > 0 && (
                           <div className="mt-4 space-y-2">
                              {files.map((file, index) => (
                                 <div key={index} className="flex items-center justify-between p-3 bg-muted/50 border border-border rounded-lg transition-all group">
                                    <div className="flex items-center space-x-3 cursor-pointer overflow-hidden flex-1" onClick={() => handlePreviewFile(file, index)}>
                                       <Icon name={file.type.includes("pdf") ? "FileText" : "File"} size={20} className="text-primary flex-shrink-0" />
                                       <div className="flex flex-col min-w-0">
                                          <span className="text-sm font-medium truncate">{file.name}</span>
                                          <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                                       </div>
                                       {loadingPreviewIndex === index && <Icon name="Loader" size={14} className="animate-spin text-accent" />}
                                    </div>
                                    <div className="flex items-center gap-1">
                                       <Button type="button" variant="ghost" size="icon" onClick={() => handlePreviewFile(file, index)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                                          <Icon name="Eye" size={16} />
                                       </Button>
                                       <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)} className="h-8 w-8 text-muted-foreground hover:text-red-500" disabled={isLoading}>
                                          <Icon name="X" size={16} />
                                       </Button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>

                     <div className="pt-4 border-t flex justify-end space-x-3">
                        <Button type="button" variant="outline" onClick={() => { setFormData({ destino: "", asunto: "", mensaje: "" }); setFiles([]); }} disabled={isLoading || !canCreate}>Cancelar</Button>
                        {canCreate && (
                           <Button type="submit" variant="default" disabled={isLoading} className="bg-primary text-white">
                              {isLoading ? <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : <><Icon name="Send" className="mr-2 h-4 w-4" />Enviar Solicitud</>}
                           </Button>
                        )}
                     </div>
                  </form>
               </div>
            </div>
         </main>

         {/* COMPONENTE DE VISTA PREVIA INTEGRADO */}
         <CleanDocumentPreview
            isVisible={showPreview}
            onClose={() => {
               cleanupPreviewUrl(previewDocument?.url);
               setShowPreview(false);
            }}
            documentUrl={previewDocument?.url}
            documentType={previewDocument?.type}
         />
      </div>
   );
};

export default MessageForm;