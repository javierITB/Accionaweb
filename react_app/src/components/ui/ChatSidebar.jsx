import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../utils/api';
import Icon from "../AppIcon";

const ChatLegalSidebar = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen) fetchHistory();
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const res = await apiFetch(`/chat/history`);
      const data = await res.json();
      if (data.success) setMessages(data.history);
    } catch (err) { console.error("Error historial:", err); }
  };

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (err) { console.error("Error chat:", err); } 
    finally { setLoading(false); }
  };

  return (
    <div className={`
      /* AGREGADO: pointer-events-auto para permitir clicks */
      fixed right-2 lg:right-4 z-[60] transition-all duration-500 ease-in-out pointer-events-auto
      w-full max-w-[350px] sm:w-[400px]
      bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-3xl overflow-hidden flex flex-col
      ${isOpen 
        ? 'top-[90px] md:top-[110px] opacity-100 scale-100' 
        : 'top-[120px] opacity-0 scale-95 pointer-events-none'}
    `}
    style={{ height: 'calc(100vh - 140px)' }}
    >
      {/* Header Interno */}
      <div className="p-4 border-b border-border/40 flex justify-between items-center bg-primary/10">
        <div className="flex items-center gap-2 text-primary text-xs sm:text-sm">
          <Icon name="Scale" size={18} />
          <span className="font-bold uppercase tracking-wider">Asesor Legal AI</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground">
          <Icon name="X" size={18} />
        </button>
      </div>

      {/* Cuerpo del chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-transparent">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 text-xs sm:text-sm shadow-sm ${
              msg.role === 'user' 
              ? 'bg-primary text-white rounded-2xl rounded-tr-none font-medium' 
              : 'bg-muted/80 backdrop-blur-md border border-border/40 text-foreground rounded-2xl rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-muted/50 p-3 rounded-2xl rounded-tl-none border border-border/40">
              <Icon name="MoreHorizontal" size={18} className="text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Flotante Interno */}
      <form onSubmit={sendMessage} className="p-4 bg-transparent border-t border-border/40">
        <div className="relative flex items-center">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Consulte sobre leyes chilenas..."
            className="w-full bg-background/50 border border-border/60 text-foreground text-xs sm:text-sm py-3 pl-4 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/60"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="absolute right-2 p-2 text-primary hover:scale-110 transition-transform disabled:opacity-30 disabled:hover:scale-100"
          >
            <Icon name="Send" size={18} />
          </button>
        </div>
        <p className="text-[9px] text-muted-foreground mt-2 text-center uppercase tracking-tighter opacity-60">
          Uso exclusivo para Vicente · Solunex ACCIONA
        </p>
      </form>
    </div>
  );
};

export default ChatLegalSidebar;