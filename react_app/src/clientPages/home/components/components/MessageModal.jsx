import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const MessageModal = ({ isOpen, onClose, request, onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen || !request) return null;

  const handleSend = async () => {
    if (!message?.trim()) return;
    
    setIsSending(true);
    try {
      await onSendMessage({
        requestId: request?.id,
        message: message?.trim(),
        isUrgent,
        timestamp: new Date()?.toISOString()
      });
      setMessage('');
      setIsUrgent(false);
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e?.key === 'Enter' && (e?.ctrlKey || e?.metaKey)) {
      handleSend();
    }
  };

  const mockMessages = [
    {
      id: 1,
      sender: "Sarah Johnson",
      role: "Empleado",
      message: "Hola, necesito actualizar la fecha de inicio de mi solicitud de vacaciones. ¿Es posible hacer este cambio?",
      timestamp: "2025-01-20T10:30:00Z",
      isUrgent: false
    },
    {
      id: 2,
      sender: "María González",
      role: "RR.HH.",
      message: "Hola Sarah, sí es posible hacer el cambio. Por favor proporciona la nueva fecha de inicio y te ayudo con la modificación.",
      timestamp: "2025-01-20T14:15:00Z",
      isUrgent: false
    },
    {
      id: 3,
      sender: "Sarah Johnson",
      role: "Empleado",
      message: "Perfecto, la nueva fecha de inicio sería el 15 de febrero en lugar del 8 de febrero. Gracias por tu ayuda.",
      timestamp: "2025-01-20T14:45:00Z",
      isUrgent: false
    }
  ];

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp)?.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-brand-active w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Icon name="MessageSquare" size={24} className="text-accent" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Mensajes</h2>
              <p className="text-sm text-muted-foreground">{request?.title}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={20}
          />
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {mockMessages?.map((msg) => (
            <div key={msg?.id} className={`flex ${msg?.role === 'Empleado' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-4 ${
                msg?.role === 'Empleado' 
                  ? 'bg-primary text-primary-foreground' :'bg-muted text-muted-foreground'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {msg?.sender} ({msg?.role})
                  </span>
                  {msg?.isUrgent && (
                    <Icon name="AlertTriangle" size={14} className="text-warning" />
                  )}
                </div>
                <p className="text-sm mb-2">{msg?.message}</p>
                <span className="text-xs opacity-75">
                  {formatMessageTime(msg?.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-6 border-t border-border">
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e?.target?.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje aquí... (Ctrl+Enter para enviar)"
                className="w-full min-h-[100px] p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
                disabled={isSending}
              />
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                {message?.length}/500
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e?.target?.checked)}
                  className="rounded border-border"
                  disabled={isSending}
                />
                <span className="text-muted-foreground">Marcar como urgente</span>
                <Icon name="AlertTriangle" size={14} className="text-warning" />
              </label>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isSending}
                >
                  Cancelar
                </Button>
                <Button
                  variant="default"
                  onClick={handleSend}
                  disabled={!message?.trim() || isSending}
                  loading={isSending}
                  iconName="Send"
                  iconPosition="left"
                  iconSize={16}
                >
                  Enviar Mensaje
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;