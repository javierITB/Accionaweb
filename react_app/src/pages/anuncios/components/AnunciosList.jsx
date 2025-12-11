import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

// ELIMINA ESTA LÍNEA:
// import { apiRequest } from "../../../utils/api";

const AnunciosList = ({ onSelectAnuncio, onCreateNew }) => {
    const [anuncios, setAnuncios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        estado: 'todos'
    });

    useEffect(() => {
        fetchAnuncios();
    }, []);

    const fetchAnuncios = async () => {
        try {
            setLoading(true);

            // REEMPLAZA apiRequest con fetch directo (como en tu login)
            const token = sessionStorage.getItem('token');
            const email = sessionStorage.getItem('email');
            const cargo = sessionStorage.getItem('cargo');

            const response = await fetch('https://back-acciona.vercel.app/api/anuncios', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }

            const data = await response.json();
            // Ajusta según la estructura de tu respuesta
            setAnuncios(data.data || data || []);
        } catch (error) {
            console.error('Error fetching anuncios:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAnuncios = anuncios.filter(anuncio => {
        const matchesSearch = anuncio.titulo.toLowerCase().includes(filters.search.toLowerCase()) ||
            anuncio.descripcion.toLowerCase().includes(filters.search.toLowerCase());
        const matchesEstado = filters.estado === 'todos' || anuncio.estado === filters.estado;
        return matchesSearch && matchesEstado;
    });

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm">
            {/* Header con filtros */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Buscar anuncios..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full md:w-64"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <Select
                            value={filters.estado}
                            onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                            options={[
                                { value: 'todos', label: 'Todos los estados' },
                                { value: 'borrador', label: 'Borrador' },
                                { value: 'programado', label: 'Programado' },
                                { value: 'enviado', label: 'Enviado' },
                                { value: 'cancelado', label: 'Cancelado' }
                            ]}
                            className="w-48"
                        />

                        <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700">
                            Nuevo Anuncio
                        </Button>
                    </div>
                </div>
            </div>

            {/* Lista de anuncios */}
            <div className="divide-y divide-gray-200">
                {filteredAnuncios.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay anuncios</h3>
                        <p className="text-gray-500 mb-4">Crea tu primer anuncio para enviar notificaciones masivas.</p>
                        <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700">
                            Crear primer anuncio
                        </Button>
                    </div>
                ) : (
                    filteredAnuncios.map(anuncio => (
                        <AnuncioCard
                            key={anuncio._id}
                            anuncio={anuncio}
                            onClick={() => onSelectAnuncio(anuncio)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

const AnuncioCard = ({ anuncio, onClick }) => {
    const getEstadoBadge = (estado) => {
        const estados = {
            borrador: { color: 'bg-gray-100 text-gray-800', label: 'Borrador' },
            programado: { color: 'bg-yellow-100 text-yellow-800', label: 'Programado' },
            enviado: { color: 'bg-green-100 text-green-800', label: 'Enviado' },
            cancelado: { color: 'bg-red-100 text-red-800', label: 'Cancelado' }
        };
        const estadoInfo = estados[estado] || estados.borrador;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoInfo.color}`}>
                {estadoInfo.label}
            </span>
        );
    };

    return (
        <div
            onClick={onClick}
            className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full`}
                            style={{ backgroundColor: `${anuncio.color}20` }}>
                            <span className="text-lg" style={{ color: anuncio.color }}>
                                {anuncio.icono === 'paper' ? '📄' :
                                    anuncio.icono === 'alert' ? '⚠️' :
                                        anuncio.icono === 'info' ? 'ℹ️' : '📢'}
                            </span>
                        </span>
                        <div>
                            <h3 className="font-semibold text-gray-900">{anuncio.titulo}</h3>
                            <p className="text-sm text-gray-500 mt-1">{anuncio.descripcion}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                        <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(anuncio.fecha_creacion).toLocaleDateString()}
                        </span>

                        <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {anuncio.destinatarios_count || 0} destinatarios
                        </span>

                        <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Prioridad: {anuncio.prioridad}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {getEstadoBadge(anuncio.estado)}
                    <span className="text-xs text-gray-400">
                        ID: {anuncio._id?.slice(-6)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AnunciosList;