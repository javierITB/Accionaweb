import React, { useState, useEffect, useRef } from "react";
import { apiFetch, API_BASE_URL } from "../../../utils/api";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import BackButton from "@/clientPages/components/BackButton.jsx";

const TicketSystem = () => {
   const [activeTab, setActiveTab] = useState("create");
   const [ticketForm, setTicketForm] = useState({
      subject: "",
      category: "",
      description: "",
      attachments: [], // Stores File objects
   });

   const userMail = sessionStorage.getItem("email");
   const token = sessionStorage.getItem("token");

   const fileInputRef = useRef(null);
   const MAX_FILES = 5;
   const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit per file

   // Static categories for error reporting (Fallback)
   const defaultCategories = [
      { value: "error_acceso", label: "Error de Inicio de Sesión" },
      { value: "error_visualizacion", label: "Problema de Visualización" },
      { value: "error_guardado", label: "Error al Guardar Datos" },
      { value: "lentitud", label: "Lentitud del Sistema" },
      { value: "funcionalidad_rota", label: "Funcionalidad No Responde" },
      { value: "otro", label: "Otro" },
   ];

   const [categoriesOptions, setCategoriesOptions] = useState(defaultCategories);

   useEffect(() => {
      const fetchConfig = async () => {
         try {
            const res = await apiFetch(`${API_BASE_URL}/config-tickets`);
            if (res.ok) {
               const configs = await res.json();
               // Buscar configuración de 'sistema'
               const sistemaConfig = configs.find((c) => c.key === "sistema");

               if (sistemaConfig && sistemaConfig.subcategories && sistemaConfig.subcategories.length > 0) {
                  const dynamicOptions = sistemaConfig.subcategories.map((sub) => ({
                     value: sub.value || sub.name || sub.label,
                     label: sub.label || sub.name || sub.value,
                  }));
                  setCategoriesOptions(dynamicOptions);
               }
            }
         } catch (error) {
            console.error("Error fetching ticket config, using defaults", error);
         }
      };

      // Solo intentar cargar si el usuario está autenticado (aunque el componente lo maneja)
      if (token) fetchConfig();
   }, [token]);

   const [myTickets, setMyTickets] = useState([]);
   const [isLoading, setIsLoading] = useState(false);
   const [currentUser, setCurrentUser] = useState(null);

   const [selectedTicket, setSelectedTicket] = useState(null);

   // Fetch initial data
   useEffect(() => {
      const fetchData = async () => {
         if (!userMail) return;
         setIsLoading(true);
         try {
            // 1. Fetch User Details
            const userRes = await apiFetch(`${API_BASE_URL}/auth/full/${userMail}`);
            if (userRes.ok) {
               const userData = await userRes.json();
               setCurrentUser({
                  nombre: userData.nombre || sessionStorage.getItem("user"),
                  empresa: userData.empresa,
                  uid: userData._id,
                  token: token,
                  email: userMail,
               });
            }

            // 2. Fetch User Tickets
            fetchTickets();
         } catch (error) {
            console.error("Error fetching initial data:", error);
         } finally {
            setIsLoading(false);
         }
      };

      fetchData();
   }, [userMail, token]);

   const fetchTickets = async () => {
      if (!userMail) return;
      try {
         const res = await apiFetch(`${API_BASE_URL}/soporte/mail/${userMail}?origin=portal_cliente`);
         if (res.ok) {
            const data = await res.json();
            setMyTickets(data.reverse());
         }
      } catch (error) {
         console.error("Error fetching tickets:", error);
      }
   };

   const handleTicketClick = (ticket) => {
      setSelectedTicket(ticket);
      setActiveTab("details");
   };

   const handleInputChange = (field, value) => {
      setTicketForm((prev) => ({
         ...prev,
         [field]: value,
      }));
   };

   const formatFileSize = (bytes) => {
      if (!bytes) return "0 KB";
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1048576) {
         return (bytes / 1024).toFixed(2) + " KB";
      }
      return (bytes / 1048576).toFixed(2) + " MB";
   };

   const handleFileSelect = (event) => {
      const files = Array.from(event.target.files);

      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
      const invalidFiles = files.filter((file) => !allowedTypes.includes(file.type));

      if (invalidFiles.length > 0) {
         alert("Solo se permiten archivos PDF e imágenes (JPG, PNG, WEBP)");
         event.target.value = "";
         return;
      }

      // Validate count
      if (ticketForm.attachments.length + files.length > MAX_FILES) {
         alert(`Máximo ${MAX_FILES} archivos permitidos.`);
         event.target.value = "";
         return;
      }

      // Validate size
      const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
         const names = oversizedFiles.map((f) => f.name).join(", ");
         alert(`Los siguientes archivos exceden el límite de 5MB: ${names}`);
         event.target.value = "";
         return;
      }

      setTicketForm((prev) => ({
         ...prev,
         attachments: [...prev.attachments, ...files],
      }));
      event.target.value = "";
   };

   const handleRemoveFile = (index) => {
      setTicketForm((prev) => ({
         ...prev,
         attachments: prev.attachments.filter((_, i) => i !== index),
      }));
   };

   const handleSubmitTicket = async () => {
      if (!ticketForm?.subject || !ticketForm?.category || !ticketForm?.description) {
         alert("Por favor completa todos los campos obligatorios");
         return;
      }

      if (!currentUser) {
         alert("Error: No se pudo identificar al usuario. Por favor recarga la página.");
         return;
      }

      setIsLoading(true);
      try {
         const selectedCategory = categoriesOptions.find((c) => c.value === ticketForm.category);
         const categoryLabel = selectedCategory ? selectedCategory.label : "Ticket de Soporte";

         const formData = new FormData();
         formData.append("formId", ticketForm.category);
         formData.append("formTitle", categoryLabel);
         formData.append("category", "sistema"); // Categoría principal: Sistema
         formData.append("origin", "portal_cliente"); // Identificador de origen
         formData.append("mail", currentUser.email);

         // User and Responses as JSON strings
         formData.append(
            "user",
            JSON.stringify({
               nombre: currentUser.nombre,
               empresa: currentUser.empresa,
               uid: currentUser.uid,
               token: currentUser.token,
            }),
         );

         formData.append(
            "responses",
            JSON.stringify({
               Asunto: ticketForm.subject,
               Descripción: ticketForm.description,
               Prioridad: "Media",
               Categoría: "Sistema",
               Subcategoría: categoryLabel,
            }),
         );

         ticketForm.attachments.forEach((file) => {
            formData.append("adjuntos", file);
         });

         const res = await apiFetch(`${API_BASE_URL}/soporte/`, {
            method: "POST",
            body: formData,
         });

         if (res.ok) {
            alert("Ticket creado exitosamente.");
            setTicketForm({
               subject: "",
               category: "",
               description: "",
               attachments: [],
            });
            setActiveTab("my-tickets");
            fetchTickets();
         } else {
            const errData = await res.json();
            alert(`Error al crear ticket: ${errData.error || "Error desconocido"}`);
         }
      } catch (error) {
         console.error("Error creating ticket:", error);
         alert("Error de conexión al crear el ticket.");
      } finally {
         setIsLoading(false);
      }
   };

   const getStatusColor = (status) => {
      switch (status) {
         case "pendiente":
            return "bg-warning text-warning-foreground";
         case "en_revision":
            return "bg-primary text-primary-foreground";
         case "aprobado":
            return "bg-success text-success-foreground";
         case "finalizado":
            return "bg-muted text-muted-foreground";
         case "archivado":
            return "bg-gray-500 text-white";
         default:
            return "bg-muted text-muted-foreground";
      }
   };

   const getStatusText = (status) => {
      switch (status) {
         case "pendiente":
            return "Pendiente";
         case "en_revision":
            return "En Revisión";
         case "aprobado":
            return "Aprobado";
         case "finalizado":
            return "Finalizado";
         case "archivado":
            return "Archivado";
         default:
            status;
      }
   };

   return (
      <div className="mb-8">
         <div className="button-container pb-3 text-md">
            <BackButton />
         </div>
         <div className="flex justify-between w-full pb-2">

         <h2 className="text-2xl font-bold text-foreground">Sistema de Tickets</h2>
         {/* Tabs */}
         <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
            <Button
               variant={activeTab === "create" ? "default" : "ghost"}
               size="sm"
               onClick={() => {
                  setActiveTab("create");
                  setSelectedTicket(null);
               }}
               iconName="Plus"
               iconPosition="left"
               iconSize={16}
            >
               Crear Ticket
            </Button>
            <Button
               variant={activeTab === "my-tickets" || activeTab === "details" ? "default" : "ghost"}
               size="sm"
               onClick={() => {
                  setActiveTab("my-tickets");
                  setSelectedTicket(null);
               }}
               iconName="List"
               iconPosition="left"
               iconSize={16}
            >
               Mis Tickets
            </Button>
         </div>
         </div>

         {isLoading && <div className="text-center py-4">Cargando...</div>}

         {/* Create Ticket Tab */}
         {!isLoading && activeTab === "create" && (
            <div className="bg-card border border-border rounded-lg p-6">
               <h3 className="text-lg font-semibold text-foreground mb-6">Crear Nuevo Ticket</h3>

               <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Input
                        label="Asunto"
                        type="text"
                        placeholder="Describe brevemente tu problema"
                        value={ticketForm?.subject}
                        onChange={(e) => handleInputChange("subject", e?.target?.value)}
                        required
                     />

                     <Select
                        label="Categoría"
                        placeholder="Selecciona el tipo de error"
                        options={categoriesOptions}
                        value={ticketForm?.category}
                        onChange={(value) => handleInputChange("category", value)}
                        required
                     />
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-foreground mb-2">Descripción Detallada *</label>
                     <textarea
                        className="w-full h-32 px-3 py-2 border border-border rounded-md bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                        placeholder="Describe tu problema con el mayor detalle posible..."
                        value={ticketForm?.description}
                        onChange={(e) => handleInputChange("description", e?.target?.value)}
                        required
                     />
                  </div>

                  {/* File Upload Section - Styled like Admin RequestDetails */}
                  <div>
                     <label className="block text-sm font-medium text-foreground mb-3">Archivos Adjuntos</label>
                     <div className="bg-muted/30 rounded-lg p-4 border border-border">
                        {ticketForm.attachments.length > 0 ? (
                           <div className="space-y-3">
                              <div className="flex items-center justify-between mb-2">
                                 <div>
                                    <p className="text-sm font-medium text-foreground">
                                       Archivos seleccionados: {ticketForm.attachments.length}/{MAX_FILES}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                       Límite: {MAX_FILES} archivos • 5MB por archivo
                                    </p>
                                 </div>
                                 <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    iconName="Plus"
                                    iconPosition="left"
                                    disabled={ticketForm.attachments.length >= MAX_FILES}
                                 >
                                    Agregar más
                                 </Button>
                              </div>

                              {ticketForm.attachments.map((file, index) => (
                                 <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-card rounded border border-border"
                                 >
                                    <div className="flex items-center space-x-3">
                                       <Icon
                                          name={file.type === "application/pdf" ? "FileText" : "Image"}
                                          size={20}
                                          className="text-accent"
                                       />
                                       <div>
                                          <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                                             {file.name}
                                          </p>
                                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                       </div>
                                    </div>
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       onClick={() => handleRemoveFile(index)}
                                       className="text-error hover:bg-error/10"
                                    >
                                       <Icon name="X" size={16} />
                                    </Button>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="flex items-center justify-between">
                              <div>
                                 <p className="text-sm text-muted-foreground">No se han seleccionado archivos</p>
                                 <p className="text-xs text-muted-foreground">Soporta PDF, JPG, PNG, WEBP (Máx 5MB)</p>
                              </div>
                              <Button
                                 variant="outline"
                                 size="sm"
                                 iconName="Upload"
                                 iconPosition="left"
                                 onClick={() => fileInputRef.current?.click()}
                              >
                                 Seleccionar archivo(s)
                              </Button>
                           </div>
                        )}

                        <input
                           type="file"
                           ref={fileInputRef}
                           onChange={handleFileSelect}
                           accept=".pdf, .jpg, .jpeg, .png, .webp"
                           multiple
                           className="hidden"
                        />
                     </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                     <Button onClick={handleSubmitTicket}>Publicar Ticket</Button>
                  </div>
               </div>
            </div>
         )}

         {/* My Tickets Tab */}
         {!isLoading && activeTab === "my-tickets" && (
            <div className="space-y-4">
               {myTickets?.map((ticket) => (
                  <div
                     key={ticket?._id}
                     className="bg-card border border-border rounded-lg p-6 hover:shadow-brand-hover transition-brand cursor-pointer relative"
                     onClick={() => handleTicketClick(ticket)}
                  >
                     <div className="flex flex-col pr-32">
                        {/* Title */}
                        <h3 className="text-lg font-semibold text-foreground break-words mb-2 line-clamp-2">
                           {ticket?.responses?.Asunto || ticket?.formTitle}
                        </h3>

                        {/* Metadata Stack */}
                        <div className="space-y-2 text-sm text-muted-foreground mb-3">
                           {/* ID */}
                           <div className="flex items-center space-x-2">
                              <Icon name="Hash" size={14} className="flex-shrink-0" />
                              <span className="truncate text-xs font-mono">ID: {ticket?._id}</span>
                           </div>

                           {/* Categoría */}
                           <div className="flex items-center space-x-2">
                              <Icon name="Tag" size={14} className="flex-shrink-0" />
                              <span className="truncate">{ticket?.formTitle}</span>
                           </div>

                           {/* Fecha */}
                           <div className="flex items-center space-x-2">
                              <Icon name="Calendar" size={14} className="flex-shrink-0" />
                              <span>{new Date(ticket.createdAt)?.toLocaleDateString("es-ES")}</span>
                           </div>

                           {/* Status Badge inline in metadata or separate? Keeping it clean in stack or below title? 
                       RequestCard puts it at right top but we have button there.
                       User wanted "limpia". Let's put status as a badge in the stack.
                   */}
                           <div className="pt-1 flex items-center space-x-2">
                              <span
                                 className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket?.status)}`}
                              >
                                 {getStatusText(ticket?.status)}
                              </span>
                              {ticket.adjuntos && ticket.adjuntos.length > 0 && (
                                 <div
                                    className="flex items-center text-muted-foreground"
                                    title={`${ticket.adjuntos.length} archivo(s) adjunto(s)`}
                                 >
                                    <Icon name="Paperclip" size={14} className="mr-1" />
                                    <span className="text-xs">{ticket.adjuntos.length}</span>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="absolute top-6 right-6">
                        <Button variant="ghost" size="sm">
                           Ver Detalles
                        </Button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                           <p className="text-muted-foreground">Creado</p>
                           <p className="font-medium text-foreground">
                              {new Date(ticket.createdAt)?.toLocaleDateString("es-ES")}
                           </p>
                        </div>
                        <div>
                           <p className="text-muted-foreground">Última Actualización</p>
                           <p className="font-medium text-foreground">
                              {ticket.updatedAt ? new Date(ticket.updatedAt)?.toLocaleDateString("es-ES") : "-"}
                           </p>
                        </div>
                        <div>
                           <p className="text-muted-foreground">Estado</p>
                           <p className="font-medium text-foreground">{getStatusText(ticket?.status)}</p>
                        </div>
                     </div>
                  </div>
               ))}

               {myTickets?.length === 0 && (
                  <div className="text-center py-12">
                     <Icon name="Ticket" size={48} className="text-muted-foreground mx-auto mb-4" />
                     <h3 className="text-lg font-semibold text-foreground mb-2">No tienes tickets</h3>
                     <p className="text-muted-foreground mb-4">
                        Crea tu primer ticket para obtener ayuda con cualquier problema
                     </p>
                     <Button onClick={() => setActiveTab("create")}>Crear Primer Ticket</Button>
                  </div>
               )}
            </div>
         )}

         {/* Ticket Details Tab */}
         {!isLoading && activeTab === "details" && selectedTicket && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
               <div className="p-6 border-b border-border bg-muted/30 relative">
                  <div className="flex flex-col items-start mb-4 pr-24">
                     <h3 className="text-xl font-bold text-foreground mb-4 break-words">
                        {selectedTicket.responses?.Asunto || selectedTicket.formTitle}
                     </h3>

                     {/* Metadata Stack for Details */}
                     <div className="space-y-2 text-sm text-muted-foreground w-full">
                        <div className="flex items-center space-x-2">
                           <Icon name="Hash" size={14} className="flex-shrink-0" />
                           <span className="font-mono text-xs break-all">ID: {selectedTicket._id}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                           <Icon name="Tag" size={14} className="flex-shrink-0" />
                           <span>{selectedTicket.formTitle}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                           <Icon name="Calendar" size={14} className="flex-shrink-0" />
                           <span>{new Date(selectedTicket.createdAt).toLocaleDateString("es-ES")}</span>
                        </div>

                        <div className="pt-2">
                           <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}
                           >
                              {getStatusText(selectedTicket.status)}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Botón Cerrar: Absoluto Top Right */}
                  <div className="absolute top-6 right-6">
                     {/* Opción 1: Desktop con Icono */}
                     <div className="hidden sm:block">
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab("my-tickets")} iconName="X">
                           Cerrar
                        </Button>
                     </div>
                     {/* Opción 2: Mobile SIN Icono */}
                     <div className="block sm:hidden">
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab("my-tickets")}>
                           Cerrar
                        </Button>
                     </div>
                  </div>

                  <div className="bg-background p-4 rounded-md border border-border">
                     <p className="text-sm text-muted-foreground mb-1 font-medium">Descripción:</p>
                     <p className="text-foreground whitespace-pre-wrap">
                        {selectedTicket.responses?.Descripción || "Sin descripción"}
                     </p>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default TicketSystem;
