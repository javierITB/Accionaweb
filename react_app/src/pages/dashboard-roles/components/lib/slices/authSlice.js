export const createAuthSlice = (set, get) => ({
    users: [],
    teams: [],
    roles: [],
    currentUser: null,

    setCurrentUser: (user) => set({ currentUser: user }),

    addUser: async (userData) => {
        const newUser = {
            id: `u-${Date.now()}`,
            status: 'pending',
            joined_at: new Date().toISOString(),
            avatar: null,
            team_id: null,
            last_active: null,
            ...userData
        };
        set(state => ({ users: [...state.users, newUser] }));
        return newUser;
    },

    updateUser: async (userId, updates) => {
        set(state => ({
            users: state.users.map(u => u.id === userId ? { ...u, ...updates } : u)
        }));
    },

    deleteUser: async (userId) => {
        set(state => ({
            users: state.users.filter(u => u.id !== userId)
        }));
    },

    addTeam: async (teamData) => {
        const newTeam = {
            id: `team-${Date.now()}`,
            members: [],
            ...teamData
        };
        set(state => ({ teams: [...state.teams, newTeam] }));
        return newTeam;
    },

    updateTeam: async (teamId, updates) => {
        set(state => ({
            teams: state.teams.map(t => t.id === teamId ? { ...t, ...updates } : t)
        }));
    },

    deleteTeam: async (teamId) => {
        set(state => ({
            teams: state.teams.filter(t => t.id !== teamId),
            users: state.users.map(u => u.team_id === teamId ? { ...u, team_id: null } : u)
        }));
    },

    addRole: async (roleData) => {
        const newRole = {
            id: `role-${Date.now()}`,
            permissions: [],
            ...roleData
        };
        set(state => ({ roles: [...state.roles, newRole] }));
        return newRole;
    },

    updateRole: async (roleId, updates) => {
        set(state => ({
            roles: state.roles.map(r => r.id === roleId ? { ...r, ...updates } : r)
        }));
    },

    deleteRole: async (roleId) => {
        // Prevent deleting system roles if needed, for now allow all but admin maybe?
        if (roleId === 'admin') return;

        set(state => ({
            roles: state.roles.filter(r => r.id !== roleId)
        }));
    }
});
