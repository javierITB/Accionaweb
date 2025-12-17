import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MessageModal = ({ isOpen, onClose, request, formId }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState(sessionStorage.getItem("user"));
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const chatRef = useRef(null);
  const shouldAutoScroll = useRef(true);
  const lastMessageCount = useRef(0);
  const isFirstLoad = useRef(true);
  const isTabChange = useRef(false);

  const id = formId || request?._id;

  const fetchMessages = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`https://back-acciona.vercel.app/api/respuestas/${id}/chat/admin`);
      if (!res.ok) throw new Error("Error al obtener chat");
      const data = await res.json();
      
      const currentCount = data?.length || 0;
      const hadNewMessages = currentCount > lastMessageCount.current;
      
      if (hadNewMessages && !isFirstLoad.current && !isTabChange.current) {
        setHasNewMessages(true);
      }
      
      setMessages(data || []);
      lastMessageCount.current = currentCount;
    } catch (err) {
      console.error("Error cargando mensajes:", err);
    }
  }, [id]);

  useEffect(() => {
    if (!isOpen || !id) return;

    shouldAutoScroll.current = true;
    lastMessageCount.current = 0;
    isFirstLoad.current = true;
    isTabChange.current = false;
    setHasNewMessages(false);
    setShowScrollToBottom(false);

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, id, fetchMessages]);

  useEffect(() => {
    if (isOpen && chatRef.current && messages.length > 0) {
      if (isFirstLoad.current || isTabChange.current) {
        setTimeout(() => {
          if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
            isFirstLoad.current = false;
            isTabChange.current = false;
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

  const handleScroll = useCallback(() => {
    if (!chatRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
    const isAtBottom = Math.abs(scrollHeight - (scrollTop + clientHeight)) < 10;
    
    setShowScrollToBottom(!isAtBottom);
    
    if (!isAtBottom) {
      shouldAutoScroll.current = false;
    } else {
      setHasNewMessages(false);
    }
  }, []);

  const handleTabChange = (tab) => {
    isTabChange.current = true;
    shouldAutoScroll.current = true;
    setActiveTab(tab);
    setHasNewMessages(false);
  };

  const filteredMessages = messages.filter(msg => {
    if (activeTab === 'admin') {
      return msg.admin === true;
    }
    return !msg.admin;
  });

  const handleSend = async () => {
    if (!message.trim() || !id) return;
    setIsSending(true);

    try {
      const autor = sessionStorage.getItem("user") || "Anónimo";
      const payload = {
        formId: id,
        autor,
        mensaje: message.trim(),
        admin: activeTab === 'admin'
      };

      const res = await fetch("https://back-acciona.vercel.app/api/respuestas/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data?.data) {
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] flex flex-col relative">
        
        {showScrollToBottom && (
          <div className="absolute -right-14 top-1/2 transform -translate-y-1/2 z-10">
            <Button
              variant={hasNewMessages ? "default" : "secondary"}
              size="sm"
              onClick={scrollToBottom}
              className="shadow-lg flex items-center gap-1 whitespace-nowrap"
              iconName="ArrowDown"
            >
              {hasNewMessages ? "Nuevos" : "↓"}
            </Button>
          </div>
        )}
        
        <div className="border-b border-border bg-card rounded-t-lg bg-error-foreground">
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

          <div className="flex px-6 space-x-6">
            <button
              onClick={() => handleTabChange('general')}
              className={`pb-3 pt-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'general'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              title="Ver mensajes generales"
            >
              General
            </button>
            <button
              onClick={() => handleTabChange('admin')}
              className={`pb-3 pt-1 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'admin'
                  ? 'border-error text-error'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              title="Ver mensajes internos"
            >
              <Icon name="Lock" size={12} />
              Interno
            </button>
          </div>
        </div>

        <div
          ref={chatRef}
          onScroll={handleScroll}
          className={`flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 ${activeTab === 'admin' ? 'bg-error/5' : ''}`}
        >
          {filteredMessages.length > 0 ? filteredMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.autor === user ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] sm:max-w-[85%] rounded-lg px-3 py-2 ${msg.autor === user
                  ? (activeTab === 'admin' ? 'bg-error text-error-foreground' : 'bg-primary text-primary-foreground')
                  : 'bg-muted text-muted-foreground'
                }`}>
                {msg.autor !== user && (
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-xs sm:text-sm font-medium truncate">
                      {msg.autor}
                    </span>
                  </div>
                )}

                <p className="text-sm sm:text-base mb-1 sm:mb-2 break-words">
                  {msg.mensaje}
                </p>

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
              variant={activeTab === 'admin' ? 'destructive' : 'default'}
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