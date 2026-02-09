import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { apiFetch, API_BASE_URL } from '../../../../utils/api';

const MessageModal = ({ isOpen, onClose, request, formId }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState(sessionStorage.getItem("user"));
  const [messages, setMessages] = useState([]);
  const chatRef = useRef(null);
  const [formName, setFormName] = useState('');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

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
      const res = await apiFetch(`${API_BASE_URL}/respuestas/${id}/chat`);
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

    // Resetear estados al abrir el modal (COPIADO)
    setMessages([]);
    shouldAutoScroll.current = true;
    lastMessageCount.current = 0;
    isFirstLoad.current = true;
    setHasNewMessages(false);
    setShowScrollToBottom(false);

    fetchMessages(); // fetch inicial
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, id]);

  // ⬇️ AUTO-SCROLL COPIADO DE LA VISTA ADMIN
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

  // MANEJADOR DE SCROLL COPIADO
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

  // Enviar mensaje
  const handleSend = async () => {
    if (!message.trim() || !id) return;
    setIsSending(true);

    try {
      const autor = sessionStorage.getItem("user") || "Anónimo";
      
      // LOGICA PARA NOTIFICACIONES:
      // Para que el cliente lo vea y se le notifique, 'internal' DEBE ser false.
      const userRole = sessionStorage.getItem("rol");
      const isStaff = ['Administrador', 'RRHH', 'root'].includes(userRole);

      const res = await apiFetch(`${API_BASE_URL}/respuestas/chat`, {
        method: "POST",
        body: JSON.stringify({ 
          formId: id, 
          autor, 
          mensaje: message.trim(),
          // Si es este modal (el general), internal es false para que llegue al cliente
          internal: false, 
          admin: isStaff // Mantenemos admin true para que el backend sepa que eres Staff
        }),
      });

      const data = await res.json();
      if (res.ok && data?.data) {
        // Forzar auto-scroll cuando el usuario envía un mensaje (COPIADO)
        shouldAutoScroll.current = true;
        setMessages(prev => [...prev, data.data]);
        setMessage('');
        setHasNewMessages(false);
      } else {
        console.error("Error enviando mensaje:", data.error || data);
      }
    } catch (err) {
      console.error("Error enviando mensaje:", err);
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (timestamp) =>
    new Date(timestamp).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border shadow-lg w-full h-full rounded-none sm:max-w-2xl sm:h-auto sm:max-h-[80vh] sm:rounded-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Icon name="MessageSquare" size={24} className="text-accent" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Mensajes</h2>
              {/* MODIFICADO: Nombre completo del formulario */}
              <p className="text-sm text-muted-foreground truncate">
                {formName || request?.title || request?.formTitle} {request?.trabajador || ''}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} iconName="X" iconSize={20} />
        </div>

        {/* Chat - AGREGADO onScroll */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
          onScroll={handleScroll}
        >
          {messages.length > 0 ? messages.map((msg, i) => (
            // FILTRO VISUAL: Mostramos mensajes si no son internos
            !msg.internal && (
              <div key={i} className={`flex ${msg.autor === user ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-4 ${msg.autor === user ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{msg.autor}</span>
                  </div>
                  <p className="text-sm mb-2">{msg.mensaje}</p>
                  <span className="text-xs opacity-75">{formatMessageTime(msg.fecha)}</span>
                </div>
              </div>
            )
          )) : <p className="text-center text-muted-foreground">Sin mensajes aún.</p>}
        </div>

        {/* Input */}
        {!["finalizado", "archivado"].includes(request?.status) && (
          <div className="p-4 sm:p-6 border-t border-border">
            <div className="flex items-center space-x-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                className="w-full min-h-[60px] p-3 border border-border rounded-lg resize-none bg-input text-foreground focus:ring-2 focus:ring-ring"
                disabled={isSending}
              />
              <Button
                variant="default"
                onClick={handleSend}
                disabled={!message.trim() || isSending}
                loading={isSending}
                iconName="Send"
                iconPosition="left"
                iconSize={16}
              >
                Enviar
              </Button>
              {/* AGREGADO: Botón para bajar rápido a la derecha del enviar */}
              {showScrollToBottom && (
                <div className="flex-shrink-0">
                  <Button
                    onClick={scrollToBottom}
                    className="shadow-lg flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
                    iconName="ArrowDown"
                    size="sm"
                  >
                    {hasNewMessages && "Nuevos"}  {/* ← Texto solo cuando hay nuevos */}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageModal;