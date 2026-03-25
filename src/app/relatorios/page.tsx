"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { BarChart3, TrendingUp, TrendingDown, Users, Target, DollarSign, Download, ArrowUpRight, ArrowDownRight, Wallet, FileText } from "lucide-react";
import { SkeletonPage } from "@/components/ui/Skeleton";

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/reports");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Erro ao carregar relatórios:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleExport = (type: string) => {
    window.open(`/api/export/csv?type=${type}`, "_blank");
  };

  if (loading) return <SkeletonPage />;
  if (!data) return <div className="text-white p-8">Erro ao carregar relatórios.</div>;

  const s = data.summary;
  const maxRevenue = Math.max(...data.monthlyRevenue.map((m: any) => Math.max(m.income, m.expenses)), 1);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">Relatórios & Analytics</h1>
          <p className="text-zinc-500 text-sm">Visão consolidada de todas as métricas do negócio.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => handleExport("transactions")}>
            <Download size={16} /> Transações
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleExport("leads")}>
            <Download size={16} /> Leads
          </Button>
          <Button variant="neon" className="gap-2" onClick={() => handleExport("customers")}>
            <Download size={16} /> Clientes
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><TrendingUp size={20} /></div>
            <Badge variant="purple" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Receita</Badge>
          </div>
          <div className="flex flex-col"><span className="text-xs font-medium text-zinc-500">Receita Total</span><span className="text-2xl font-bold text-white">R$ {s.totalIncome.toLocaleString()}</span></div>
        </Card>
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500"><TrendingDown size={20} /></div>
            <Badge variant="danger">Despesas</Badge>
          </div>
          <div className="flex flex-col"><span className="text-xs font-medium text-zinc-500">Despesas Total</span><span className="text-2xl font-bold text-white">R$ {s.totalExpenses.toLocaleString()}</span></div>
        </Card>
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Wallet size={20} /></div>
            <Badge variant="purple" className={s.netProfit >= 0 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}>
              {s.netProfit >= 0 ? "Lucro" : "Prejuízo"}
            </Badge>
          </div>
          <div className="flex flex-col"><span className="text-xs font-medium text-zinc-500">Lucro Líquido</span><span className="text-2xl font-bold text-white">R$ {s.netProfit.toLocaleString()}</span></div>
        </Card>
        <Card className="flex flex-col gap-4" glow>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-neon"><Target size={20} /></div>
          </div>
          <div className="flex flex-col"><span className="text-xs font-medium text-zinc-500">Pipeline Total</span><span className="text-2xl font-bold text-white">R$ {s.pipelineValue.toLocaleString()}</span></div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Receita Mensal */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-white">Receita vs Despesas</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary" /><span className="text-zinc-500">Receita</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-rose-500" /><span className="text-zinc-500">Despesas</span></div>
            </div>
          </div>
          <Card className="flex items-end justify-between h-72 px-6 pb-8 pt-12">
            {data.monthlyRevenue.map((m: any, i: number) => (
              <div key={i} className="flex flex-col items-center gap-4 flex-1">
                <div className="flex items-end gap-1 h-40">
                  <div className="w-5 bg-primary/80 rounded-t-sm relative overflow-hidden transition-all hover:bg-primary" style={{ height: `${(m.income / maxRevenue) * 140}px` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-primary" />
                  </div>
                  <div className="w-5 bg-rose-500/80 rounded-t-sm relative overflow-hidden transition-all hover:bg-rose-500" style={{ height: `${(m.expenses / maxRevenue) * 140}px` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-rose-500/50 to-rose-500" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-zinc-500 tracking-tighter">{m.month}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* Resumo rápido */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-white">Resumo</h2>
          <Card className="flex flex-col gap-5">
            <SummaryRow label="Total de Leads" value={s.totalLeads} icon={<Users size={16} className="text-blue-500" />} />
            <SummaryRow label="Clientes Ativos" value={s.activeCustomers} icon={<Users size={16} className="text-emerald-500" />} />
            <SummaryRow label="MRR" value={`R$ ${s.totalMrr.toLocaleString()}`} icon={<DollarSign size={16} className="text-primary" />} />
            <SummaryRow label="Oportunidades" value={s.totalOpportunities} icon={<Target size={16} className="text-purple-500" />} />
          </Card>

          {/* Leads por Status */}
          <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Leads por Status</h2>
          <Card className="flex flex-col gap-3">
            {Object.entries(data.leadsByStatus).map(([status, count]: any) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${status === "NOVO" ? "bg-blue-500" : status === "QUALIFICADO" ? "bg-emerald-500" : "bg-primary"}`} />
                  <span className="text-xs font-bold text-zinc-400 uppercase">{status}</span>
                </div>
                <span className="text-sm font-bold text-white">{count}</span>
              </div>
            ))}
          </Card>

          {/* Pipeline por Estágio */}
          <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Pipeline por Estágio</h2>
          <Card className="flex flex-col gap-3">
            {Object.entries(data.opportunitiesByStage).map(([stage, info]: any) => (
              <div key={stage} className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase">{stage}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-500">{info.count} ops</span>
                  <span className="text-xs font-bold text-primary">R$ {info.value.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Top Clientes */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Top Clientes por MRR</h2>
          <Button variant="outline" className="gap-2" onClick={() => handleExport("customers")}>
            <FileText size={16} /> Exportar CSV
          </Button>
        </div>
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/[0.02]">
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">MRR</th>
                <th className="px-6 py-4 text-right">LTV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.topCustomers.map((c: any, i: number) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-zinc-600">{i + 1}</td>
                  <td className="px-6 py-4 text-sm font-bold text-white">{c.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${c.status === "ATIVO" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">{c.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-500">R$ {c.mrr.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-zinc-400">R$ {c.ltv.toLocaleString()}</td>
                </tr>
              ))}
              {data.topCustomers.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic text-sm">Nenhum cliente cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, icon }: { label: string; value: any; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-xs font-medium text-zinc-400">{label}</span>
      </div>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  );
}
