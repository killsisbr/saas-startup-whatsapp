"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Users, DollarSign, TrendingDown, Star, Filter, Plus, ArrowUpRight, ArrowDownRight, MoreVertical, Download } from "lucide-react";

import NewCustomerModal from "@/components/modals/NewCustomerModal";
import { SkeletonPage } from "@/components/ui/Skeleton";

export default function ClientesPage() {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<any[]>([]);
  const [filter, setFilter] = useState("Todos");
  const [activeTab, setActiveTab] = useState("Base Ativa");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <SkeletonPage />;

  // Filtro por tab
  const tabFiltered = activeTab === "Churn Recente" 
    ? clientes.filter(c => c.status !== "ATIVO")
    : activeTab === "Upsell"
    ? clientes.filter(c => c.status === "ATIVO" && c.mrr > 0).sort((a, b) => b.mrr - a.mrr)
    : clientes.filter(c => c.status === "ATIVO");

  const filteredClientes = filter === "Todos" 
    ? tabFiltered 
    : tabFiltered.filter(c => c.status === filter.toUpperCase());

  const totalMrr = clientes.filter(c => c.status === "ATIVO").reduce((acc, c) => acc + (c.mrr || 0), 0);
  const activeCount = clientes.filter(c => c.status === "ATIVO").length;
  const inactiveCount = clientes.filter(c => c.status !== "ATIVO").length;
  const churnRate = clientes.length > 0 ? ((inactiveCount / clientes.length) * 100).toFixed(1) : "0.0";
  const avgMrr = activeCount > 0 ? Math.round(totalMrr / activeCount) : 0;

  const handleExport = () => window.open("/api/export/csv?type=customers", "_blank");

  return (
    <div className="flex flex-col gap-8">
      <NewCustomerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
      />
      <div className="flex items-center gap-8 border-b border-border pb-1">
        <h1 className="text-3xl font-bold text-gradient pr-4">Clientes</h1>
        <div className="flex gap-6">
          {["Base Ativa", "Churn Recente", "Upsell"].map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`text-sm font-bold pb-4 transition-all ${activeTab === tab ? "text-primary border-b-2 border-primary" : "text-zinc-500 hover:text-zinc-300"}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
              <ArrowUpRight size={14} />
              +5%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-zinc-500 tracking-tight">Total de Clientes</span>
            <span className="text-3xl font-bold text-white">{clientes.length}</span>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign size={20} />
            </div>
            <span className="text-xs font-medium text-zinc-500">Mensal</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-zinc-500 tracking-tight">MRR</span>
            <span className="text-3xl font-bold text-white">R$ {(totalMrr / 1000).toFixed(0)}k</span>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <TrendingDown size={20} />
            </div>
            <span className={`text-xs font-bold flex items-center gap-0.5 ${parseFloat(churnRate) > 5 ? 'text-rose-500' : 'text-emerald-500'}`}>
              <ArrowDownRight size={14} />
              {churnRate}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-zinc-500 tracking-tight">Churn Rate</span>
            <span className="text-3xl font-bold text-white">{churnRate}%</span>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Star size={20} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-zinc-500 tracking-tight">MRR Médio / Cliente</span>
            <span className="text-3xl font-bold text-white">R$ {avgMrr.toLocaleString()}</span>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter size={16} />
              Filtrar
            </Button>
          <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-xl border border-white/5 ml-4">
              {["Todos", "Ativos", "Pausados"].map((f) => (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === f ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download size={16} />
            Exportar CSV
          </Button>
          <Button variant="neon" size="lg" className="gap-2 px-8" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            Adicionar Cliente
          </Button>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/[0.02]">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Receita (MRR)</th>
                <th className="px-6 py-4 text-right">Cadastrado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                        <Users size={18} className="text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white tracking-tight">{cliente.name}</span>
                        <span className="text-[10px] text-zinc-500">{cliente.domain}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${cliente.status === 'ATIVO' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                       <span className="text-sm font-medium text-zinc-300 uppercase text-[10px]">{cliente.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">R$ {cliente.mrr?.toLocaleString()}</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">LTV R$ {cliente.ltv?.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-4">
                       <span className="text-xs text-zinc-500">{new Date(cliente.createdAt).toLocaleDateString()}</span>
                       <button className="text-zinc-600 hover:text-white transition-colors">
                          <MoreVertical size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-zinc-500 italic text-sm">Nenhum cliente cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
