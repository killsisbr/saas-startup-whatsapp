"use client";

import React, { useState, useEffect } from "react";
import NewOpportunityModal from "@/components/modals/NewOpportunityModal";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Download, Plus, LayoutGrid, List, MoreHorizontal, MessageSquare, CheckCircle2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export default function CRMPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [editingOpp, setEditingOpp] = useState<any>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/opportunities");
      const data = await res.json();
      if (data && data.length > 0) {
        setOpportunities(data);
      }
    } catch (error) {
      console.error("Erro ao buscar oportunidades:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stages = [
    { id: "CONTATO INICIAL", title: "Novos Leads", color: "border-blue-500/30", dot: "bg-blue-500" },
    { id: "QUALIFICAÇÃO", title: "Em Contato", color: "border-primary/40", dot: "bg-primary" },
    { id: "QUALIFICADO", title: "Qualificados", color: "border-emerald-500/30", dot: "bg-emerald-500" },
  ];

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    // Optimistic Update
    const draggedOp = opportunities.find(o => o.id === draggableId);
    if (!draggedOp) return;

    const newOpps = opportunities.map(o => 
      o.id === draggableId ? { ...o, stage: destination.droppableId } : o
    );
    setOpportunities(newOpps);

    // Persist API
    try {
      await fetch("/api/opportunities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draggableId, stage: destination.droppableId }),
      });
    } catch (error) {
      console.error("Erro ao mover lead:", error);
      fetchData(); // Rollback on error
    }
  };

  if (loading) return <div className="text-white p-8">Carregando CRM...</div>;

  const totalPipeline = opportunities.reduce((acc, op) => acc + (op.value || 0), 0);
  const averageTicket = opportunities.length > 0 ? totalPipeline / opportunities.length : 0;

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">Funil de Vendas</h1>
          <p className="text-zinc-400 text-sm">Gerencie seus leads e converta oportunidades em realidade.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5" onClick={() => window.open("/api/export/csv?type=opportunities", "_blank")}>
            <Download size={16} className="mr-2" />
            <span>Exportar</span>
          </Button>
          <Button 
            variant="neon" 
            className="gap-2 bg-primary/20 text-primary border-primary/50 hover:bg-primary/30 shadow-none" 
            onClick={() => {
               setEditingOpp(null);
               setIsModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Nova Oportunidade</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col gap-4 p-5 hover:border-white/20 transition-all">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Em Pipeline</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tracking-tighter shrink-0">
               {totalPipeline > 1000000 
                 ? `R$ ${(totalPipeline / 1000000).toFixed(1)}M` 
                 : `R$ ${(totalPipeline / 1000).toFixed(0)}k`}
            </span>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5 whitespace-nowrap">
              +12%
            </span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-primary rounded-full w-[70%]" />
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-5 hover:border-white/20 transition-all">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Leads Ativos</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tighter">{opportunities.length}</span>
            <span className="text-xs font-bold text-zinc-600">/ 50 total</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-zinc-500">
             <div className="flex -space-x-1">
                <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/50" />
                <div className="w-4 h-4 rounded-full bg-orange-500/20 border border-orange-500/50" />
             </div>
             <span className="text-[10px] font-bold ml-1">+39</span>
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-5 hover:border-white/20 transition-all">
           <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Conversão</span>
           <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tracking-tighter">28%</span>
              <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                -2%
              </span>
           </div>
           <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
             <div className="h-full bg-emerald-500 rounded-full w-[28%]" />
           </div>
        </Card>

        <Card className="flex flex-col gap-4 p-5 hover:border-white/20 transition-all">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ticket Médio</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tracking-tighter">
               R$ {(averageTicket / 1000).toFixed(0)}k
            </span>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5 whitespace-nowrap">
              +R$ 1.2k
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 mt-2 font-medium">Meta trimestral: R$ 15k</span>
        </Card>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Fluxo de Vendas</h2>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-neon" />
               <span className="text-xs text-zinc-400 font-medium">{opportunities.length} Oportunidades em aberto</span>
            </div>
          </div>
          
          <div className="flex items-center bg-black/40 border border-white/5 p-1 rounded-lg">
             <button 
                onClick={() => setViewMode('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'board' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
             >
                <LayoutGrid size={14} /> Board
             </button>
             <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
             >
                <List size={14} /> Lista
             </button>
          </div>
        </div>

        {viewMode === 'board' ? (
          <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar min-h-[50vh] flex-1">
            <DragDropContext onDragEnd={onDragEnd}>
              {stages.map((stage) => {
                const stageItems = opportunities.filter((o) => o.stage === stage.id);
                return (
                  <div key={stage.id} className="min-w-[340px] w-[340px] flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{stage.title}</h3>
                        <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                            {stageItems.length.toString().padStart(2, "0")}
                        </span>
                      </div>
                      <button className="text-zinc-500 hover:text-white transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                    
                    <Droppable droppableId={stage.id}>
                      {(provided, snapshot) => (
                        <div 
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`flex flex-col gap-4 min-h-[150px] p-2 rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-white/5' : ''}`}
                        >
                          {stageItems.map((opp, index) => (
                            <Draggable key={opp.id} draggableId={opp.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    opacity: snapshot.isDragging ? 0.9 : 1
                                  }}
                                >
                                  <Card 
                                    className={`flex flex-col gap-5 p-5 cursor-pointer hover:border-white/20 transition-all border-l-2 ${stage.color} !bg-[#0E0E11] ${snapshot.isDragging ? 'border-primary shadow-xl shadow-primary/10' : ''}`}
                                    onClick={() => {
                                      setEditingOpp(opp);
                                      setIsModalOpen(true);
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <Badge 
                                        variant={
                                          opp.priority === 'ENTRADA' ? 'info' : 
                                          opp.priority === 'QUENTE' ? 'purple' : 
                                          opp.priority === 'PROPOSTA ENVIADA' ? 'warning' : 'info'
                                        } 
                                        className="uppercase tracking-widest text-[9px] py-1 px-2 border-transparent"
                                      >
                                        {opp.priority || opp.stage}
                                      </Badge>
                                      <span className="text-[10px] text-zinc-500 font-bold whitespace-nowrap">
                                        {new Date(opp.createdAt || Date.now()).toLocaleDateString()}
                                      </span>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1.5">
                                      <h4 className="text-base font-bold text-white tracking-tight">{opp.title}</h4>
                                      <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                                          <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-white">
                                            {opp.lead?.name?.[0] || 'U'}
                                          </div>
                                          {opp.lead?.name || "Lead Desconhecido"}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                      <span className="text-sm font-bold text-white">
                                          {Number(opp.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                      </span>
                                      
                                      <div className="flex items-center gap-2">
                                          {opp.priority === 'QUENTE' && <MessageSquare size={14} className="text-emerald-500" />}
                                          {opp.priority === 'PROPOSTA ENVIADA' && <CheckCircle2 size={14} className="text-emerald-500" />}
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] text-white 
                                              ${opp.priority === 'ENTRADA' ? 'bg-primary' : 
                                                opp.priority === 'QUENTE' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                          >
                                            {opp.statusBadge || opp.title.substring(0, 2).toUpperCase()}
                                          </div>
                                      </div>
                                    </div>
                                  </Card>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
          
                          {stageItems.length === 0 && !snapshot.isDraggingOver && (
                              <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl text-zinc-600 text-xs font-medium">
                                Nenhuma oportunidade nesta fase.
                              </div>
                          )}
                          
                          {stage.id === 'CONTATO INICIAL' && (
                            <Button 
                                variant="outline" 
                                className="w-full text-xs font-bold border-dashed border-white/10 hover:border-primary/30 hover:text-primary transition-all text-zinc-500 gap-2 mt-2"
                                onClick={() => {
                                  setEditingOpp(null);
                                  setIsModalOpen(true);
                                }}
                            >
                                <Plus size={14} />
                                NOVO LEAD
                            </Button>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </DragDropContext>
          </div>
        ) : (
          <div className="bg-[#0E0E11] rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-left">
               <thead className="bg-white/5 border-b border-white/10 text-xs text-zinc-500 font-bold uppercase tracking-widest">
                  <tr>
                     <th className="px-6 py-4">Oportunidade</th>
                     <th className="px-6 py-4">Estágio</th>
                     <th className="px-6 py-4">Prioridade</th>
                     <th className="px-6 py-4 text-right">Valor</th>
                     <th className="px-6 py-4 text-center">Data</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {opportunities.map((opp) => (
                     <tr 
                        key={opp.id} 
                        className="hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={() => {
                          setEditingOpp(opp);
                          setIsModalOpen(true);
                        }}
                     >
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="font-bold text-white group-hover:text-primary transition-colors">{opp.title}</span>
                              <span className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                                <div className="w-3 h-3 rounded-full bg-white/10 flex items-center justify-center text-[6px] text-white">
                                  {opp.lead?.name?.[0] || 'U'}
                                </div>
                                {opp.lead?.name || "Lead Desconhecido"}
                              </span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <Badge variant={opp.stage === 'CONTATO INICIAL' ? 'info' : opp.stage === 'QUALIFICAÇÃO' ? 'purple' : 'success'} className="text-[10px]">
                              {opp.stage}
                           </Badge>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`text-xs font-bold ${opp.priority === 'QUENTE' ? 'text-emerald-500' : opp.priority === 'PROPOSTA ENVIADA' ? 'text-orange-500' : 'text-blue-500'}`}>
                             {opp.priority || 'NORMAL'}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className="font-bold text-white">
                             {Number(opp.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-center text-xs text-zinc-500 font-medium">
                           {new Date(opp.createdAt || Date.now()).toLocaleDateString()}
                        </td>
                     </tr>
                  ))}
                  {opportunities.length === 0 && (
                     <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">Nenhuma oportunidade encontrada.</td>
                     </tr>
                  )}
               </tbody>
            </table>
          </div>
        )}
      </div>
      <NewOpportunityModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setTimeout(() => setEditingOpp(null), 300);
        }} 
        onSuccess={fetchData} 
        initialData={editingOpp}
      />
    </div>
  );
}
