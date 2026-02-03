import { useState, useEffect, useCallback } from 'react';

import {
    MOCK_COMPANIES,
    MOCK_CONTACTS,
    MOCK_STAGES,
    MOCK_DEALS,
    MOCK_USERS,
    MOCK_TEAMS,
    MOCK_ROLES,
    MOCK_ACTIVITIES,
    MOCK_TASKS,
    MOCK_TASK_LISTS,
    MOCK_DOCUMENTS
} from './constants/mockData';

export const useStore = () => {
    // --- ESTADO LOCAL ---
    const [roles, setRoles] = useState(MOCK_ROLES);
    const [users, setUsers] = useState(MOCK_USERS);
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- ACCIONES (Equivalente a las de Zustand) ---
    
    // Acción para eliminar roles (usada en tu RolesView)
    const deleteRole = useCallback(async (roleId) => {
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 300));
        setRoles(prev => prev.filter(r => r.id !== roleId));
    }, []);

    // Acción para cargar toda la data (inicialización)
    const fetchData = useCallback(async () => {
        setIsLoading(true);

        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 500));

        // Enriquecer leads (Lógica idéntica a la original)
        const enrichedLeads = MOCK_DEALS.map(deal => {
            const company = MOCK_COMPANIES.find(c => c.id === deal.company_id);
            const contact = MOCK_CONTACTS.find(c => c.company_id === deal.company_id && c.is_primary);

            const dealActivities = MOCK_ACTIVITIES.filter(a => a.lead_id === deal.id);
            const lastActivity = dealActivities.length > 0
                ? dealActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0].timestamp
                : (deal.created_at || new Date().toISOString());

            return {
                ...deal,
                business_name: company?.name || 'Unknown',
                contact_name: contact?.name || 'Unknown',
                email: contact?.email || '',
                phone: contact?.phone || '',
                profiles: { avatar_url: null },
                last_activity_at: lastActivity,
                stage_history: [{
                    from_stage_id: null,
                    to_stage_id: deal.stage_id,
                    timestamp: new Date().toISOString(),
                    user: 'Demo User'
                }]
            };
        });

        setLeads(enrichedLeads);
        // Aquí podrías setear el resto de estados si los necesitas
        setIsLoading(false);
        console.log('✅ Data loaded from React state (Mock)');
    }, []);

    // --- RETORNO DE DATOS Y FUNCIONES ---
    return {
        // Estado
        roles,
        users,
        leads,
        isLoading,
        companies: MOCK_COMPANIES,
        contacts: MOCK_CONTACTS,
        stages: MOCK_STAGES,
        activities: MOCK_ACTIVITIES,
        tasks: MOCK_TASKS,
        taskLists: MOCK_TASK_LISTS,
        documents: MOCK_DOCUMENTS,
        teams: MOCK_TEAMS,

        // Acciones
        fetchData,
        deleteRole,
        
        // Puedes agregar más acciones según necesites (updateRole, createRole, etc)
        setRoles,
        setUsers
    };
};