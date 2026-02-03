export const MOCK_COMPANIES = [
    { id: 'comp-1', name: 'Tech Corp', industry: 'Tecnología', size: '100-500 Empleados', website: 'www.techcorp.com', location: 'Ciudad de México, MX', rut: '76.123.456-1', created_at: '2023-01-15T10:00:00Z' },
    { id: 'comp-2', name: 'StartUp Inc', industry: 'SaaS', size: '10-50 Empleados', website: 'www.startupinc.io', location: 'Guadalajara, MX', rut: '77.234.567-2', created_at: '2023-06-20T14:30:00Z' },
    { id: 'comp-3', name: 'Mega Enterprise', industry: 'Manufactura', size: '+1000 Empleados', website: 'group.megaib.com', location: 'Monterrey, NL', rut: '78.345.678-3', created_at: '2022-11-05T09:15:00Z' },
    { id: 'comp-4', name: 'Global Logistics', industry: 'Logística', size: '500-1000 Empleados', website: 'www.globallog.com', location: 'Panamá City, PA', rut: '79.456.789-4', created_at: '2023-03-10T11:20:00Z' }
];

export const MOCK_CONTACTS = [
    { id: 'ct-1', company_id: 'comp-1', name: 'Juan Pérez', email: 'juan@techcorp.com', phone: '555-0101', role: 'CEO / Director', is_primary: true, created_by: 'u-3', linkedin: 'https://linkedin.com/in/juanperez', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), source: 'LinkedIn' },
    { id: 'ct-2', company_id: 'comp-1', name: 'María García', email: 'maria@techcorp.com', phone: '555-0102', role: 'Gerente de TI', is_primary: false, created_by: 'u-3', linkedin: '', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), source: 'Referral' },
    { id: 'ct-3', company_id: 'comp-2', name: 'Ana López', email: 'ana@startupinc.io', phone: '555-0201', role: 'CEO / Director', is_primary: true, created_by: 'u-4', linkedin: 'https://linkedin.com/in/analopez', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), source: 'Web' },
    { id: 'ct-4', company_id: 'comp-3', name: 'Carlos Ruiz', email: 'cruiz@mega.com', phone: '555-0301', role: 'Gerente Comercial', is_primary: true, created_by: 'u-1', linkedin: '', created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), source: 'Event' },
    { id: 'ct-5', company_id: 'comp-3', name: 'Laura Sánchez', email: 'lsanchez@mega.com', phone: '555-0302', role: 'Gerente de Finanzas', is_primary: false, created_by: 'u-6', linkedin: '', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), source: 'Event' },
    { id: 'ct-6', company_id: 'comp-4', name: 'Mario Bros', email: 'mario@globallog.com', phone: '555-0401', role: 'Analista', is_primary: true, created_by: 'u-3', linkedin: 'https://linkedin.com/in/mariobros', created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), source: 'LinkedIn' },
];

export const MOCK_STAGES = [
    { id: 'stage-1', name: 'Nuevo Lead', position: 1 },
    { id: 'stage-2', name: 'Contactado', position: 2 },
    { id: 'stage-3', name: 'Negociación', position: 3 },
    { id: 'stage-4', name: 'Cerrado', position: 4 },
    { id: 'stage-5', name: 'Perdido', position: 5 },
];

export const MOCK_DEALS = [
    { id: 'deal-1', company_id: 'comp-1', title: 'Expansión de Licencias Q1', value: 12000, tags: ['VIP', 'Urgente'], source: 'LinkedIn', campaign: 'Q1 Outreach', budget: 15000, estimated_close_date: '2024-03-30', stage_id: 'stage-1', probability: 30, comments: [], assigned_to: 'u-3', created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'deal-2', company_id: 'comp-2', title: 'Implementación Inicial', value: 8500, tags: ['Referido'], source: 'Referral', campaign: '', budget: 9000, estimated_close_date: '2024-02-15', stage_id: 'stage-2', probability: 45, comments: [], assigned_to: 'u-4', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'deal-3', company_id: 'comp-3', title: 'Renovación Corporativa', value: 120000, tags: ['Renovación'], source: 'Existing Client', campaign: 'Renewal Program', budget: 125000, estimated_close_date: '2024-12-31', stage_id: 'stage-3', probability: 95, comments: [], assigned_to: 'u-1', created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'deal-4', company_id: 'comp-4', title: 'Piloto Logística', value: 75000, tags: ['Nuevo', 'Piloto'], source: 'Webinar', campaign: 'Logistics Summit', budget: 80000, estimated_close_date: '2024-04-15', stage_id: 'stage-1', probability: 10, comments: [], assigned_to: 'u-3', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'deal-5', company_id: 'comp-1', title: 'Licencia Anual 2023', value: 25000, tags: ['Cerrado'], source: 'LinkedIn', campaign: 'Q1', budget: 25000, estimated_close_date: '2023-12-15', stage_id: 'stage-4', probability: 100, comments: [], assigned_to: 'u-3', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'deal-6', company_id: 'comp-2', title: 'Proyecto Perdido', value: 5000, tags: ['Perdido'], source: 'Web', campaign: '', budget: 5000, estimated_close_date: '2023-11-20', stage_id: 'stage-5', probability: 0, comments: [], assigned_to: 'u-4', created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() }
];

export const MOCK_USERS = [
    { id: 'u-1', name: 'Juan Pérez', email: 'juan@boosted.com', role: 'admin', status: 'active', avatar: null, team_id: 'team-1', last_active: '2026-01-20T17:30:00Z', joined_at: '2025-01-15T09:00:00Z' },
    { id: 'u-2', name: 'María García', email: 'maria@boosted.com', role: 'manager', status: 'active', avatar: null, team_id: 'team-1', last_active: '2026-01-20T16:45:00Z', joined_at: '2025-02-01T10:00:00Z' },
    { id: 'u-3', name: 'Carlos López', email: 'carlos@boosted.com', role: 'sales', status: 'active', avatar: null, team_id: 'team-1', last_active: '2026-01-20T14:20:00Z', joined_at: '2025-03-10T11:30:00Z' },
    { id: 'u-4', name: 'Ana Martínez', email: 'ana@boosted.com', role: 'sales', status: 'active', avatar: null, team_id: 'team-2', last_active: '2026-01-19T18:00:00Z', joined_at: '2025-04-05T09:15:00Z' },
    { id: 'u-5', name: 'Pedro Silva', email: 'pedro@boosted.com', role: 'analyst', status: 'active', avatar: null, team_id: null, last_active: '2026-01-20T10:00:00Z', joined_at: '2025-05-20T14:00:00Z' },
    { id: 'u-6', name: 'Luis Gómez', email: 'luis@boosted.com', role: 'sales', status: 'pending', avatar: null, team_id: 'team-2', last_active: null, joined_at: '2026-01-20T12:00:00Z' },
    { id: 'u-7', name: 'Roberto Díaz', email: 'roberto@boosted.com', role: 'sales', status: 'inactive', avatar: null, team_id: 'team-1', last_active: '2025-12-15T17:00:00Z', joined_at: '2025-01-10T09:00:00Z' },
];

export const MOCK_TEAMS = [
    { id: 'team-1', name: 'Equipo Comercial A', description: 'Ventas Enterprise', leader_id: 'u-2', members: ['u-1', 'u-2', 'u-3', 'u-7'] },
    { id: 'team-2', name: 'Equipo Comercial B', description: 'Ventas SMB', leader_id: null, members: ['u-4', 'u-6'] },
    { id: 'team-3', name: 'Soporte', description: 'Atención al Cliente', leader_id: null, members: [] }
];

export const MOCK_ROLES = [
    {
        id: 'admin',
        name: 'Administrador',
        description: 'Acceso total a todas las funciones',
        permissions: ['all']
    },
    {
        id: 'manager',
        name: 'Gerente',
        description: 'Gestión de equipos y reportes',
        permissions: ['view_dashboard', 'manage_users', 'manage_teams', 'view_contacts', 'edit_contacts', 'view_deals', 'edit_deals', 'view_reports']
    },
    {
        id: 'sales',
        name: 'Vendedor',
        description: 'Gestión de prospectos y tareas propias',
        permissions: ['view_dashboard', 'view_contacts', 'edit_contacts', 'create_contacts', 'view_deals', 'edit_deals', 'create_deals']
    },
    {
        id: 'analyst',
        name: 'Analista',
        description: 'Acceso a reportes y dashboards',
        permissions: ['view_dashboard', 'view_reports', 'view_deals']
    },
    {
        id: 'support',
        name: 'Soporte',
        description: 'Gestión de tickets y ayuda',
        permissions: ['view_contacts', 'view_dashboard']
    }
];

export const MOCK_ACTIVITIES = [
    {
        id: 'act-1',
        lead_id: 'deal-1',
        type: 'call',
        content: 'Llamada de seguimiento con Juan Pérez',
        timestamp: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        user: 'Demo User'
    },
    {
        id: 'act-2',
        lead_id: 'deal-2',
        type: 'email',
        content: 'Email enviado con propuesta inicial',
        timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        user: 'Demo User'
    }
];

export const MOCK_TASKS = [
    { id: 1, title: 'Llamar a Tech Corp', description: 'Discutir términos del contrato nuevo.', completed: false, lead_id: 'deal-1', type: 'call', priority: 'high', list_id: 'default', due_date: new Date(Date.now() + 86400000).toISOString() },
    { id: 2, title: 'Enviar propuesta a StartUp Inc', description: 'Incluir detalles de precios tier 3.', completed: false, lead_id: 'deal-2', type: 'email', priority: 'medium', list_id: 'default', due_date: new Date(Date.now() + 172800000).toISOString() },
    { id: 3, title: 'Preparar contrato de renovación', description: '', completed: true, lead_id: 'deal-3', type: 'task', priority: 'low', list_id: 'default', due_date: new Date(Date.now() - 86400000).toISOString() },
    { id: 4, title: 'Reunión de renovación', description: 'Reunión programada con cliente.', completed: false, lead_id: 'deal-3', type: 'meeting', priority: 'high', list_id: 'default', due_date: new Date(Date.now() + 259200000).toISOString() }
];

export const MOCK_TASK_LISTS = [
    { id: 'default', name: 'General', type: 'system' },
    { id: 'personal', name: 'Personal', type: 'user' },
    { id: 'work', name: 'Trabajo', type: 'user' }
];

export const MOCK_DOCUMENTS = [
    { id: 'doc-1', name: 'Contrato Marco.pdf', type: 'application/pdf', size: 1024 * 500, contact_id: 'ct-1', uploaded_by: 'Demo User', created_at: new Date(Date.now() - 86400000).toISOString(), url: '#' },
    { id: 'doc-2', name: 'Propuesta Comercial.pdf', type: 'application/pdf', size: 1024 * 200, contact_id: 'ct-2', uploaded_by: 'Demo User', created_at: new Date(Date.now() - 172800000).toISOString(), url: '#' },
    { id: 'doc-3', name: 'NDA.pdf', type: 'application/pdf', size: 1024 * 100, contact_id: 'ct-1', uploaded_by: 'Demo User', created_at: new Date(Date.now() - 200000000).toISOString(), url: '#' }
];
