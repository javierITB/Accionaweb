import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MessageModal = ({ isOpen, onClose, request, formId }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState(sessionStorage.getItem("user"));
  const [messages, setMessages] = useState([]);

  // 1. NUEVO ESTADO: Control de Pestañas ('general' | 'admin')
  const [activeTab, setActiveTab] = useState('general');

  const chatRef = useRef(null);

  const id = formId || request?._id;

  // 🔁 Fetch de mensajes (Trae TODOS, luego filtramos en el render)
  const fetchMessages = async () => {
    if (!id) return;
    try {
      const res = await fetch(`https://back-acciona.vercel.app/api/respuestas/${id}/chat/admin`);
      if (!res.ok) throw new Error("Error al obtener chat");
      const data = await res.json();
      setMessages(data || []);
    } catch (err) {
      console.error("Error cargando mensajes:", err);
    }
  };

  useEffect(() => {
    if (!isOpen || !id) return;

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, id]);

  // 2. LÓGICA DE FILTRADO
  const filteredMessages = messages.filter(msg => {
    if (activeTab === 'admin') {
      return msg.admin === true; // Solo mensajes internos
    }
    return !msg.admin; // Solo mensajes generales (undefined, null o false)
  });

  // ⬇️ Auto-scroll (Se dispara cuando cambian los mensajes O la pestaña activa)
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  // Enviar mensaje
  const handleSend = async () => {
    if (!message.trim() || !id) return;
    setIsSending(true);

    try {
      const autor = sessionStorage.getItem("user") || "Anónimo";

      // 3. LÓGICA DE ENVÍO: Añadir flag admin si estamos en esa pestaña
      const payload = {
        formId: id,
        autor,
        mensaje: message.trim(),
        admin: activeTab === 'admin' // <--- IMPORTANTE
      };

      const res = await fetch("https://back-acciona.vercel.app/api/respuestas/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data?.data) {
        setMessages(prev => [...prev, data.data]);
        setMessage('');
      } else {
        console.error("Error enviando mensaje:", data.error || data);
      }
    } catch (err) {
      console.error("Error enviando mensaje:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] flex flex-col">

        {/* Header & Tabs */}
        <div
          className={`
            border-b border-border 
            bg-card 
            rounded-t-lg 
            bg-error-foreground
          `}
        >
          {/* Fila superior: Título y Cerrar */}

          <div className="flex items-center justify-between p-4 sm:px-6 pb-2">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <Icon name="MessageSquare" size={20} className="text-accent flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                  Mensajes
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {request?.title || request?.formTitle} {request?.trabajador}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              iconName="X"
              iconSize={20}
              className="flex-shrink-0 ml-2"
            />
          </div>

          {/* Fila inferior: Pestañas */}
          <div className="flex px-6 space-x-6">
            <button
              onClick={() => setActiveTab('general')}
              className={`pb-3 pt-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'general'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              title="Ver mensajes generales"
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`pb-3 pt-1 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'admin'
                  ? 'border-error text-error' // Color distintivo para admin
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              title="Ver mensajes internos"
            >
              <Icon name="Lock" size={12} />
              Interno
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div
          ref={chatRef}
          className={`flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 ${activeTab === 'admin' ? 'bg-error/5' : ''}`} // Fondo sutil para admin
        >
          {filteredMessages.length > 0 ? filteredMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.autor === user ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] sm:max-w-[85%] rounded-lg px-3 py-2 ${msg.autor === user
                  ? (activeTab === 'admin' ? 'bg-error text-error-foreground' : 'bg-primary text-primary-foreground')
                  : 'bg-muted text-muted-foreground'
                }`}>

                {/* Mostrar nombre del remitente */}
                {msg.autor !== user && (
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-xs sm:text-sm font-medium truncate">
                      {msg.autor}
                    </span>
                  </div>
                )}

                {/* Mensaje */}
                <p className="text-sm sm:text-base mb-1 sm:mb-2 break-words">
                  {msg.mensaje}
                </p>

                {/* Timestamp */}
                <span className="text-xs opacity-75 block text-right">
                  {formatMessageTime(msg.fecha)}
                </span>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name={activeTab === 'admin' ? "Lock" : "MessageCircle"} size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay mensajes {activeTab === 'admin' ? 'internos' : 'generales'} aún</p>
              <p className="text-xs mt-1">Escribe algo para comenzar</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-6 border-t border-border bg-card rounded-b-lg">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="flex-1 min-w-0">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={activeTab === 'admin' ? "Escribir nota interna (solo admins)..." : "Escribe tu mensaje aquí..."}
                className="w-full min-h-[60px] sm:min-h-[80px] p-3 border border-border rounded-lg resize-none bg-input text-foreground focus:ring-2 focus:ring-ring text-sm sm:text-base"
                disabled={isSending}
                rows={3}
              />
            </div>
            <Button
              variant={activeTab === 'admin' ? 'destructive' : 'default'} // Botón rojo para admin
              onClick={handleSend}
              disabled={!message.trim() || isSending}
              loading={isSending}
              iconName="Send"
              iconPosition="left"
              iconSize={16}
              className="w-full sm:w-auto sm:min-w-[100px] h-12 sm:h-auto"
            >
              <span className="hidden xs:inline">Enviar</span>
              <span className="xs:hidden">Enviar</span>
            </Button>
          </div>

          <div className="mt-2 text-xs text-muted-foreground text-center sm:text-left">
            <span className="hidden sm:inline">Presiona Enter para enviar, Shift+Enter para nueva línea</span>
            {activeTab === 'admin' && <span className="ml-2 text-error font-medium">(Modo Interno)</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;