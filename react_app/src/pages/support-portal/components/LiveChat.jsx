import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      message: "¡Hola! Soy el asistente virtual de Acciona HR. ¿En qué puedo ayudarte hoy?",
      timestamp: new Date(Date.now() - 300000),
      avatar: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=40&h=40&fit=crop&crop=face"
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage?.trim()) return;

    const userMessage = {
      id: messages?.length + 1,
      sender: "user",
      message: newMessage,
      timestamp: new Date(),
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponses = [
        "Entiendo tu consulta. Te estoy conectando con un especialista en recursos humanos.",
        "Gracias por contactarnos. He encontrado información relevante sobre tu solicitud.",
        "Perfecto, puedo ayudarte con eso. ¿Podrías proporcionarme más detalles?",
        "He registrado tu consulta. Un agente especializado te contactará en breve.",
        "Excelente pregunta. Te voy a proporcionar los pasos a seguir."
      ];

      const botMessage = {
        id: messages?.length + 2,
        sender: "bot",
        message: botResponses?.[Math.floor(Math.random() * botResponses?.length)],
        timestamp: new Date(),
        avatar: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=40&h=40&fit=crop&crop=face"
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const formatTime = (date) => {
    return date?.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-success hover:bg-success/90 shadow-brand-hover"
          size="icon"
        >
          <Icon name="MessageCircle" size={24} color="white" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-card border border-border rounded-lg shadow-brand-active animate-scale-in">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
            <Icon name="Bot" size={16} color="white" />
          </div>
          <div>
            <h3 className="font-semibold">Soporte Acciona</h3>
            <p className="text-xs opacity-90">En línea</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="text-primary-foreground hover:bg-white/10"
        >
          <Icon name="X" size={16} />
        </Button>
      </div>
      {/* Messages */}
      <div className="flex-1 p-4 h-80 overflow-y-auto space-y-4">
        {messages?.map((message) => (
          <div
            key={message?.id}
            className={`flex ${message?.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[80%] ${
              message?.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <img
                src={message?.avatar}
                alt={message?.sender}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <div className={`p-3 rounded-lg ${
                  message?.sender === 'user' ?'bg-primary text-primary-foreground' :'bg-muted text-muted-foreground'
                }`}>
                  <p className="text-sm">{message?.message}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTime(message?.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <img
                src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=40&h=40&fit=crop&crop=face"
                alt="bot"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Escribe tu mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e?.target?.value)}
            onKeyPress={(e) => e?.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage?.trim()}
            size="icon"
          >
            <Icon name="Send" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveChat;