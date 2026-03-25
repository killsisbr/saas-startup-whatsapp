"use client";

import React, { useState, useEffect } from "react";
import NewTaskModal from "@/components/modals/NewTaskModal";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Plus, MoreHorizontal, Calendar, DollarSign, User, ArrowRight } from "lucide-react";

const STAGES = [
  { id: "CONTATO", title: "Contato Inicial", color: "bg-blue-500" },
  { id: "QUALIFICACAO", title: "Qualificação", color: "bg-purple-500" },
  { id: "PROPOSTA", title: "Proposta", color: "bg-orange-500" },
  { id: "NEGOCIACAO", title: "Negociação", color: "bg-primary" },
  { id: "FECHAMENTO", title: "Fechamento", color: "bg-emerald-500" },
];

export default function KanbanPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/opportunities");
      const data = await res.json();
      setOpportunities(data || []);
    } catch (error) {
      console.error("Erro ao buscar oportunidades:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStage = async (id: string, newStage: string) => {
    try {
      await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      fetchData();
    } catch (error) {
      console.error("Erro ao mover oportunidade:", error);
    }
  };

  if (loading) return <div className="text-white p-8">Carregando Funil de Vendas...</div>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Pipeline de Vendas</h1>
          <p className="text-sm text-zinc-500 font-medium">Gestão de leads e oportunidades em tempo real.</p>
        </div>
        <Button variant="neon" size="lg" className="gap-2" onClick={() => setIsModalOpen(true)}>
           <Plus size={18} />
           Nova Oportunidade
        </Button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar min-h-[70vh]">
        {STAGES.map((stage) => {
          const stageOpportunities = opportunities.filter((op) => op.stage === stage.id);
          const totalValue = stageOpportunities.reduce((acc, curr) => acc + (curr.value || 0), 0);

          return (
            <div key={stage.id} className="min-w-[320px] flex-1 flex flex-col gap-6">
              <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stage.color} shadow-neon`} />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">{stage.title}</h3>
                    <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                      {stageOpportunities.length}
                    </span>
                 </div>
                 <div className="text-[10px] font-bold text-zinc-600">
                    {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                {stageOpportunities.map((op: any) => (
                  <Card key={op.id} className="flex flex-col gap-4 group hover:border-primary/40 transition-all">
                     <div className="flex flex-col gap-1">
                        <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-primary transition-colors">
                          {op.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase">
                           <User size={10} />
                           {op.lead?.name || "Lead Desconhecido"}
                        </div>
                     </div>
                     
                     <div className="flex items-center justify-between py-2 border-y border-white/5">
                        <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                           <DollarSign size={12} />
                           {(op.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-1 text-zinc-600 text-[10px] font-bold">
                           <Calendar size={10} />
                           {new Date(op.createdAt).toLocaleDateString()}
                        </div>
                     </div>

                     <div className="flex items-center justify-between gap-2 mt-2">
                        <select 
                          className="bg-white/5 border border-white/5 rounded-lg py-1 px-2 text-[10px] text-zinc-400 outline-none focus:border-primary/30"
                          value={op.stage}
                          onChange={(e) => updateStage(op.id, e.target.value)}
                        >
                          {STAGES.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                        </select>
                        <button className="p-1 px-2 bg-white/5 rounded-lg border border-white/5 text-zinc-500 hover:text-white transition-colors">
                           <MoreHorizontal size={14} />
                        </button>
                     </div>
                  </Card>
                ))}
                
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/10 text-zinc-600 hover:border-primary/20 hover:text-primary transition-all text-xs font-bold group"
                >
                   <Plus size={14} className="group-hover:scale-110 transition-transform" />
                   Adicionar Lead
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-neon shadow-neon flex items-center justify-center text-white active:scale-95 transition-all lg:hidden"
      >
         <Plus size={28} />
      </button>

      <NewTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
      />
    </div>
  );
}
