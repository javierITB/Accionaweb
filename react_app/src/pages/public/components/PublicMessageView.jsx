import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { API_BASE_URL } from '../../../utils/api';

const PublicMessageView = ({ isOpen, onClose, request, formId }) => {
    const [messages, setMessages] = useState([]);
    const chatRef = useRef(null);
    const [formName, setFormName] = useState('');
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const [user] = useState(sessionStorage.getItem("user"));
    // LÓGICA DEL AUTO-SCROLL COPIADA
    const shouldAutoScroll = useRef(true);
    const lastMessageCount = useRef(0);
    const isFirstLoad = useRef(true);

    const id = formId || request?._id;

    // logica de extraer nombre del formulario
    useEffect(() => {
        if (!id || !request) return;

        if (request._contexto && request._contexto.formTitle) {
            setFormName(request._contexto.formTitle);
        } else if (request.title || request.formTitle) {
            setFormName(request.title || request.formTitle);
        }
    }, [id, request]);

    // Fetch de mensajes
    const fetchMessages = async () => {
        if (!id) return;
        try {
            const res = await fetch(`${API_BASE_URL}/respuestas/${id}/chat`);
            if (!res.ok) throw new Error("Error al obtener chat");
            const data = await res.json();

            const currentCount = data?.length || 0;
            const hadNewMessages = currentCount > lastMessageCount.current;

            if (hadNewMessages && !isFirstLoad.current) {
                setHasNewMessages(true);
            }

            setMessages(data || []);
            lastMessageCount.current = currentCount;
        } catch (err) {
            console.error("Error cargando mensajes:", err);
        }
    };

    useEffect(() => {
        if (!isOpen || !id) return;

        setMessages([]);
        shouldAutoScroll.current = true;
        lastMessageCount.current = 0;
        isFirstLoad.current = true;
        setHasNewMessages(false);
        setShowScrollToBottom(false);

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);

        return () => clearInterval(interval);
    }, [isOpen, id]);

    useEffect(() => {
        if (isOpen && chatRef.current && messages.length > 0) {
            if (isFirstLoad.current) {
                setTimeout(() => {
                    if (chatRef.current) {
                        chatRef.current.scrollTop = chatRef.current.scrollHeight;
                        isFirstLoad.current = false;
                        setHasNewMessages(false);
                    }
                }, 100);
            } else if (shouldAutoScroll.current) {
                const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
                const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;

                if (isNearBottom) {
                    setTimeout(() => {
                        if (chatRef.current) {
                            chatRef.current.scrollTop = chatRef.current.scrollHeight;
                            setHasNewMessages(false);
                        }
                    }, 50);
                }
                shouldAutoScroll.current = false;
            }
        }
    }, [messages, isOpen]);

    const handleScroll = () => {
        if (!chatRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
        const isAtBottom = Math.abs(scrollHeight - (scrollTop + clientHeight)) < 10;

        setShowScrollToBottom(!isAtBottom);

        if (!isAtBottom) {
            shouldAutoScroll.current = false;
        } else {
            setHasNewMessages(false);
        }
    };

    const scrollToBottom = () => {
        shouldAutoScroll.current = true;
        setHasNewMessages(false);
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    };

    const formatMessageTime = (timestamp) =>
        new Date(timestamp).toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
            case 'pendiente':
                return 'bg-success text-success-foreground';
            case 'in_review':
            case 'en_revision':
                return 'bg-warning text-warning-foreground';
            case 'approved':
            case 'aprobado':
                return 'bg-secondary text-secondary-foreground';
            case 'signed':
            case 'firmado':
                return 'bg-success text-success-foreground'
            case 'finalizado':
                return 'bg-accent text-accent-foreground'
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
            case 'aprobado':
                return 'CheckCircle';
            case 'pending':
            case 'pendiente':
                return 'Clock';
            case 'in_review':
            case 'en_revision':
                return 'Eye';
            case 'rejected':
            case 'rechazado':
                return 'XCircle';
            case 'borrador':
                return 'FileText';
            default:
                return 'Circle';
            case 'signed':
            case 'firmado':
                return 'CheckSquare';
        }
    };

    if (!isOpen || !request) return null;

    const containerClass = "w-full flex flex-col bg-card min-h-0 h-full";
    const modalClass = "flex flex-col w-full min-h-0 h-full";

    return (
        <div className={containerClass}>
            <div className={modalClass}>
                {/* Header Enhanced */}
                <div className="flex flex-col space-y-3 p-4 sm:p-6 border-b border-border bg-card z-10">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-3">
                            <Icon name="MessageSquare" size={24} className="text-accent mt-1 flex-shrink-0" />
                            <div>
                                <h2 className="text-xl font-semibold text-foreground leading-tight">
                                    {request?.formDef?.title || request?.formTitle || formName || request?.title || "Solicitud"}
                                </h2>
                                <div className="flex flex-col space-y-1 mt-2 text-sm text-muted-foreground">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                        <span className="font-medium text-foreground/80">Asociado a:</span>
                                        <span>{(request?.submittedBy || request?.user?.nombre) + ", " + (request?.company || request?.user?.empresa)}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                        <span className="font-medium text-foreground/80">Fecha de envío:</span>
                                        <span>{new Date(request?.createdAt || request?.submittedAt).toLocaleDateString('es-CL')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request?.status)}`}>
                                <Icon name={getStatusIcon(request?.status)} size={12} className="mr-1.5" />
                                {request?.status?.replace('_', ' ')?.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Chat Read-Only */}
                <div
                    ref={chatRef}
                    className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
                    onScroll={handleScroll}
                >
                    {messages.length > 0 ?
                        messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.autor === user ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-lg p-3 sm:p-4 ${msg.autor === user ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold mr-2">{msg.autor}</span>
                                        <span className="text-[10px] opacity-70">{formatMessageTime(msg.fecha)}</span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.mensaje}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                                <Icon name="MessageSquare" size={48} className="mb-4 opacity-20" />
                                <p>No hay mensajes en esta conversación.</p>
                            </div>
                        )}
                </div>

                {/* Footer with Portal Button and Auto-scroll button */}
                <div className="p-4 sm:p-6 border-t border-border bg-gray-50/50">
                    <div className="flex items-center justify-end gap-3">
                        {showScrollToBottom && (
                            <button
                                onClick={scrollToBottom}
                                className={`shadow-lg flex items-center justify-center bg-accent text-white rounded-full transition-all w-10 h-10 hover:bg-accent/90`}
                                title="Ir al final"
                            >
                                {hasNewMessages ? <div className="w-3 h-3 bg-red-500 rounded-full absolute top-0 right-0 border-2 border-white"></div> : null}
                                <Icon name="ArrowDown" size={20} />
                            </button>
                        )}

                        <a
                            href="https://infoacciona.cl/"
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
                        >
                            Ir al Portal
                            <Icon name="ExternalLink" size={16} className="ml-2" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicMessageView;
