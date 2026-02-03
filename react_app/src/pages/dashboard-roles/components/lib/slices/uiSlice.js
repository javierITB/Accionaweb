export const createUiSlice = (set, get) => ({
    notifications: [],
    isLoading: false,

    setLoading: (loading) => set({ isLoading: loading }),

    // Add other UI related actions here if needed
});
