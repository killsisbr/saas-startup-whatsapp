"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Bot, Save, Sparkles, Brain, Zap, MessageSquare, ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function AiAgentManager() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    name: "JARVIS",
    temperament: "",
    bio: "",
    products: "",
    active: true
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/ai/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Erro ao buscar config IA:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/ai/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        toast.success("Configuração da IA salva com sucesso!");
      } else {
        const errorData = await res.json();
        toast.error(`Erro: ${errorData.error || "Erro ao salvar configuração"}`);
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <Card className="flex flex-col gap-6 relative overflow-hidden border-primary/20 bg-primary/[0.02]">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Bot size={120} className="text-primary" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary shadow-neon flex items-center justify-center text-white">
            <Brain size={24} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Membro Digital (IA)
              <Badge variant="purple" className="text-[8px] px-2">EXPERIMENTAL</Badge>
            </h2>
            <p className="text-xs text-zinc-500">Configure o comportamento do seu atendente autônomo.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</span>
                <button 
                    onClick={() => setConfig({...config, active: !config.active})}
                    className={`w-8 h-4 rounded-full transition-all relative ${config.active ? 'bg-emerald-500 shadow-[0_0_10px_#10B981]' : 'bg-zinc-700'}`}
                >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${config.active ? 'right-0.5' : 'left-0.5'}`} />
                </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={12} className="text-primary" /> Nome do Agente
          </label>
          <input 
            type="text" 
            placeholder="Ex: JARVIS, Sarah, Atendente VIP" 
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-primary outline-none transition-all"
            value={config.name}
            onChange={(e) => setConfig({...config, name: e.target.value})}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Zap size={12} className="text-primary" /> Temperamento / Tom de Voz
          </label>
          <input 
            type="text" 
            placeholder="Ex: Amigável, formal, sarcástico, direto..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-primary outline-none transition-all"
            value={config.temperament}
            onChange={(e) => setConfig({...config, temperament: e.target.value})}
          />
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Sparkles size={12} className="text-primary" /> Biografia / Contexto da Empresa
          </label>
          <textarea 
            rows={3} 
            placeholder="Explique quem é a empresa e qual o objetivo do agente..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-primary outline-none transition-all resize-none"
            value={config.bio || ""}
            onChange={(e) => setConfig({...config, bio: e.target.value})}
          />
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <MessageSquare size={12} className="text-primary" /> Conhecimento de Produtos e Ofertas
          </label>
          <textarea 
            rows={4} 
            placeholder="Liste produtos, preços e gatilhos de venda..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-primary outline-none transition-all resize-none font-mono text-[11px]"
            value={config.products || ""}
            onChange={(e) => setConfig({...config, products: e.target.value})}
          />
          <p className="text-[9px] text-zinc-600">Dica: Use tópicos para descrever seus produtos de forma clara para a IA.</p>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button 
          variant="neon" 
          className="gap-2 px-8 py-4 shadow-neon transition-transform active:scale-95" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {saving ? "Salvando Membro Digital..." : "Salvar Configurações da IA"}
        </Button>
      </div>
    </Card>
  );
}

function Badge({ children, variant, className }: { children: React.ReactNode, variant: string, className?: string }) {
    return (
        <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${variant === 'purple' ? 'bg-primary/20 text-primary border border-primary/30' : ''} ${className}`}>
            {children}
        </span>
    );
}
