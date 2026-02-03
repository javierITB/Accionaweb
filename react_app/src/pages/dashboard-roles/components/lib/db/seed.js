import { initDatabase, query, exec, beginTransaction, commit, rollback } from './database.js';
import {
    CompanyRepository,
    ContactRepository,
    StageRepository,
    LeadRepository,
    ActivityRepository,
    TaskRepository,
    CommentRepository
} from './repositories/index.js';

/**
 * Seed the database with mock data
 * Only runs if the database is empty
 */
export async function seedDatabase() {
    // Check if already seeded by checking if companies exist
    const existingCompanies = CompanyRepository.getAll();
    if (existingCompanies.length > 0) {
        console.log('⏭️  Database already seeded, skipping...');
        return;
    }

    console.log('🌱 Seeding database with mock data...');

    beginTransaction();
    try {
        // Seed Companies
        const companies = [
            {
                id: 'comp-1',
                name: 'Tech Corp',
                industry: 'Tecnología',
                size: '100-500 Empleados',
                website: 'www.techcorp.com',
                location: 'Ciudad de México, MX',
                rut: '76.123.456-1'
            },
            {
                id: 'comp-2',
                name: 'StartUp Inc',
                industry: 'SaaS',
                size: '10-50 Empleados',
                website: 'www.startupinc.io',
                location: 'Guadalajara, MX',
                rut: '77.234.567-2'
            },
            {
                id: 'comp-3',
                name: 'Mega Enterprise',
                industry: 'Manufactura',
                size: '+1000 Empleados',
                website: 'group.megaib.com',
                location: 'Monterrey, NL',
                rut: '78.345.678-3'
            },
            {
                id: 'comp-4',
                name: 'Global Logistics',
                industry: 'Logística',
                size: '500-1000 Empleados',
                website: 'www.globallog.com',
                location: 'Panamá City, PA',
                rut: '79.456.789-4'
            }
        ];

        for (const company of companies) {
            CompanyRepository.create(company);
        }

        // Seed Contacts
        const contacts = [
            { id: 'ct-1', company_id: 'comp-1', name: 'Juan Pérez', email: 'juan@techcorp.com', phone: '555-0101', role: 'CEO / Director', is_primary: true },
            { id: 'ct-2', company_id: 'comp-1', name: 'María García', email: 'maria@techcorp.com', phone: '555-0102', role: 'Gerente de TI', area: 'TI', is_primary: false },
            { id: 'ct-3', company_id: 'comp-2', name: 'Ana López', email: 'ana@startupinc.io', phone: '555-0201', role: 'CEO / Director', is_primary: true },
            { id: 'ct-4', company_id: 'comp-3', name: 'Carlos Ruiz', email: 'cruiz@mega.com', phone: '555-0301', role: 'Gerente Comercial', area: 'Ventas', is_primary: true },
            { id: 'ct-5', company_id: 'comp-3', name: 'Laura Sánchez', email: 'lsanchez@mega.com', phone: '555-0302', role: 'Gerente de Finanzas', area: 'Finanzas', is_primary: false },
            { id: 'ct-6', company_id: 'comp-4', name: 'Mario Bros', email: 'mario@globallog.com', phone: '555-0401', role: 'Analista', area: 'Operaciones', is_primary: true },
        ];

        for (const contact of contacts) {
            ContactRepository.create(contact);
        }

        // Seed Leads (Deals)
        const leads = [
            {
                id: 'deal-1',
                company_id: 'comp-1',
                title: 'Expansión de Licencias Q1',
                value: 12000,
                tags: ['VIP', 'Urgente'],
                source: 'LinkedIn',
                campaign: 'Q1 Outreach',
                budget: 15000,
                estimated_close_date: '2024-03-30',
                stage_id: 'stage-1',
                probability: 30
            },
            {
                id: 'deal-2',
                company_id: 'comp-2',
                title: 'Implementación Inicial',
                value: 8500,
                tags: ['Referido'],
                source: 'Referral',
                campaign: '',
                budget: 9000,
                estimated_close_date: '2024-02-15',
                stage_id: 'stage-2',
                probability: 45
            },
            {
                id: 'deal-3',
                company_id: 'comp-3',
                title: 'Renovación Corporativa',
                value: 120000,
                tags: ['Renovación'],
                source: 'Existing Client',
                campaign: 'Renewal Program',
                budget: 125000,
                estimated_close_date: '2024-12-31',
                stage_id: 'stage-3',
                probability: 95
            },
            {
                id: 'deal-4',
                company_id: 'comp-4',
                title: 'Piloto Logística',
                value: 75000,
                tags: ['Nuevo', 'Piloto'],
                source: 'Webinar',
                campaign: 'Logistics Summit',
                budget: 80000,
                estimated_close_date: '2024-04-15',
                stage_id: 'stage-1',
                probability: 10
            }
        ];

        for (const lead of leads) {
            LeadRepository.create(lead);
        }

        // Seed Activities
        const activities = [
            { id: 'act-1', lead_id: 'deal-3', type: 'system', content: 'Lead creado', timestamp: '2023-11-01T09:00:00Z', user: 'System' },
            { id: 'act-2', lead_id: 'deal-3', type: 'call', content: 'Llamada inicial de descubrimiento', timestamp: '2023-11-02T10:00:00Z', user: 'Demo User' },
            { id: 'act-3', lead_id: 'deal-3', type: 'email', content: 'Propuesta enviada por correo', timestamp: '2023-11-05T14:30:00Z', user: 'Demo User' },
        ];

        for (const activity of activities) {
            ActivityRepository.create(activity);
        }

        // Seed Tasks
        const tasks = [
            { lead_id: 'deal-1', title: 'Llamar a Tech Corp para seguimiento', completed: false, type: 'call' },
            { lead_id: 'deal-2', title: 'Enviar propuesta a StartUp Inc', completed: true, type: 'email' },
            { lead_id: null, title: 'Actualizar precios Q1', completed: false, type: 'call' },
        ];

        for (const task of tasks) {
            TaskRepository.create(task);
        }

        commit();
        console.log('✅ Database seeded successfully');
    } catch (error) {
        rollback();
        console.error('❌ Error seeding database:', error);
        throw error;
    }
}
