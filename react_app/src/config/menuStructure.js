export const MENU_STRUCTURE = [
   {
      name: "Gestión Principal",
      icon: "LayoutDashboard",
      isAccordion: true,
      children: [
         { name: "Solicitudes de Clientes", path: "/RespuestasForms", icon: "FileText", permission: "view_solicitudes_clientes" },
         { name: "Solicitudes a Cliente", path: "/Solicitudes", icon: "Pencil", permission: "view_solicitudes_a_cliente" },
         { name: "Tickets", path: "/Tickets", icon: "FileText", permission: "view_tickets" },
         { name: "Domicilio Virtual", path: "/DomicilioVirtual", icon: "Home", permission: "view_domicilio_virtual" },
      ]
   },
   {
      name: "Rendimiento",
      path: "/dashboard-home",
      icon: "BarChart2",
      permission: "view_rendimiento"
   },
   {
      name: "Configuración",
      icon: "Settings",
      isAccordion: true,
      children: [
         { name: "Formularios", path: "/form-center", icon: "FileText", permission: "view_formularios" },
         { name: "Plantillas", path: "/template-builder", icon: "FileText", permission: "view_plantillas" },
         { name: "Config. Tickets", path: "/config-tickets", icon: "Settings", permission: "view_configuracion_tickets" },
         { name: "Anuncios", path: "/anuncios", icon: "Megaphone", permission: "view_anuncios" },
      ]
   },
   {
      name: "Administración",
      icon: "Shield",
      isAccordion: true,
      children: [
         { name: "Usuarios", path: "/users", icon: "User", permission: "view_usuarios" },
         { name: "Empresas", path: "/empresas", icon: "Building2", permission: "view_empresas" },
         { name: "Gestor Empresas", path: "/gestor-empresas", icon: "Building2", permission: "view_gestor_empresas" },
         { name: "Gestor de Roles", path: "/gestor-roles", icon: "Users", permission: "view_gestor_roles" },
         { name: "Gestor Notificaciones", path: "/config-notificaciones", icon: "Bell", permission: "view_gestor_notificaciones" },
         { name: "Registro de cambios", path: "/registro-cambios", icon: "FileText", permission: "view_registro_cambios" },
         { name: "Registro de ingresos", path: "/registro-ingresos", icon: "LogIn", permission: "view_registro_ingresos" },
      ]
   },
];