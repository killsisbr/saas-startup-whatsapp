"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Presentation, Target, TrendingUp, DollarSign, Users, Wallet, Clock } from "lucide-react";
import { SkeletonPage } from "@/components/ui/Skeleton";

export default function PitchPage() {
  const [loading, setLoading] = useState(true);
  const [finData, setFinData] = useState<any>(null);
  const [repData, setRepData] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/finance").then(r => r.json()),
      fetch("/api/reports").then(r => r.json()),
    ]).then(([fin, rep]) => {
      setFinData(fin);
      setRepData(rep);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonPage />;

  const stats = finData?.stats || {};
  const summary = repData?.summary || {};

  const totalIncome = stats.totalIncome || 0;
  const totalExpenses = stats.totalExpenses || 0;
  const monthlyBurn = totalExpenses > 0 ? Math.round(totalExpenses / 6) : 0;
  const netCash = totalIncome - totalExpenses;
  const runway = monthlyBurn > 0 ? Math.round(netCash / monthlyBurn) : 0;
  const ltv = stats.totalLtv || 0;
  const mrr = stats.totalMrr || 0;
  const activeCount = stats.activeCount || 0;
  const avgLTV = activeCount > 0 ? Math.round(ltv / activeCount) : 0;
  const pipelineValue = summary.pipelineValue || 0;
  const totalLeads = summary.totalLeads || 0;
  const cac = totalLeads > 0 ? Math.round(totalExpenses / totalLeads) : 0;
  const ltvCacRatio = cac > 0 ? (avgLTV / cac).toFixed(1) : "N/A";

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-white tracking-tight">Pitch & Investidores</h1>
        <p className="text-zinc-500 text-sm">Métricas para apresentação a investidores — dados em tempo real.</p>
      </div>

      {/* Hero Section */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 p-8">
          <div className="flex flex-col gap-4 flex-1">
            <Badge variant="purple" className="w-fit">PITCH DECK</Badge>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">STARTUP 180</h2>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
              Plataforma SaaS de Growth Management com CRM integrado, analytics em tempo real e automação de pipeline.
            </p>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-primary">{activeCount}</span>
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Clientes Ativos</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-white">R$ {mrr.toLocaleString()}</span>
                <span className="text-[10px] text-zinc-500 uppercase font-bold">MRR</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-emerald-500">R$ {pipelineValue.toLocaleString()}</span>
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Pipeline</span>
              </div>
            </div>
          </div>
          <div className="w-40 h-40 rounded-3xl bg-gradient-neon shadow-neon flex items-center justify-center">
            <Presentation size={64} className="text-white/80" />
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <TrendingUp size={20} />
            </div>
            <Badge variant="danger">Queima</Badge>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-zinc-500">Net Burn Rate</span>
            <span className="text-2xl font-bold text-white">R$ {monthlyBurn.toLocaleString()}/mês</span>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock size={20} />
            </div>
            <Badge variant="purple" className={runway > 6 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}>
              {runway > 12 ? "Saudável" : runway > 6 ? "Atenção" : "Crítico"}
            </Badge>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-zinc-500">Runway</span>
            <span className="text-2xl font-bold text-white">{runway > 0 ? `${runway} meses` : "N/A"}</span>
          </div>
        </Card>

        <Card className="flex flex-col gap-4" glow>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-neon">
              <DollarSign size={20} />
            </div>
            <Badge variant="purple" className="bg-primary/10 text-primary border-primary/20">Unit Economics</Badge>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-zinc-500">LTV / CAC</span>
            <span className="text-2xl font-bold text-white">{ltvCacRatio}x</span>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Wallet size={20} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-zinc-500">Saldo Líquido</span>
            <span className={`text-2xl font-bold ${netCash >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              R$ {netCash.toLocaleString()}
            </span>
          </div>
        </Card>
      </div>

      {/* Detalhe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="flex flex-col gap-6">
          <h3 className="text-lg font-bold text-white">Unit Economics Detalhado</h3>
          <div className="flex flex-col gap-4">
            <DetailRow label="LTV Médio" value={`R$ ${avgLTV.toLocaleString()}`} />
            <DetailRow label="CAC" value={`R$ ${cac.toLocaleString()}`} />
            <DetailRow label="LTV:CAC Ratio" value={`${ltvCacRatio}x`} highlight />
            <DetailRow label="MRR por Cliente" value={activeCount > 0 ? `R$ ${Math.round(mrr / activeCount).toLocaleString()}` : "N/A"} />
            <DetailRow label="Total de Leads" value={totalLeads.toString()} />
          </div>
        </Card>

        <Card className="flex flex-col gap-6">
          <h3 className="text-lg font-bold text-white">Visão da Pipeline</h3>
          {repData?.opportunitiesByStage && Object.keys(repData.opportunitiesByStage).length > 0 ? (
            <div className="flex flex-col gap-4">
              {Object.entries(repData.opportunitiesByStage).map(([stage, info]: any) => (
                <div key={stage} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-xs font-bold text-zinc-400 uppercase">{stage}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-zinc-500">{info.count} oportunidades</span>
                    <span className="text-sm font-bold text-primary">R$ {info.value.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-600 italic">Nenhuma oportunidade na pipeline.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <span className={`text-sm font-bold ${highlight ? "text-primary" : "text-white"}`}>{value}</span>
    </div>
  );
}
