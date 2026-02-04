import React, { useState, useRef, useEffect } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Icon from "../../../components/AppIcon"; // Importado para el selector
import DestinatariosSelector from "./DestinatariosSelector";
import { API_BASE_URL } from "../../../utils/api";

const AnuncioCreator = ({ onSuccess, permisos = {} }) => {
   const [loading, setLoading] = useState(false);
   const [isOpen, setIsOpen] = useState(false); // Para el dropdown de iconos
   const dropdownRef = useRef(null);

   const [formData, setFormData] = useState({
      titulo: "",
      descripcion: "",
      prioridad: 1,
      color: "#f5872dff",
      icono: "Edit", // Valor inicial para el selector
      actionUrl: "",
      enviarNotificacion: true,
      enviarCorreo: false,
      destinatarios: {
         tipo: "todos",
         filtro: { empresas: [], cargos: [], roles: [] },
         usuariosManuales: [],
      },
   });

   // Opciones de iconos para el administrador
   const opcionesIcono = [
      { id: "Edit", label: "Mensaje" },
      { id: "CheckCircle", label: "Aprobación" },
      { id: "HelpCircle", label: "Soporte" },
      { id: "FileText", label: "Formularios" },
      { id: "MessageCircle", label: "Sistema" },
   ];

   // Cerrar dropdown al hacer clic fuera
   useEffect(() => {
      const handleClickOutside = (event) => {
         if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
         }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!permisos.create_anuncios) return alert("No tienes permisos para crear anuncios");

      if (!formData.enviarNotificacion && !formData.enviarCorreo) {
         alert("Debes seleccionar al menos un método de envío");
         return;
      }

      if (formData.destinatarios.tipo === "manual" && formData.destinatarios.usuariosManuales.length === 0) {
         alert("Por favor, selecciona al menos un destinatario");
         return;
      }

      setLoading(true);

      try {
         const token = sessionStorage.getItem("token");

         // Mapeo para que el NotificationsCard agrupe correctamente sin duplicados
         const mapeoParaTarjeta = {
            Edit: "Edit", // Agrupa en Mensajes
            CheckCircle: "CheckCircle", // Agrupa en Aprobaciones
            HelpCircle: "paper", // Agrupa en Soporte (como comprobamos en BD)
            FileText: "FileText", // Agrupa en Formularios
            MessageCircle: "MessageCircle", // Agrupa en Sistema
         };

         const payload = {
            titulo: formData.titulo.trim(),
            descripcion: formData.descripcion.trim(),
            prioridad: formData.prioridad,
            color: formData.color,
            actionUrl: formData.actionUrl?.trim() || null,
            // Usamos el mapeo para enviar el valor compatible
            icono: mapeoParaTarjeta[formData.icono] || "paper",
            enviarNotificacion: Boolean(formData.enviarNotificacion),
            enviarCorreo: Boolean(formData.enviarCorreo),
            destinatarios: formData.destinatarios,
         };

         console.log("📤 Enviando anuncio (solo notificaciones):", payload);

         const response = await fetch(`${API_BASE_URL}/anuncios`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
         });

         const result = await response.json();

         if (result.success) {
            alert(`${result.message}`);
            if (onSuccess) onSuccess();
         } else {
            throw new Error(result.error || "Error al enviar anuncio");
         }
      } catch (error) {
         alert(`Error: ${error.message}`);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="bg-card rounded-2xl shadow-lg overflow-hidden border border-border">
         <div className="p-6 border-b border-border">
            <div className="flex justify-between items-center">
               <div>
                  <h2 className="text-2xl font-bold text-foreground">Crear Anuncio</h2>
                  <p className="text-muted-foreground">Configura el contenido y destinatarios</p>
               </div>
            </div>
         </div>

         <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-8">
               <div className="space-y-6">
                  <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
                     Contenido del Anuncio
                  </h3>

                  <div>
                     <label className="block text-sm font-medium mb-2 text-foreground">Título *</label>
                     <Input
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        placeholder="Asunto de la notificación"
                        required
                     />
                  </div>

                  <div>
                     <label className="block text-sm font-medium mb-2 text-foreground">Mensaje *</label>
                     <textarea
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        rows={5}
                        className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe el anuncio en detalle..."
                        required
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">Prioridad</label>
                        <select
                           value={formData.prioridad}
                           onChange={(e) => setFormData({ ...formData, prioridad: parseInt(e.target.value) })}
                           className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg"
                        >
                           <option value="1">Baja</option>
                           <option value="2">Media</option>
                           <option value="3">Alta</option>
                        </select>
                     </div>

                     {/* Selector de Icono agregado */}
                     <div className="relative" ref={dropdownRef}>
                        <label className="block text-sm font-medium mb-2 text-foreground">Icono de Notificación</label>
                        <button
                           type="button"
                           onClick={() => setIsOpen(!isOpen)}
                           className="w-full flex items-center justify-between px-3 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                           <div className="flex items-center gap-3">
                              <Icon name={formData.icono} size={18} className="text-muted-foreground" />
                              <span>{opcionesIcono.find((opt) => opt.id === formData.icono)?.label}</span>
                           </div>
                           <Icon name="ChevronDown" size={14} className="text-muted-foreground" />
                        </button>

                        {isOpen && (
                           <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                              {opcionesIcono.map((opcion) => (
                                 <div
                                    key={opcion.id}
                                    onClick={() => {
                                       setFormData({ ...formData, icono: opcion.id });
                                       setIsOpen(false);
                                    }}
                                    className={`flex items-center gap-3 px-3 py-2.5 hover:bg-muted cursor-pointer transition-colors ${
                                       formData.icono === opcion.id ? "bg-muted/50" : ""
                                    }`}
                                 >
                                    <Icon name={opcion.id} size={18} className="text-muted-foreground" />
                                    <span className="text-sm text-foreground">{opcion.label}</span>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">Color de notificación</label>
                        <div className="flex gap-2">
                           {["#f5872dff", "#45577eff", "#bb8900ff", "#dc2626ff", "#059669ff", "#7c3aedff"].map(
                              (color) => (
                                 <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? "border-foreground" : "border-transparent"}`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                 />
                              ),
                           )}
                        </div>
                     </div>

                     <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">
                           URL de acción (opcional)
                        </label>
                        <Input
                           value={formData.actionUrl}
                           onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                           placeholder="/ruta/destino"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                           Los usuarios serán redirigidos aquí al hacer clic
                        </p>
                     </div>
                  </div>
               </div>

               <div className="space-y-6 pt-6 border-t border-border">
                  <h3 className="text-lg font-medium text-foreground">Destinatarios</h3>
                  <DestinatariosSelector formData={formData} setFormData={setFormData} permisos={permisos} />
               </div>

               {(permisos.create_anuncios_web || permisos.create_anuncios_mail) && (
                  <div className="space-y-3 pt-6 border-t border-border">
                     <h3 className="text-lg font-medium text-foreground">Método de envío</h3>
                     <div className="space-y-2">
                        {permisos.create_anuncios_web && (
                           <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-muted rounded-lg">
                              <input
                                 type="checkbox"
                                 checked={formData.enviarNotificacion}
                                 onChange={(e) =>
                                    setFormData({
                                       ...formData,
                                       enviarNotificacion: e.target.checked,
                                    })
                                 }
                                 className="w-5 h-5 text-blue-600 bg-card border-border rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <div>
                                 <span className="text-sm font-medium text-foreground">
                                    Notificación en la plataforma
                                 </span>
                                 <p className="text-xs text-muted-foreground">
                                    Los usuarios verán la notificación en su panel
                                 </p>
                              </div>
                           </label>
                        )}

                        {permisos.create_anuncios_mail && (
                           <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-muted rounded-lg">
                              <input
                                 type="checkbox"
                                 checked={formData.enviarCorreo}
                                 onChange={(e) =>
                                    setFormData({
                                       ...formData,
                                       enviarCorreo: e.target.checked,
                                    })
                                 }
                                 className="w-5 h-5 text-blue-600 bg-card border-border rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <div>
                                 <span className="text-sm font-medium text-foreground">
                                    Enviar por correo electrónico
                                 </span>
                                 <p className="text-xs text-muted-foreground">
                                    Se enviará un email a los destinatarios seleccionados
                                 </p>
                              </div>
                           </label>
                        )}
                     </div>

                     {!formData.enviarNotificacion && !formData.enviarCorreo && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                           <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                              Debes seleccionar al menos un método de envío
                           </p>
                        </div>
                     )}
                  </div>
               )}

               {!permisos.create_anuncios ? (
                  <div className="flex justify-end space-x-3 pt-6 border-t border-border">
                     <Button type="button" onClick={() => window.history.back()} variant="outline" className="px-6">
                        Cancelar
                     </Button>
                     <Button type="submit" loading={loading} className="px-6 bg-blue-600 hover:bg-blue-700">
                        Enviar Anuncio
                     </Button>
                  </div>
               ) : (
                  <div className="flex justify-end space-x-3 pt-6 border-t border-border">
                     <Button type="button" onClick={() => window.history.back()} variant="outlineTeal" className="px-6">
                        Volver
                     </Button>
                  </div>
               )}
            </div>
         </form>
      </div>
   );
};

export default AnuncioCreator;
