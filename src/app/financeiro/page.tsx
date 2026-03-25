"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { TrendingUp, TrendingDown, Wallet, Landmark, Plus, ArrowRight, AlertCircle, FileText, Download } from "lucide-react";

import NewTransactionModal from "@/components/modals/NewTransactionModal";
import { SkeletonPage } from "@/components/ui/Skeleton";

export default function FinanceiroPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/finance");
      const data = await res.json();
      setStats(data || null);
    } catch (error) {
      console.error("Erro ao buscar dados financeiros:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <SkeletonPage />;

  const chartData = stats?.monthlyChart || [];
  const maxChart = Math.max(...chartData.map((m: any) => Math.max(m.income, m.expenses)), 1);
  const expenseChange = stats?.stats?.expenseChange || 0;

  const handleExport = () => {
    window.open("/api/export/csv?type=transactions", "_blank");
  };
  
  return (
    <div className="flex flex-col gap-8 pb-10 relative">
      <NewTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
      />
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
           <h1 className="text-3xl font-bold text-white tracking-tight">Financeiro Dashboard</h1>
           <p className="text-zinc-500 text-sm">Visão geral do fluxo de caixa e obrigações da Startup 180.</p>
         </div>
         <div className="flex items-center gap-4">
            <Button variant="outline" className="gap-2" onClick={() => setIsModalOpen(true)}>
               <Plus size={18} className="text-primary" />
               Nova Receita
            </Button>
            <Button variant="neon" className="gap-2" onClick={() => setIsModalOpen(true)}>
               <Plus size={18} />
               Nova Despesa
            </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col gap-4">
           <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp size={20} />
           </div>
            <div className="flex flex-col gap-1">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Faturamento Total</span>
                  <Badge variant="purple">MRR: R$ {stats?.stats?.totalMrr?.toLocaleString() || "0"}</Badge>
               </div>
               <span className="text-2xl font-bold text-white tracking-tight">R$ {stats?.stats?.totalIncome?.toLocaleString() || "0,00"}</span>
            </div>
        </Card>

        <Card className="flex flex-col gap-4">
           <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <TrendingDown size={20} />
           </div>
           <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                 <span className="text-xs font-medium text-zinc-500">Despesas</span>
                 <Badge variant={expenseChange <= 0 ? "success" : "danger"}>
                   {expenseChange > 0 ? "+" : ""}{expenseChange}% vs mês ant.
                 </Badge>
              </div>
               <span className="text-2xl font-bold text-white tracking-tight">R$ {stats?.stats?.totalExpenses?.toLocaleString() || "0,00"}</span>
           </div>
        </Card>

        <Card className="flex flex-col gap-4">
           <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Wallet size={20} />
           </div>
           <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                 <span className="text-xs font-medium text-zinc-500">LTV Estimado</span>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">R$ {stats?.stats?.totalLtv?.toLocaleString() || "0,00"}</span>
           </div>
        </Card>

        <Card className="flex flex-col gap-4" glow>
           <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-neon">
              <Landmark size={20} />
           </div>
           <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-500">Clientes Ativos</span>
              <span className="text-2xl font-bold text-white tracking-tight">{stats?.stats?.activeCount || 0}</span>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
           <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                 <h2 className="text-xl font-bold text-white">Fluxo de Caixa Mensal</h2>
                 <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Entradas vs Saídas (Últimos 6 meses)</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary" /><span className="text-zinc-500">Receita</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-rose-500" /><span className="text-zinc-500">Despesas</span></div>
              </div>
           </div>

           <Card className="flex items-end justify-between h-64 px-10 pb-8">
              {chartData.map((m: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-4 flex-1">
                  <div className="flex items-end gap-1 h-36">
                    <div className="w-5 bg-primary/80 rounded-t-sm relative overflow-hidden" style={{ height: `${(m.income / maxChart) * 130}px` }}>
                       <div className="absolute inset-0 bg-gradient-neon shadow-neon" />
                    </div>
                    <div className="w-5 bg-rose-500/80 rounded-t-sm relative overflow-hidden" style={{ height: `${(m.expenses / maxChart) * 130}px` }}>
                       <div className="absolute inset-0 bg-gradient-to-t from-rose-500/50 to-rose-500" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 tracking-tighter">{m.month}</span>
                </div>
              ))}
              {chartData.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm italic">Sem dados para exibir. Cadastre transações.</div>
              )}
           </Card>
        </div>

         <div className="flex flex-col gap-6">
            <h2 className="text-xl font-bold text-white uppercase tracking-widest text-[10px]">Transações Recentes</h2>
            <Card className="flex flex-col gap-4 max-h-[400px] overflow-y-auto custom-scrollbar">
               {stats?.transactions?.length > 0 ? (
                 stats.transactions.slice(0, 10).map((t: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                       <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">{t.description}</span>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase">{new Date(t.date).toLocaleDateString()}</span>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className={`text-sm font-bold ${t.type === 'INCOME' || t.type === 'ENTRADA' ? 'text-primary' : 'text-rose-500'}`}>
                             {t.type === 'INCOME' || t.type === 'ENTRADA' ? '+' : '-'} R$ {t.amount.toLocaleString()}
                          </span>
                          <Badge variant="info" className="text-[8px] py-0">{t.category}</Badge>
                       </div>
                    </div>
                 ))
               ) : (
                 <p className="text-xs text-zinc-600 italic">Nenhuma transação registrada.</p>
               )}
            </Card>

            <h2 className="text-xl font-bold text-white">Ações Rápidas</h2>
            <div className="flex flex-col gap-2">
               <QuickActionButton 
                 icon={<Plus size={18} className="text-primary" />} 
                 label="Nova Receita" 
                 onClick={() => setIsModalOpen(true)}
               />
               <QuickActionButton 
                 icon={<MinusIcon />} 
                 label="Nova Despesa" 
                 onClick={() => setIsModalOpen(true)}
               />
               <QuickActionButton 
                 icon={<Download size={18} className="text-zinc-400" />} 
                 label="Exportar Relatório" 
                 onClick={handleExport}
               />
            </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center justify-between p-4 glass-card hover:bg-white/5 transition-colors text-left group w-full"
    >
       <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center border border-white/5 group-hover:border-primary/20">
             {icon}
          </div>
          <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{label}</span>
       </div>
       <ArrowRight size={16} className="text-zinc-600 group-hover:text-primary transition-colors" />
    </button>
  );
}

function MinusIcon() {
  return (
    <div className="w-4 h-4 rounded-full border-2 border-rose-500/50 flex items-center justify-center">
       <div className="w-2 h-0.5 bg-rose-500" />
    </div>
  );
}
