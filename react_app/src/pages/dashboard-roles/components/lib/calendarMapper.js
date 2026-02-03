export const mapToCalendarEvents = (tasks, activities, contacts, companies = [], users = [], currentUser, filters, searchQuery = '') => {
    const { status, type, user } = filters;
    // Helper for accent-insensitive search
    const normalize = (str) => {
        return str
            ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
            : "";
    };

    const requestNormalized = normalize(searchQuery);

    const checkSearch = (t) => {
        if (!requestNormalized) return true;

        // Basic fields
        if (normalize(t.title).includes(requestNormalized)) return true;
        if (normalize(t.description).includes(requestNormalized)) return true;

        // Relation fields
        const contact = t.contact_id ? contacts.find(c => c.id === t.contact_id) : null;
        if (contact && normalize(contact.name).includes(requestNormalized)) return true;

        const company = contact?.company_id ? companies.find(c => c.id === contact.company_id) : null;
        if (company && normalize(company.name).includes(requestNormalized)) return true;

        return false;
    };

    const checkStatus = (t) => {
        if (status === 'all') return true;
        if (status === 'completed') return t.completed;
        if (status === 'pending') return !t.completed;
        if (status === 'overdue') return !t.completed && new Date(t.due_date) < new Date();
        return true;
    };

    const checkType = (tType) => {
        if (type === 'all') return true;
        return tType === type;
    };

    const checkUser = (t) => {
        if (user === 'all') return true;
        return t.assigned_to === currentUser?.id;
    };

    const PRIORITY_COLORS = {
        high: '#ef4444',   // red-500
        medium: '#f59e0b', // amber-500
        low: '#3b82f6',    // blue-500
        default: '#3b82f6' // fallback
    };

    const taskEvents = tasks
        .filter(t => !t.archived)
        .filter(t => checkStatus(t) && checkType(t.type) && checkUser(t) && checkSearch(t))
        .map(t => {
            const now = new Date();
            const dueDate = new Date(t.due_date);
            const endDate = t.end_date ? new Date(t.end_date) : dueDate;

            const isOverdue = !t.completed && endDate < now;
            // Use Emerald-500 (#10b981) for completed to make it look "Done/Success"
            const color = t.completed ? '#10b981' : (PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.default);

            // Map User
            const assignedUser = t.assigned_to ? users.find(u => u.id === t.assigned_to) : null;

            return {
                id: t.id,
                title: t.title || t.text,
                start: t.due_date,
                end: t.end_date || null,
                backgroundColor: color,
                borderColor: isOverdue ? '#ef4444' : color,
                className: `${t.completed ? 'opacity-90' : ''} ${isOverdue ? 'is-overdue' : ''}`,
                extendedProps: {
                    type: 'task',
                    taskType: t.type, // 'call', 'meeting', 'email', 'task'
                    description: t.description,
                    priority: t.priority,
                    contact: t.contact_id ? contacts.find(c => c.id === t.contact_id)?.name : null,
                    isOverdue,
                    completed: t.completed,
                    assignedTo: assignedUser ? { name: assignedUser.name, avatar: assignedUser.avatar } : null
                }
            };
        });

    // Activities (Meetings/Calls)
    const activityEvents = activities
        .filter(a => a.type === 'meeting' || a.type === 'call')
        .filter(a => {
            if (status === 'completed') return false;
            if (status === 'overdue') return false;
            return true;
        })
        .filter(a => checkType(a.type))
        .filter(a => {
            if (!requestNormalized) return true;
            return normalize(a.content).includes(requestNormalized);
        })
        .map(a => ({
            id: a.id,
            title: a.content,
            start: a.timestamp,
            backgroundColor: a.type === 'meeting' ? '#f97316' : '#8b5cf6',
            borderColor: a.type === 'meeting' ? '#f97316' : '#8b5cf6',
            extendedProps: {
                type: 'activity',
                taskType: a.type, // 'meeting' or 'call'
                details: a.content,
                // Activities usually don't have assigned_to in this model, but if they did...
                assignedTo: null
            }
        }));

    return [...taskEvents, ...activityEvents];
};
