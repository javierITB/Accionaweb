import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MessageModal = ({ isOpen, onClose, request, formId }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const chatRef = useRef(null);

  // 🔁 Polling en tiempo real (cada 3 segundos)
  useEffect(() => {

    if (!isOpen || !formId) return;

    const fetchMessages = async () => {
      try {
        const id = formId || request?._id;
        if (!id) return;
        const res = await fetch(`http://192.168.0.2:4000/api/respuestas/${id}/chat`);


        if (res.ok && data?.data) {
          setMessages(prev => [...prev, data.data]);
        } else {
          console.error("Error enviando mensaje:", data);
        }

        if (!res.ok) throw new Error("Error al obtener chat");
        const data = await res.json();
        setMessages(data || []);
      } catch (err) {
        console.error("Error cargando mensajes:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);

    return () => clearInterval(interval);
  }, [isOpen, formId, request?._id]);

  // ⬇️ Auto-scroll al fondo del chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);

    const id = formId || request._id;
    if (!id) return console.error("No hay formId válido");

    try {
      const autor = sessionStorage.getItem("user") || "Anónimo";

      const res = await fetch("http://192.168.0.2:4000/api/respuestas/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: id, autor, mensaje: message.trim() }),
      });

      const data = await res.json();
      if (res.ok && data?.data) {
        setMessages(prev => [...prev, data.data]);
        setMessage('');
        // 🔄 Refrescar mensajes del servidor
        await fetchMessages();
      } else {
        console.error("Error enviando mensaje:", data.error || data);
      }
    } catch (error) {
      console.error("Error enviando mensaje:", error);
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
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Icon name="MessageSquare" size={24} className="text-accent" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Mensajes</h2>
              <p className="text-sm text-muted-foreground">{request?.title}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} iconName="X" iconSize={20} />
        </div>

        {/* Chat */}
        <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length > 0 ? (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.autor === 'admin' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-4 ${msg.autor === 'admin'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{msg.autor}</span>
                  </div>
                  <p className="text-sm mb-2">{msg.mensaje}</p>
                  <span className="text-xs opacity-75">{formatMessageTime(msg.fecha)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">Sin mensajes aún.</p>
          )}
        </div>

        {/* Input */}
        <div className="p-6 border-t border-border">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;
