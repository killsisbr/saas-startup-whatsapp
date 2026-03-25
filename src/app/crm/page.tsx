"use client";

import React, { useState } from "react";
import NewOpportunityModal from "@/components/modals/NewOpportunityModal";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Download, Plus, LayoutGrid, List, MoreHorizontal, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function CRMPage() {
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

  React.useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="text-white p-8">Carregando CRM...</div>;

  const stages = [
    { id: "CONTATO", title: "Novos Leads", color: "info" },
    { id: "NEGOCIACAO", title: "Em Contato", color: "purple" },
    { id: "QUALIFICADO", title: "Qualificados", color: "success" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">Funil de Vendas</h1>
          <p className="text-zinc-500 text-lg">Gerencie seus leads e converta oportunidades em realidade.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => window.open("/api/export/csv?type=opportunities", "_blank")}>
            <Download size={18} />
            <span>Exportar</span>
          </Button>
          <Button variant="neon" size="lg" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>Nova Oportunidade</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Cards de métricas mantidos para brevidade, poderiam ser dinâmicos também */}
        <Card className="flex flex-col gap-4">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Leads Ativos</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tighter">{opportunities.length}</span>
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
              Oportunidades
            </span>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">Fluxo de Vendas</h2>
            <Badge variant="purple" className="px-3">{opportunities.length} Oportunidades</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {stages.map((stage) => {
            const stageItems = opportunities.filter((o) => o.stage === stage.id);
            return (
              <div key={stage.id} className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{stage.title}</h3>
                    <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-600">
                      {stageItems.length.toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>
                
                {stageItems.map((opp) => (
                  <Card key={opp.id} className="flex flex-col gap-6 cursor-pointer hover:scale-[1.02]">
                    <div className="flex items-center justify-between">
                      <Badge variant={stage.color as any}>{opp.stage}</Badge>
                      <span className="text-[10px] text-zinc-500 font-medium font-bold text-emerald-500">
                        {opp.priority}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="text-lg font-bold text-white tracking-tight">{opp.title}</h4>
                      <p className="text-xs text-zinc-500">{opp.lead?.name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white">R$ {opp.value.toLocaleString()}</span>
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center font-bold text-[10px]">
                        {opp.title.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </Card>
                ))}

                {stageItems.length === 0 && (
                   <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl text-zinc-600 text-xs italic">
                      Nenhuma oportunidade nesta fase.
                   </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <NewOpportunityModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => window.location.reload()} 
      />
    </div>
  );
}
