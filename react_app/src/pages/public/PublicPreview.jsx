import React, { useState, useEffect } from 'react';
import PublicRequestDetails from './components/PublicRequestDetails';
import PublicMessageView from './components/PublicMessageView';
import Icon from '../../components/AppIcon';
import { API_BASE_URL, apiFetch } from '../../utils/api';

const PublicPreview = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const id = urlParams.get('id');

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError("ID no proporcionado");
                setLoading(false);
                return;
            }

            try {
                const res = await apiFetch(`${API_BASE_URL}/respuestas/${id}`);
                if (!res.ok) throw new Error("No se pudo cargar la información de la solicitud.");

                const data = await res.json();

                if (data.formId) {
                    try {
                        const formRes = await apiFetch(`${API_BASE_URL}/forms/${data.formId}`);
                        if (formRes.ok) {
                            const formData = await formRes.json();
                            data.formDef = formData;
                        }
                    } catch (formErr) {
                        console.warn("Could not fetch form definition:", formErr);
                    }
                }

                setRequest(data);
            } catch (err) {
                console.error(err);
                setError("Error cargando la solicitud. Puede que no exista o el enlace sea incorrecto.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Icon name="Loader2" size={32} className="animate-spin text-accent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
                <Icon name="AlertCircle" size={48} className="text-error mb-4" />
                <h1 className="text-xl font-bold mb-2">Error</h1>
                <p className="text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center">
            {type === 'messages' && (
                <div className="w-full max-w-2xl bg-white shadow-xl flex flex-col h-screen relative">
                    <PublicMessageView
                        isOpen={true}
                        onClose={() => { }}
                        request={request}
                        formId={id}
                    />
                </div>
            )}

            {type === 'details' && (
                <div className="w-full max-w-4xl bg-white shadow-xl flex flex-col h-screen relative">
                    <PublicRequestDetails
                        request={request}
                    />
                </div>
            )}

            {!['messages', 'details'].includes(type) && (
                <p className="text-muted-foreground p-4">Tipo de vista no válido.</p>
            )}
        </div>
    );
};

export default PublicPreview;
