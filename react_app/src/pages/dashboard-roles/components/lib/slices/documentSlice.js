export const createDocumentSlice = (set, get) => ({
    documents: [],

    addDocument: async (doc) => {
        const newDoc = {
            id: `doc-${Date.now()}`,
            uploaded_by: 'Demo User',
            created_at: new Date().toISOString(),
            ...doc
        };

        const activity = {
            id: `act-doc-${Date.now()}`,
            lead_id: doc.contact_id ? null : null,
            type: 'note',
            content: `Documento subido: ${doc.name}`,
            timestamp: new Date().toISOString(),
            user: 'Demo User'
        };

        set(state => ({
            documents: [newDoc, ...state.documents],
            activities: [activity, ...state.activities]
        }));

        return newDoc;
    },

    deleteDocument: async (docId) => {
        set(state => ({
            documents: state.documents.filter(d => d.id !== docId)
        }));
    }
});
