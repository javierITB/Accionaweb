import React, { useState, useEffect } from "react";
import { X, Shield, Check, Loader2, Lock, UserCircle, LayoutGrid, ChevronRight } from "lucide-react";
import { apiFetch, API_BASE_URL } from "../../../utils/api";
import Button from "components/ui/Button";
const PERMISSION_GROUPS = {
   // --- CONTROLADORES RAÍZ ---
   acceso_panel_cliente: {
      label: "Panel: Cliente",
      tagg: "root",
      permissions: [{ id: "view_panel_cliente", label: "Habilitar Panel de Cliente" }],
   },
   acceso_panel_admin: {
      label: "Panel: Administración",
      tagg: "root",
      permissions: [{ id: "view_panel_admin", label: "Habilitar Panel de Administración" }],
   },
   // --- VISTAS TAGG: ADMIN ---
   solicitudes_clientes: {
      label: "Vista: Solicitudes de Clientes",
      tagg: "admin",
      permissions: [
         { id: "view_solicitudes_clientes", label: "Acceso a la vista" },
         { id: "delete_solicitudes_clientes", label: "Eliminar solicitudes de clientes" },
         { id: "view_solicitudes_clientes_details", label: "Acceso a detalles de solicitudes de clientes" },
         {
            id: "view_solicitudes_clientes_answers",
            label: "Ver respuestas de solicitud de clientes",
            dependency: "view_solicitudes_clientes_details",
         },
         {
            id: "view_solicitudes_clientes_shared",
            label: "Ver usuarios compartidos",
            dependency: "view_solicitudes_clientes_details",
         },

         { id: "view_solicitudes_clientes_messages", label: "Acceso a mensajes de solicitudes de clientes" },
         {
            id: "create_solicitudes_clientes_messages",
            label: "Crear mensajes de solicitudes de clientes",
            dependency: "view_solicitudes_clientes_messages",
         },
         {
            id: "create_solicitudes_clientes_messages_mail",
            label: "Crear mensajes de solicitudes de clientes con mail",
            dependency: "view_solicitudes_clientes_messages",
         },
         {
            id: "view_solicitudes_clientes_messages_admin",
            label: "Acceso a mensajes internos de solicitudes de clientes",
            dependency: "view_solicitudes_clientes_messages",
         },
         {
            id: "create_solicitudes_clientes_messages_admin",
            label: "Crear mensajes internos en solicitudes de clientes",
            dependency: "view_solicitudes_clientes_messages_admin",
         },

         {
            id: "view_solicitudes_clientes_attach",
            label: "Ver documento adjunto",
            dependency: "view_solicitudes_clientes_details",
         },
         {
            id: "download_solicitudes_clientes_attach",
            label: "Descargar documento adjunto",
            dependency: "view_solicitudes_clientes_attach",
         },
         {
            id: "preview_solicitudes_clientes_attach",
            label: "vista previa documento adjunto",
            dependency: "view_solicitudes_clientes_attach",
         },
         {
            id: "delete_solicitudes_clientes_attach",
            label: "Eliminar documento adjunto",
            dependency: "view_solicitudes_clientes_attach",
         },

         {
            id: "view_solicitudes_clientes_generated",
            label: "Ver documento generado",
            dependency: "view_solicitudes_clientes_details",
         },
         {
            id: "download_solicitudes_clientes_generated",
            label: "Descargar documento generado",
            dependency: "view_solicitudes_clientes_generated",
         },
         {
            id: "preview_solicitudes_clientes_generated",
            label: "vista previa documento generado",
            dependency: "view_solicitudes_clientes_generated",
         },
         {
            id: "regenerate_solicitudes_clientes_generated",
            label: "Regenerar documento",
            dependency: "view_solicitudes_clientes_generated",
         },

         {
            id: "view_solicitudes_clientes_send",
            label: "Ver documento enviado",
            dependency: "view_solicitudes_clientes_details",
         },
         {
            id: "download_solicitudes_clientes_send",
            label: "Descargar documento enviado",
            dependency: "view_solicitudes_clientes_send",
         },
         {
            id: "preview_solicitudes_clientes_send",
            label: "vista previa documento enviado",
            dependency: "view_solicitudes_clientes_send",
         },
         {
            id: "delete_solicitudes_clientes_send",
            label: "Eliminar documento enviado",
            dependency: "view_solicitudes_clientes_send",
         },

         {
            id: "view_solicitudes_clientes_signed",
            label: "Ver documento firmado",
            dependency: "view_solicitudes_clientes_details",
         },
         {
            id: "download_solicitudes_clientes_signed",
            label: "Descargar documento firmado",
            dependency: "view_solicitudes_clientes_signed",
         },
         {
            id: "preview_solicitudes_clientes_signed",
            label: "vista previa documento firmado",
            dependency: "view_solicitudes_clientes_signed",
         },
         {
            id: "delete_solicitudes_clientes_signed",
            label: "Eliminar documento firmado",
            dependency: "view_solicitudes_clientes_signed",
         },

            { id: 'edit_solicitudes_clientes_state', label: 'Editar estado de solicitud ', dependency: 'view_solicitudes_clientes_details' },
            { id: 'edit_solicitudes_clientes_finalize', label: 'Finalizar solicitud', dependency: 'edit_solicitudes_clientes_state' },
            { id: 'edit_solicitudes_clientes_archive', label: 'Archivar solicitud', dependency: 'edit_solicitudes_clientes_state' },
        ]
    },
    //check
    solicitudes_a_cliente: {
        label: 'Vista: Solicitudes a Cliente',
        tagg: 'admin',
        permissions: [
            { id: 'view_solicitudes_a_cliente', label: 'Acceso a la vista' },
            { id: 'create_solicitudes_a_cliente', label: 'Crear solicitudes a cliente', dependency: 'view_solicitudes_a_cliente' },
        ]
    },
    tickets: {
        label: 'Vista: Tickets',
        tagg: 'admin',
        permissions: [
            { id: 'view_tickets', label: 'Acceso a la vista' },
            { id: 'delete_tickets', label: 'Eliminar solicitudes de clientes' },
            { id: 'view_tickets_details', label: 'Acceso a detalles de tickets'},
            { id: 'view_tickets_answers', label: 'Ver tickets', dependency: 'view_tickets_details' },
            { id: 'accept_tickets_answers', label: 'Aceptar tickets', dependency: 'view_tickets_details' },

            { id: 'view_tickets_attach', label: 'Ver documento adjunto', dependency: 'view_tickets_details' },
            { id: 'download_tickets_attach', label: 'Descargar documento adjunto', dependency: 'view_tickets_attach' },
            { id: 'preview_tickets_attach', label: 'vista previa documento adjunto', dependency: 'view_tickets_attach' },

            { id: 'edit_tickets_state', label: 'Editar estado de ticket ', dependency: 'view_tickets_details' },
        ]
    },
    domicilio_virtual: {
        label: 'Vista: Domicilio Virtual',
        tagg: 'admin',
        permissions: [
            { id: 'view_solicitudes_clientes', label: 'Acceso a la vista' },
            { id: 'delete_solicitudes_clientes', label: 'Eliminar solicitudes de clientes' },
            { id: 'view_solicitudes_clientes_details', label: 'Acceso a detalles de solicitudes de clientes' },
            { id: 'view_solicitudes_clientes_answers', label: 'Ver respuestas de solicitud de clientes', dependency: 'view_solicitudes_clientes_details' },

            { id: 'view_solicitudes_clientes_attach', label: 'Ver documento adjunto', dependency: 'view_solicitudes_clientes_details' },
            { id: 'download_solicitudes_clientes_attach', label: 'Descargar documento adjunto', dependency: 'view_solicitudes_clientes_attach' },
            { id: 'preview_solicitudes_clientes_attach', label: 'vista previa documento adjunto', dependency: 'view_solicitudes_clientes_attach' },

            { id: 'view_solicitudes_clientes_generated', label: 'Ver documento generado', dependency: 'view_solicitudes_clientes_details'  },
            { id: 'download_solicitudes_clientes_generated', label: 'Descargar documento generado', dependency: 'view_solicitudes_clientes_generated' },
            { id: 'preview_solicitudes_clientes_generated', label: 'vista previa documento generado', dependency: 'view_solicitudes_clientes_generated' },
            { id: 'regenerate_solicitudes_clientes_generated', label: 'Regenerar documento', dependency: 'view_solicitudes_clientes_generated' },

            { id: 'edit_solicitudes_clientes_state', label: 'Editar estado de solicitud ', dependency: 'view_solicitudes_clientes_details' },
            
        ]
    },
    //check
    rendimiento: {
        label: 'Vista: Rendimiento',
        tagg: 'admin',
        permissions: [
            { id: 'view_rendimiento', label: 'Acceso a la vista' },
            { id: 'view_rendimiento_previo', label: 'Visualizar estadisticas de semanas anteriores', dependency: 'view_rendimiento' },
            { id: 'view_rendimiento_global', label: 'Visualizar estadisticas globales', dependency: 'view_rendimiento' },
        ]
    },
    //check
    formularios: {
        label: 'Vista: Formularios',
        tagg: 'admin',
        permissions: [
            { id: 'view_formularios', label: 'Acceso a la vista' },
            { id: 'create_formularios', label: 'Crear nuevos formularios' , dependency: 'view_formularios' },
            { id: 'edit_formularios', label: 'Editar formularios existentes', dependency: 'view_formularios' },
            { id: 'edit_formularios_propiedades', label: 'Editar propiedades de formularios existentes', dependency: 'edit_formularios' },
            { id: 'edit_formularios_preguntas', label: 'Editar preguntas de formularios existentes', dependency: 'edit_formularios' },
            { id: 'delete_formularios', label: 'Eliminar formularios', dependency: 'view_formularios' },
        ]
    },
    //check
    plantillas: {
        label: 'Vista: Plantillas',
        tagg: 'admin',
        permissions: [
            { id: 'view_plantillas', label: 'Acceso a la vista' },
            { id: 'create_plantillas', label: 'Crear nuevas plantillas', dependency: 'view_plantillas' },
            { id: 'copy_plantillas', label: 'Copiar plantilla existente', dependency: 'create_plantillas' },
            { id: 'edit_plantillas', label: 'Editar plantillas existentes', dependency: 'view_plantillas'},
            { id: 'delete_plantillas', label: 'Eliminar plantillas', dependency: 'view_plantillas' },
        ]
    },
    configuracion_tickets: {
        label: 'Vista: Configuración de Tickets',
        tagg: 'admin',
        permissions: [{ id: 'view_configuracion_tickets', label: 'Acceso a la vista' }]
    },
    
    anuncios: {
        label: 'Vista: Anuncios',
        tagg: 'admin',
        permissions: [
            { id: 'view_anuncios', label: 'Acceso a la vista' },
            { id: 'create_anuncios', label: 'Crear anuncios web', dependency: 'view_anuncios' },
            { id: 'create_anuncios_web', label: 'Crear anuncios web' , dependency: 'create_anuncios' },
            { id: 'create_anuncios_mail', label: 'Crear anuncios mail' , dependency: 'create_anuncios'},
            { id: 'create_anuncios_for_all', label: 'Crear anuncios para todos los usuarios' , dependency: 'create_anuncios'},
            { id: 'create_anuncios_filter', label: 'Crear anuncios para usuarios filtrados' , dependency: 'create_anuncios'},
            { id: 'create_anuncios_manual', label: 'Crear anuncios enviados manualmente' , dependency: 'create_anuncios'},
        ]
    },
    //check
    usuarios: {
        label: 'Vista: Usuarios',
        tagg: 'admin',
        permissions: [
            { id: 'view_usuarios', label: 'Acceso a la vista' },
            { id: 'edit_usuarios', label: 'Editar Usuarios', dependency: 'view_usuarios' },
            { id: 'delete_usuarios', label: 'Eliminar Usuarios', dependency: 'view_usuarios' },
            { id: 'create_usuarios', label: 'Crear Usuarios', dependency: 'view_usuarios' },
        ]
    },
    //check
    empresas: {
        label: 'Vista: Empresas',
        tagg: 'admin',
        permissions: [
            { id: 'view_empresas', label: 'Acceso a la vista' },
            { id: 'edit_empresas', label: 'Editar Empresas', dependency: 'view_empresas' },
            { id: 'delete_empresas', label: 'Eliminar Empresas', dependency: 'view_empresas' },
            { id: 'create_empresas', label: 'Crear Empresas', dependency: 'view_empresas' },
        ]
    },
    //check
    gestor_roles: {
        label: 'Vista: Gestor de Roles',
        tagg: 'admin',
        permissions: [
            { id: 'view_gestor_roles', label: 'Acceso a la vista' },
            { id: 'view_gestor_roles_details', label: 'Acceso a la vista detallada', dependency: 'view_gestor_roles' },
            { id: 'create_gestor_roles', label: 'Crear nuevos roles', dependency: 'view_gestor_roles' },
            { id: 'copy_gestor_roles', label: 'Duplicar roles existentes', dependency: 'view_gestor_roles' },
            { id: 'edit_gestor_roles', label: 'Editar roles existentes', dependency: 'view_gestor_roles_details' },
            { id: 'edit_gestor_roles_by_self', label: 'Editar rol propio', dependency: 'view_gestor_roles_details' },
            { id: 'view_gestor_roles_details_admin', label: 'Acceso a la vista detallada (admin)', dependency: 'view_gestor_roles' },
            { id: 'edit_gestor_roles_admin', label: 'Editar rol existente (Admin)', dependency: 'view_gestor_roles_details' },
            { id: 'delete_gestor_roles', label: 'Eliminar roles', dependency: 'view_gestor_roles' },
        ]
    },
    gestor_notificaciones: {
        label: 'Vista: Gestor de Notificaciones',
        tagg: 'admin',
        permissions: [
            { id: 'view_gestor_notificaciones', label: 'Acceso a la vista' },
            { id: 'view_gestor_notificaciones_details', label: 'Acceso a la vista detallada' },
            { id: 'delete_gestor_notificaciones', label: 'Eliminar notificaciones' },
        ]
    },
    registro_cambios: {
        label: 'Vista: Registro de Cambios',
        tagg: 'admin',
        permissions: [
            { id: 'view_registro_cambios', label: 'Acceso a la vista' },
            { id: 'view_registro_cambios_details', label: 'Acceso a la vista detallada', dependency: 'view_registro_cambios' }
        ]
    },
    registro_ingresos: {
        label: 'Vista: Registro de Ingresos',
        tagg: 'admin',
        permissions: [{ id: 'view_registro_ingresos', label: 'Acceso a la vista' }]
    },

    // --- VISTAS TAGG: CLIENTE ---
    home: {
        label: 'Vista: home',
        tagg: 'cliente',
        permissions: [
            { id: 'view_home', label: 'Acceso a la vista' }
        ]
    },
    perfil: {
        label: 'Vista: Perfil',
        tagg: 'cliente',
        permissions: [
            { id: 'view_perfil', label: 'Acceso a la vista' }
        ]
    },

    mis_solicitudes: {
        label: 'Vista: Mis solicitudes',
        tagg: 'cliente',
        permissions: [
            { id: 'view_mis_solicitudes', label: 'Acceso a la vista' },
            { id: 'share_mis_solicitudes', label: 'Compartir solicitudes' },
            { id: 'unshare_mis_solicitudes', label: 'Dejar de compartir solicitudes' },
            
        ]
    },
    formularios: {
        label: 'Vista: Formularios',
        tagg: 'cliente',
        permissions: [
            { id: 'view_formularios', label: 'Acceso a la vista' }
        ]
    },
    formulario: {
        label: 'Vista: Formulario',
        tagg: 'cliente',
        permissions: [
            { id: 'view_formulario', label: 'Acceso a la vista' }
        ]
    }
};


export function RoleModal({ isOpen, onClose, onSuccess, role = null, permisos}) {
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('admin'); 
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [],
        color: '#4f46e5'
    });

   const isClientPanelEnabled = formData.permissions.includes("view_panel_cliente");
   const isAdminPanelEnabled = formData.permissions.includes("view_panel_admin");

   useEffect(() => {
      if (role) {
         setFormData({
            id: role._id,
            name: role.name,
            description: role.description,
            permissions: role.permissions || [],
            color: role.color || "#4f46e5",
         });
      }
   }, [role, isOpen]);

   if (!isOpen) return null;

   const togglePermission = (permId) => {
      setFormData((prev) => {
         const hasPerm = prev.permissions.includes(permId);
         let newPerms = hasPerm ? prev.permissions.filter((p) => p !== permId) : [...prev.permissions, permId];

         // 1. Limpieza por Paneles Raíz
         if (permId === "view_panel_admin" && hasPerm) {
            const adminIds = Object.values(PERMISSION_GROUPS)
               .filter((g) => g.tagg === "admin")
               .flatMap((g) => g.permissions.map((p) => p.id));
            newPerms = newPerms.filter((p) => !adminIds.includes(p));
         }
         if (permId === "view_panel_cliente" && hasPerm) {
            const clienteIds = Object.values(PERMISSION_GROUPS)
               .filter((g) => g.tagg === "cliente")
               .flatMap((g) => g.permissions.map((p) => p.id));
            newPerms = newPerms.filter((p) => !clienteIds.includes(p));
         }

         // 2. Lógica de Dependencias: Si quito el padre, quito los hijos
         if (hasPerm) {
            const dependentPerms = Object.values(PERMISSION_GROUPS)
               .flatMap((g) => g.permissions)
               .filter((p) => p.dependency === permId)
               .map((p) => p.id);

            if (dependentPerms.length > 0) {
               newPerms = newPerms.filter((p) => !dependentPerms.includes(p));
            }
         }

         return { ...prev, permissions: newPerms };
      });
   };

   const toggleAllInTab = () => {
      const permsInTab = Object.values(PERMISSION_GROUPS)
         .filter((g) => g.tagg === activeTab)
         .flatMap((g) => g.permissions);

      // Filtramos solo los que no tienen dependencia o cuya dependencia ya está marcada
      const availablePerms = permsInTab
         .filter((p) => !p.dependency || formData.permissions.includes(p.dependency))
         .map((p) => p.id);
      const allSelected = availablePerms.every((id) => formData.permissions.includes(id));

      setFormData((prev) => ({
         ...prev,
         permissions: allSelected
            ? prev.permissions.filter((p) => !availablePerms.includes(p))
            : [...new Set([...prev.permissions, ...availablePerms])],
      }));
   };

   const handleSubmit = async () => {
      if (!formData.name) return;
      setIsSaving(true);
      try {
         const res = await apiFetch(`${API_BASE_URL}/roles`, {
            method: "POST",
            body: JSON.stringify(formData),
         });
         if (res.ok) onSuccess();
         else alert("Error al guardar el rol");
      } catch (error) {
         alert("Error de conexión");
      } finally {
         setIsSaving(false);
      }
   };

   const isAdminRole = role.name?.toLowerCase() === "administrador";

   const canEditAdmin = isAdminRole && permisos.edit_gestor_roles_admin;

   const itsMyRole = role.name?.toLowerCase() === sessionStorage.getItem('cargo').toLowerCase();

   const canEditOther = !isAdminRole && !itsMyRole && permisos.edit_gestor_roles;

   const canEdit = canEditAdmin || canEditOther;

   console.log("isAdminRole", isAdminRole)
   console.log("canEditAdmin", canEditAdmin)
   console.log("canEditOther", canEditOther)
   console.log("canEdit", canEdit)
   console.log("itsMyRole", itsMyRole)
   console.log("role", role)
   console.log("sessionStorage.getItem('cargo')", sessionStorage.getItem('cargo'))

   return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
         <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-border animate-in fade-in zoom-in duration-200">
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
               <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Shield size={20} className="text-accent" />
                  {role ? "Editar Rol / Cargo" : "Crear Nuevo Rol"}
               </h2>
               <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-lg"
               >
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               {/* INFO BÁSICA */}
               <div className="grid grid-cols-1 gap-4">
                  <input
                     type="text"
                     placeholder="Nombre del Cargo"
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                     className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-accent outline-none"
                  />
                  <textarea
                     placeholder="Descripción de funciones"
                     value={formData.description}
                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                     rows={2}
                     className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground resize-none focus:ring-2 focus:ring-accent outline-none"
                  />
               </div>

               <div className="h-px bg-border" />

               {/* TABS */}
               <div className="flex flex-col space-y-4">
                  <div className="flex p-1 bg-muted rounded-xl space-x-1">
                     <button
                        onClick={() => setActiveTab("admin")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === "admin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                     >
                        <Shield size={16} /> Administración
                     </button>
                     <button
                        onClick={() => setActiveTab("cliente")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === "cliente" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                     >
                        <UserCircle size={16} /> Cliente
                     </button>
                  </div>

                  <button
                     type="button"
                     onClick={toggleAllInTab}
                     className="flex items-center justify-center gap-2 py-2 px-4 border border-dashed border-accent/50 text-accent bg-accent/5 hover:bg-accent/10 rounded-xl text-xs font-bold transition-all"
                  >
                     <LayoutGrid size={14} />
                     Seleccionar / Desmarcar disponibles en esta pestaña
                  </button>
               </div>

               <div className="space-y-4">
                  {/* HABILITADOR DE PANEL */}
                  {Object.entries(PERMISSION_GROUPS)
                     .filter(([_, g]) => g.tagg === "root" && g.label.toLowerCase().includes(activeTab))
                     .map(([key, group]) => {
                        const isEnabled = formData.permissions.includes(group.permissions[0].id);
                        return (
                           <div
                              key={key}
                              onClick={() => togglePermission(group.permissions[0].id)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isEnabled ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border bg-muted/20 opacity-60"}`}
                           >
                              <span className="text-sm font-bold text-foreground">{group.label}</span>
                              <div
                                 className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isEnabled ? "bg-accent border-accent" : "border-muted-foreground"}`}
                              >
                                 {isEnabled && <Check size={12} strokeWidth={4} className="text-white" />}
                              </div>
                           </div>
                        );
                     })}

                  {/* VISTAS Y PERMISOS CON DEPENDENCIA */}
                  <div className="space-y-4">
                     {(activeTab === "admin" && isAdminPanelEnabled) ||
                     (activeTab === "cliente" && isClientPanelEnabled) ? (
                        Object.entries(PERMISSION_GROUPS)
                           .filter(([_, g]) => g.tagg === activeTab)
                           .map(([groupId, group]) => {
                              const ids = group.permissions.map((p) => p.id);
                              const isAllSelected = ids.every((id) => formData.permissions.includes(id));

                              return (
                                 <div
                                    key={groupId}
                                    className="rounded-xl border border-border bg-muted/10 overflow-hidden"
                                 >
                                    <div
                                       className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted/50"
                                       onClick={() => {
                                          // Al seleccionar todo el grupo, solo seleccionamos los que no tienen dependencia o ya tienen el padre marcado
                                          const availableIds = group.permissions
                                             .filter((p) => !p.dependency || formData.permissions.includes(p.dependency))
                                             .map((p) => p.id);
                                          setFormData((prev) => ({
                                             ...prev,
                                             permissions: isAllSelected
                                                ? prev.permissions.filter((p) => !ids.includes(p))
                                                : [...new Set([...prev.permissions, ...availableIds])],
                                          }));
                                       }}
                                    >
                                       <span className="text-xs font-bold text-foreground">{group.label}</span>
                                       <div
                                          className={`w-4 h-4 rounded border flex items-center justify-center ${isAllSelected ? "bg-accent border-accent text-white" : "bg-background border-border"}`}
                                       >
                                          {isAllSelected && <Check size={12} strokeWidth={3} />}
                                       </div>
                                    </div>
                                    <div className="p-3 grid grid-cols-1 gap-1">
                                       {group.permissions.map((perm) => {
                                          // VALIDACIÓN DE DEPENDENCIA PARA RENDERIZADO
                                          if (perm.dependency && !formData.permissions.includes(perm.dependency)) {
                                             return null;
                                          }

                                          const isSelected = formData.permissions.includes(perm.id);
                                          const isChild = !!perm.dependency;

                                          return (
                                             <label
                                                key={perm.id}
                                                className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${isChild ? "ml-6 border-l border-border pl-4" : ""}`}
                                             >
                                                {isChild && <ChevronRight size={12} className="text-muted-foreground" />}
                                                <div
                                                   className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? "bg-accent border-accent text-white" : "bg-background border-border"}`}
                                                >
                                                   {isSelected && <Check size={10} strokeWidth={3} />}
                                                </div>
                                                <span className="text-xs text-muted-foreground">{perm.label}</span>
                                                <input
                                                   type="checkbox"
                                                   className="hidden"
                                                   checked={isSelected}
                                                   onChange={() => togglePermission(perm.id)}
                                                />
                                             </label>
                                          );
                                       })}
                                    </div>
                                 </div>
                              );
                           })
                     ) : (
                        <div className="py-10 text-center border border-dashed border-border rounded-xl">
                           <Lock size={24} className="mx-auto mb-2 text-muted-foreground opacity-20" />
                           <p className="text-xs text-muted-foreground">
                              Habilita el panel superior para configurar vistas
                           </p>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-muted/10 shrink-0">
               {canEdit ? (
                  <>
                     <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground">
                        Cancelar
                     </button>

                     <button
                        onClick={handleSubmit}
                        disabled={isSaving || !formData.name}
                        className="px-8 py-2 bg-accent text-white text-sm font-bold rounded-lg disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-accent/20"
                     >
                        {isSaving && <Loader2 size={16} className="animate-spin" />}
                        {role ? "Actualizar Cargo" : "Guardar Cargo"}
                     </button>
                  </>
               ) : (
                  <Button
                     onClick={onClose}
                     className="px-4 py-2 text-sm font-medium text-muted-foreground"
                     variant="outlineTeal"
                  >
                     Cerrar
                  </Button>
               )}
            </div>
         </div>
      </div>
   );
}
