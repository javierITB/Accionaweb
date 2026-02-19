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
      fixed z-[100] transition-all duration-500 ease-in-out pointer-events-auto
      left-1/2 -translate-x-1/2 w-full max-w-[95%] md:left-auto md:translate-x-0 md:right-1 lg:right-2 md:w-[450px] lg:w-[500px]
      bg-card/90 backdrop-blur-xl border border-border/50 shadow-brand rounded-[2.5rem] overflow-hidden flex flex-col
      ${isOpen 
        ? 'top-[90px] md:top-[110px] opacity-100 scale-100' 
        : 'top-[120px] opacity-0 scale-95 pointer-events-none'}
    `}
    style={{ height: 'calc(100vh - 160px)' }}
    >
      <div className="p-5 border-b border-border/40 flex justify-between items-center bg-primary/5">
        <div className="flex items-center gap-3 text-primary">
          <div className="p-2 bg-primary/10 rounded-xl">
             <Icon name="Scale" size={20} />
          </div>
          <span className="font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs">Asesor Legal AI</span>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-full transition-colors text-muted-foreground">
          <Icon name="X" size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-transparent">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 text-xs sm:text-sm shadow-sm leading-relaxed ${
              msg.role === 'user' 
              ? 'bg-primary text-white rounded-3xl rounded-tr-none font-medium' 
              : 'bg-muted/80 backdrop-blur-md border border-border/30 text-foreground rounded-3xl rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={sendMessage} className="p-6 bg-transparent border-t border-border/20">
        <div className="relative flex items-center group">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Escriba su consulta legal..."
            /* CAMBIO CLAVE: Forzamos text-slate-100 y fondo oscuro sólido para contraste */
            className="w-full bg-[#0f172a] border border-border/60 text-slate-100 text-xs sm:text-sm py-4 pl-5 pr-14 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-slate-500 shadow-inner block"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="absolute right-3 p-2.5 bg-primary text-white rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shadow-lg z-10"
          >
            <Icon name="Send" size={18} />
          </button>
        </div>
        <div className="flex items-center justify-center gap-2 mt-4 opacity-40">
           <div className="h-[1px] w-8 bg-muted-foreground"></div>
           <p className="text-[8px] text-muted-foreground uppercase tracking-[0.3em]">
              · Solunex ACCIONA · Asesoría Legal AI ·
           </p>
           <div className="h-[1px] w-8 bg-muted-foreground"></div>
        </div>
      </form>
    </div>
  );
};

export default ChatLegalSidebar;