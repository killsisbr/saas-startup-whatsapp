"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Users2, Plus, MoreVertical, Mail, Shield, Clock, LayoutGrid, Filter, Search } from "lucide-react";

import InviteMemberModal from "@/components/modals/InviteMemberModal";
import AiAgentManager from "@/components/team/AiAgentManager";
import FloatingTestBot from "@/components/team/FloatingTestBot";

export default function EquipePage() {
  const [loading, setLoading] = useState(true);
  const [membros, setMembros] = useState<any[]>([]);
  const [filter, setFilter] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      setMembros(data || []);
    } catch (error) {
      console.error("Erro ao buscar equipe:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="text-white p-8">Carregando Equipe...</div>;

  const filteredMembros = filter === "Todos"
    ? membros
    : membros.filter(m => m.role === filter.toUpperCase() || (filter === "Ativos" && m.role !== ""));

  return (
    <div className="flex flex-col gap-8">
      <InviteMemberModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
      />
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">Equipe</h1>
          <p className="text-zinc-500 text-sm">Gerencie os membros da sua organização, controle permissões e acompanhe a atividade do time.</p>
        </div>
        <Button variant="neon" size="lg" className="gap-2" onClick={() => setIsModalOpen(true)}>
           <Plus size={18} />
           Convidar Membro
        </Button>
      </div>

      <AiAgentManager />

      <div className="flex items-center gap-6">
        <Card className="flex items-center gap-6 py-4 px-8 min-w-[240px]">
           <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Users2 size={24} />
           </div>
           <div className="flex flex-col">
              <span className="text-2xl font-black text-white">{membros.length}</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Membros</span>
           </div>
        </Card>

        <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-2xl border border-white/5 h-fit self-center ml-4">
           {["Todos", "ADMIN", "MEMBER"].map((t) => (
             <button 
               key={t} 
               onClick={() => setFilter(t)}
               className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all ${filter === t ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
             >
                {t}
             </button>
           ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/[0.02]">
              <th className="px-8 py-5">Membro</th>
              <th className="px-8 py-5">Cargo</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5">Nível de Acesso</th>
              <th className="px-8 py-5 text-right font-bold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredMembros.map((membro) => (
              <tr key={membro.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full bg-surface-muted border border-white/10 text-primary flex items-center justify-center text-xs font-bold uppercase`}>
                      {membro.name?.substring(0, 2).toUpperCase() || "UN"}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold tracking-tight text-white`}>{membro.name || "Sem Nome"}</span>
                      <span className="text-[10px] text-zinc-500">{membro.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-sm font-medium text-zinc-400">Time Startup 180</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]`} />
                    <span className="text-sm font-medium text-zinc-300">Ativo</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <Badge variant="purple" className="px-3 py-1 scale-90 origin-left border-primary/30 text-[9px] tracking-tighter">
                      {membro.role}
                   </Badge>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="text-zinc-600 hover:text-white transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FloatingTestBot />
    </div>
  );
}
