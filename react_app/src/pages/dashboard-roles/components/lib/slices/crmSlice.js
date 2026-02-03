export const createCrmSlice = (set, get) => ({
    leads: [],
    companies: [],
    contacts: [],
    stages: [],
    activities: [],

    // Helper: Add Activity
    addActivity: async (activity) => {
        set(state => ({
            activities: [{
                id: `act-${Date.now()}-${Math.random()}`,
                timestamp: new Date().toISOString(),
                user: get().currentUser?.name || 'Sistema',
                ...activity
            }, ...state.activities]
        }));
    },

    updateLeadStage: async (leadId, newStageId) => {
        set((state) => {
            const lead = state.leads.find(l => l.id === leadId);
            if (!lead) return state;

            const oldStageId = lead.stage_id;
            const newHistoryEntry = {
                from_stage_id: oldStageId,
                to_stage_id: newStageId,
                timestamp: new Date().toISOString(),
                user: get().currentUser?.name || 'Sistema'
            };

            const fromStageName = state.stages.find(s => s.id === oldStageId)?.name || 'Anterior';
            const toStageName = state.stages.find(s => s.id === newStageId)?.name || 'Nuevo';

            const newActivity = {
                id: `act-${Date.now()}`,
                lead_id: leadId,
                type: 'stage_change',
                content: `Cambió de etapa: ${fromStageName} → ${toStageName}`,
                timestamp: new Date().toISOString(),
                user: get().currentUser?.name || 'Sistema'
            };

            const isClosed = newStageId === 'stage-4' || newStageId === 'stage-5';

            return {
                leads: state.leads.map(l =>
                    l.id === leadId
                        ? {
                            ...l,
                            stage_id: newStageId,
                            closed_at: isClosed ? new Date().toISOString() : (l.closed_at && !isClosed ? null : l.closed_at),
                            stage_history: [newHistoryEntry, ...(l.stage_history || [])]
                        }
                        : l
                ),
                activities: [newActivity, ...state.activities]
            };
        })
    },

    addLead: async (leadData) => {
        try {
            const { contact_id, company_id, ...data } = leadData;
            let finalContactId = contact_id;
            let finalCompanyId = company_id;

            // 1. Logic to handle Company
            if (!finalCompanyId) {
                const newCompanyId = `comp-${Date.now()}`;
                const newCompany = {
                    id: newCompanyId,
                    name: data.business_name || 'Sin Empresa',
                    industry: 'Sin definir',
                    size: 'Sin definir',
                    website: '',
                    location: 'Sin definir',
                    created_at: new Date().toISOString()
                };
                set(state => ({ companies: [...state.companies, newCompany] }));
                finalCompanyId = newCompanyId;
            }

            // 2. Logic to handle Contact
            if (!finalContactId) {
                const newContactId = `ct-${Date.now()}`;
                const newContact = {
                    id: newContactId,
                    company_id: finalCompanyId,
                    name: data.contact_name || 'Sin Nombre',
                    email: data.email,
                    phone: data.phone,
                    role: 'Principal',
                    is_primary: true
                };
                set(state => ({ contacts: [...state.contacts, newContact] }));
                finalContactId = newContactId;
            }

            // 3. Create Deal Linked
            const title = data.title || `Oportunidad - ${data.business_name}`;
            const newDeal = {
                ...data,
                title,
                value: Number(data.value),
                tags: data.tags || [],
                source: data.source || 'Direct',
                campaign: data.campaign || '',
                budget: data.budget || 0,
                estimated_close_date: data.estimated_close_date || null,
                assigned_to: data.assigned_to || get().currentUser?.id,
                id: `deal-${Date.now()}`,
                company_id: finalCompanyId,
                contact_id: finalContactId,
                created_at: new Date().toISOString(),
                profiles: { avatar_url: null },
                comments: [],
                probability: 20,
                business_name: data.business_name || 'Sin Empresa',
                contact_name: data.contact_name || 'Sin Nombre',
                stage_history: [{
                    from_stage_id: null,
                    to_stage_id: data.stage_id,
                    timestamp: new Date().toISOString(),
                    user: get().currentUser?.name || 'Sistema'
                }],
                closed_at: (data.stage_id === 'stage-4' || data.stage_id === 'stage-5') ? new Date().toISOString() : null
            };

            const newActivity = {
                id: `act-create-${Date.now()}`,
                lead_id: newDeal.id,
                type: 'system',
                content: 'Lead creado',
                timestamp: new Date().toISOString(),
                user: 'Demo User'
            };

            set((state) => ({
                leads: [...state.leads, newDeal],
                activities: [newActivity, ...state.activities]
            }));

            console.log('✅ Lead created linked:', newDeal.id);
            return { error: null, data: newDeal };
        } catch (error) {
            console.error(error);
            return { error, data: null };
        }
    },

    updateLead: async (leadId, updates) => {
        set((state) => ({
            leads: state.leads.map(lead =>
                lead.id === leadId ? { ...lead, ...updates } : lead
            )
        }))
    },

    rateSource: async (leadId, rating) => {
        const lead = get().leads.find(l => l.id === leadId);
        if (!lead) return;

        set((state) => ({
            leads: state.leads.map(l =>
                l.id === leadId ? { ...l, source_quality: rating } : l
            ),
            activities: [{
                id: `act-rate-${Date.now()}`,
                lead_id: leadId,
                type: 'system',
                content: `Fuente "${lead.source}" calificada con ${rating} estrellas`,
                timestamp: new Date().toISOString(),
                user: 'Demo User'
            }, ...state.activities]
        }));
    },

    updateCompany: async (companyId, updates) => {
        set((state) => ({
            companies: state.companies.map(c =>
                c.id === companyId ? { ...c, ...updates } : c
            ),
            leads: state.leads.map(l => {
                if (l.company_id === companyId && updates.name) {
                    return { ...l, business_name: updates.name };
                }
                return l;
            })
        }))
    },

    addContact: async (contact) => {
        const currentUser = get().currentUser;
        const newContact = {
            ...contact,
            id: `ct-${Date.now()}`,
            created_by: currentUser?.id || 'system',
            created_at: new Date().toISOString()
        };
        set(state => ({ contacts: [...state.contacts, newContact] }));
        return newContact;
    },

    updateContact: async (contactId, updates) => {
        set((state) => ({
            contacts: state.contacts.map(c =>
                c.id === contactId ? { ...c, ...updates } : c
            ),
            leads: state.leads.map(l => {
                const contact = state.contacts.find(c => c.id === contactId);
                if (contact && l.company_id === contact.company_id && contact.is_primary && updates.name) {
                    return { ...l, contact_name: updates.name, email: updates.email || l.email, phone: updates.phone || l.phone };
                }
                return l;
            })
        }))
    },

    deleteContact: async (contactId) => {
        set(state => ({
            contacts: state.contacts.map(c =>
                c.id === contactId
                    ? { ...c, deleted: true, deleted_at: new Date().toISOString() }
                    : c
            )
        }));
    },

    restoreContact: async (contactId) => {
        set(state => ({
            contacts: state.contacts.map(c =>
                c.id === contactId
                    ? { ...c, deleted: false, deleted_at: null }
                    : c
            )
        }));
    },

    addCompany: async (company) => {
        const newCompany = {
            ...company,
            id: `comp-${Date.now()}`,
            created_at: new Date().toISOString()
        };
        set(state => ({ companies: [...state.companies, newCompany] }));
        return newCompany;
    },

    deleteCompany: async (companyId) => {
        set(state => ({
            companies: state.companies.filter(c => c.id !== companyId),
            contacts: state.contacts.filter(c => c.company_id !== companyId),
        }));
    },

    addComment: async (leadId, text) => {
        const newComment = {
            id: `comment-${Date.now()}`,
            lead_id: leadId,
            content: text,
            created_at: new Date().toISOString(),
            user_name: get().currentUser?.name || 'Sistema'
        };

        const newActivity = {
            id: `act-comment-${Date.now()}`,
            lead_id: leadId,
            type: 'note',
            content: `Nota añadida: "${text}"`,
            timestamp: new Date().toISOString(),
            user: get().currentUser?.name || 'Sistema'
        };

        set((state) => ({
            leads: state.leads.map(lead =>
                lead.id === leadId
                    ? { ...lead, comments: [newComment, ...(lead.comments || [])] }
                    : lead
            ),
            activities: [newActivity, ...state.activities]
        }))
    },

    reassignContacts: async (contactIds, newSellerId) => {
        set(state => {
            const newOwner = state.users.find(u => u.id === newSellerId);
            const currentUser = state.currentUser;

            const updatedContacts = state.contacts.map(c =>
                contactIds.includes(c.id)
                    ? { ...c, created_by: newSellerId }
                    : c
            );

            const newActivities = contactIds.map(cid => {
                const contact = state.contacts.find(c => c.id === cid);
                const oldOwner = state.users.find(u => u.id === contact.created_by);

                return {
                    id: `act-reassign-${Date.now()}-${cid}`,
                    lead_id: null,
                    type: 'system',
                    content: `Contacto reasignado: "${contact.name}" de ${oldOwner?.name || 'Sistema'} a ${newOwner?.name}`,
                    timestamp: new Date().toISOString(),
                    user: currentUser?.name || 'Admin',
                    details: {
                        from: contact.created_by,
                        to: newSellerId
                    }
                };
            });

            const newNotification = {
                id: `notif-${Date.now()}`,
                user_id: newSellerId,
                title: 'Nuevos Contactos Asignados',
                message: `Se te han asignado ${contactIds.length} nuevos contactos por ${currentUser?.name || 'Administración'}.`,
                read: false,
                created_at: new Date().toISOString(),
                type: 'assignment'
            };

            return {
                contacts: updatedContacts,
                activities: [...newActivities, ...state.activities],
                notifications: [newNotification, ...(state.notifications || [])]
            };
        });
    }
});
