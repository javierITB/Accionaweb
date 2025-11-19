import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MessageModal = ({ isOpen, onClose, request, formId }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState(sessionStorage.getItem("user"));
  const [messages, setMessages] = useState([]);
  const chatRef = useRef(null);

  const id = formId || request?._id;

  // 🔁 Fetch de mensajes
  const fetchMessages = async () => {
    if (!id) return;
    try {
      const res = await fetch(`https://back-acciona.vercel.app/api/respuestas/${id}/chat`);
      if (!res.ok) throw new Error("Error al obtener chat");
      const data = await res.json();
      setMessages(data || []);
    } catch (err) {
      console.error("Error cargando mensajes:", err);
    }
  };

  useEffect(() => {
    if (!isOpen || !id) return;

    fetchMessages(); // fetch inicial
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, id]);

  // ⬇️ Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Enviar mensaje
  const handleSend = async () => {
    if (!message.trim() || !id) return;
    setIsSending(true);

    try {
      const autor = sessionStorage.getItem("user") || "Anónimo";
      const res = await fetch("https://back-acciona.vercel.app/api/respuestas/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: id, autor, mensaje: message.trim() }),
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
        {/* Header - Compacto en móvil */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <Icon name="MessageSquare" size={20} className="text-accent flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                Mensajes
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {request?.title || request?.formTitle}
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

        {/* Chat Area - Mejor espaciado en móvil */}
        <div 
          ref={chatRef} 
          className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4"
        >
          {messages.length > 0 ? messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.autor === user ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] sm:max-w-[85%] rounded-lg px-3 py-2 ${
                msg.autor === user 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                
                {/* Mostrar nombre del remitente solo si no es el usuario actual */}
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
              <Icon name="MessageCircle" size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay mensajes aún</p>
              <p className="text-xs mt-1">Sé el primero en enviar un mensaje</p>
            </div>
          )}
        </div>

        {/* Input Area - Stack vertical en móvil */}
        <div className="p-3 sm:p-6 border-t border-border">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="flex-1 min-w-0">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje aquí..."
                className="w-full min-h-[60px] sm:min-h-[80px] p-3 border border-border rounded-lg resize-none bg-input text-foreground focus:ring-2 focus:ring-ring text-sm sm:text-base"
                disabled={isSending}
                rows={3}
              />
            </div>
            <Button
              variant="default"
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
          
          {/* Helper text para móvil */}
          <div className="mt-2 text-xs text-muted-foreground text-center sm:text-left">
            <span className="hidden sm:inline">Presiona Enter para enviar, Shift+Enter para nueva línea</span>
            <span className="sm:hidden">Toca enviar o presiona Enter</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;