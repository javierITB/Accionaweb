export const createTaskSlice = (set, get) => ({
    tasks: [],
    taskLists: [],

    addTask: async (taskOrTitle, leadId = null) => {
        const newTask = typeof taskOrTitle === 'object'
            ? {
                completed: false,
                type: 'call',
                priority: 'medium',
                list_id: 'default',
                due_date: new Date().toISOString(),
                description: '',
                contact_id: taskOrTitle.contact_id || null,
                subtasks: [],
                tags: [],
                archived: false,
                assigned_to: taskOrTitle.assigned_to || get().currentUser?.id,
                due_date: new Date().toISOString(),
                end_date: null,
                ...taskOrTitle,
                id: Date.now()
            }
            : {
                id: Date.now(),
                title: taskOrTitle,
                completed: false,
                lead_id: leadId,
                type: 'call',
                priority: 'medium',
                list_id: 'default',
                due_date: new Date().toISOString(),
                end_date: null, // Default null (1 hour or default block)
                description: '',
                contact_id: null,
                subtasks: [],
                tags: [],
                archived: false,
                assigned_to: get().currentUser?.id
            };

        set(state => {
            const updates = { tasks: [newTask, ...state.tasks] };
            if (leadId) {
                const activity = {
                    id: `act-task-${Date.now()}`,
                    lead_id: leadId,
                    type: 'task',
                    content: `Tarea creada: ${newTask.title}`,
                    timestamp: new Date().toISOString(),
                    user: 'Demo User'
                };
                updates.activities = [activity, ...state.activities];
            }
            return updates;
        });
    },

    archiveTask: (taskId) => {
        set(state => ({
            tasks: state.tasks.map(t => t.id === taskId ? { ...t, archived: true } : t)
        }));
    },

    archiveAllCompleted: () => {
        set(state => ({
            tasks: state.tasks.map(t => (t.completed && !t.archived) ? { ...t, archived: true } : t)
        }));
    },

    toggleTask: async (taskId) => {
        set(state => {
            const task = state.tasks.find(t => t.id === taskId);
            const isCompleting = !task.completed;

            const updates = {
                tasks: state.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
            };

            if (task && task.lead_id && isCompleting) {
                const activity = {
                    id: `act-task-comp-${Date.now()}`,
                    lead_id: task.lead_id,
                    type: 'task_complete',
                    content: `Tarea completada: ${task.title}`,
                    timestamp: new Date().toISOString(),
                    user: 'Demo User'
                };
                updates.activities = [activity, ...state.activities];
            }
            return updates;
        });
    },

    updateTask: async (taskId, updates) => {
        set(state => ({
            tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
        }));
    },

    deleteTask: async (taskId) => {
        set(state => ({
            tasks: state.tasks.filter(t => t.id !== taskId)
        }));
    },

    addTaskList: async (name) => {
        const newList = { id: `list-${Date.now()}`, name, type: 'user' };
        set(state => ({ taskLists: [...state.taskLists, newList] }));
        return newList;
    },

    deleteTaskList: async (listId) => {
        if (listId === 'default') return;

        set(state => ({
            taskLists: state.taskLists.filter(l => l.id !== listId),
            tasks: state.tasks.map(t => t.list_id === listId ? { ...t, list_id: 'default' } : t)
        }));
    }
});
