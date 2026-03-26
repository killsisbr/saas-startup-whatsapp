"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Loader2, Sparkles, User, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";

export default function FloatingTestBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Olá! Sou o seu atendente configurado. Como posso te ajudar hoje?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "Ops! Tive um erro na simulação." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Erro de conexão com o servidor de IA." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 rounded-full bg-primary shadow-neon flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary to-purple-400 opacity-50 group-hover:rotate-180 transition-transform duration-500" />
            <BrainCircuit size={28} className="relative z-10" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-surface shadow-[0_0_8px_#10B981]" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="w-[380px] h-[550px] bg-surface-dark border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl ring-1 ring-white/5"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 bg-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-neon-soft">
                  <Bot size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tighter">AI Simulator</h3>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">Motor JARVIS Ativo</span>
                    </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Chat Body */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 scrollbar-hide bg-black/10"
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                  <div className={`
                    max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed
                    ${msg.role === 'user' 
                        ? 'bg-primary text-white shadow-lg rounded-tr-none' 
                        : 'bg-white/5 border border-white/5 text-zinc-200 rounded-tl-none'}
                  `}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 p-3 rounded-2xl rounded-tl-none">
                    <Loader2 className="animate-spin text-primary" size={16} />
                  </div>
                </div>
              )}
            </div>

            {/* Footer / Input */}
            <div className="p-4 bg-white/[0.02] border-t border-white/5">
                <div className="flex items-center gap-2 bg-white/5 rounded-2xl p-2 border border-white/5 focus-within:border-primary/30 transition-all">
                    <input 
                        type="text" 
                        placeholder="Simular mensagem do cliente..." 
                        className="flex-1 bg-transparent border-none outline-none text-xs text-white px-2"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:scale-105 transition-all shadow-neon disabled:opacity-50 disabled:scale-100"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <p className="text-[9px] text-center mt-3 text-zinc-600 font-medium">As mensagens simuladas refletem as configurações de equipe.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
