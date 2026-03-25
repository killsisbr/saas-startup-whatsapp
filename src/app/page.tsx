import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign, 
  ArrowUpRight, 
  Activity,
  AlertCircle,
  ChevronRight,
  MessageSquare,
  Presentation
} from "lucide-react";
import Link from "next/link";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) return <div>Redirecionando...</div>;

  const orgId = session.user.organizationId;

  // Fetch real data
  const leads = await prisma.lead.count({ where: { organizationId: orgId } });
  const customers = await prisma.customer.findMany({ where: { organizationId: orgId } });
  const totalMrr = customers.reduce((acc, c) => acc + c.mrr, 0);
  
  // Conversão real: clientes ativos / leads totais
  const activeCustomers = customers.filter(c => c.status === "ATIVO").length;
  const conversionRate = leads > 0 ? ((activeCustomers / leads) * 100).toFixed(1) : "0.0";
  
  // Churn real: clientes inativos / total de clientes
  const inactiveCustomers = customers.filter(c => c.status !== "ATIVO").length;
  const churnRate = customers.length > 0 ? ((inactiveCustomers / customers.length) * 100).toFixed(1) : "0.0";

  // Alertas reais: transações recentes (últimos 7 dias)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentTransactions = await prisma.transaction.count({
    where: { organizationId: orgId, type: { in: ["EXPENSE", "SAIDA"] }, date: { gte: sevenDaysAgo } }
  });

  const pendingLeads = await prisma.lead.count({
    where: { organizationId: orgId, status: "NOVO" }
  });
  
  const recentActivities = await prisma.opportunity.findMany({
    where: { lead: { organizationId: orgId } },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { lead: true }
  });

  // Status de captação: baseado em oportunidades fechadas vs total
  const totalOpportunities = await prisma.opportunity.count({ where: { lead: { organizationId: orgId } } });
  const closedOpportunities = await prisma.opportunity.count({ where: { lead: { organizationId: orgId }, stage: "FECHAMENTO" } });
  const captacaoPercent = totalOpportunities > 0 ? Math.round((closedOpportunities / totalOpportunities) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Painel de Controle</h1>
        <p className="text-zinc-500 text-sm font-bold tracking-widest uppercase">Growth Engine Overview • Startup 180</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={<Target className="text-primary" />} label="Conversão Funil" value={`${conversionRate}%`} trend={`${activeCustomers} clientes`} />
        <MetricCard icon={<Users className="text-blue-500" />} label="Novos Leads" value={leads.toString()} trend={`${pendingLeads} novos`} />
        <MetricCard icon={<DollarSign className="text-emerald-500" />} label="Receita Mensal" value={`R$ ${(totalMrr/1000).toFixed(0)}k`} trend={`${activeCustomers} ativos`} />
        <MetricCard icon={<Activity className="text-purple-500" />} label="Churn Rate" value={`${churnRate}%`} trend={`${inactiveCustomers} inativos`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
             <Activity size={20} className="text-primary" />
             Atividade Recente
          </h2>
          <div className="flex flex-col gap-3">
             {recentActivities.length > 0 ? recentActivities.map(act => (
                <ActivityItem 
                  key={act.id}
                  icon={<Target size={16} className="text-primary" />} 
                  title={act.title} 
                  desc={`Oportunidade de R$ ${act.value.toLocaleString()} vinculada a ${act.lead.name}`} 
                  time={new Date(act.createdAt).toLocaleDateString()} 
                />
             )) : (
                <div className="p-6 glass-card text-center text-zinc-500 text-sm italic">
                   Nenhuma atividade recente. Crie oportunidades no CRM.
                </div>
             )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-white">Alertas do Sistema</h2>
          {pendingLeads > 0 || recentTransactions > 0 ? (
            <Card className="flex flex-col gap-4 border-l-4 border-l-rose-500">
               <div className="flex items-center gap-3 text-rose-500">
                  <AlertCircle size={20} />
                  <span className="text-sm font-bold">Ação Necessária</span>
               </div>
               <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  {pendingLeads > 0 && `Você possui ${pendingLeads} leads novos aguardando qualificação. `}
                  {recentTransactions > 0 && `${recentTransactions} despesas registradas nos últimos 7 dias.`}
               </p>
               <Link href="/crm" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-widest">
                  Resolver agora
                  <ChevronRight size={12} />
               </Link>
            </Card>
          ) : (
            <Card className="flex flex-col gap-4 border-l-4 border-l-emerald-500">
               <div className="flex items-center gap-3 text-emerald-500">
                  <Activity size={20} />
                  <span className="text-sm font-bold">Tudo em dia</span>
               </div>
               <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  Nenhuma pendência crítica encontrada.
               </p>
            </Card>
          )}
          
          <Card className="bg-primary/5 border-primary/20 flex flex-col gap-4">
             <h3 className="text-sm font-bold text-white">Status da Pipeline</h3>
             <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{captacaoPercent}%</span>
                <span className="text-xs text-zinc-500">{closedOpportunities}/{totalOpportunities} oportunidades</span>
             </div>
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-neon shadow-neon" style={{ width: `${captacaoPercent}%` }} />
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, trend }: any) {
  return (
    <Card className="flex flex-col gap-4 group hover:scale-[1.02] active:scale-95 transition-all cursor-pointer">
       <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/20 transition-colors">
             {icon}
          </div>
          <Badge variant="purple" className="text-zinc-400 bg-white/5 border-white/10">
             {trend}
          </Badge>
       </div>
       <div className="flex flex-col">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
          <span className="text-2xl font-black text-white tracking-tighter">{value}</span>
       </div>
    </Card>
  );
}

function ActivityItem({ icon, title, desc, time }: any) {
  return (
    <div className="p-4 glass-card border-none bg-white/[0.02] hover:bg-white/[0.05] transition-colors flex items-center gap-4 group">
       <div className="w-10 h-10 rounded-full bg-surface-muted border border-white/5 flex items-center justify-center shrink-0 group-hover:border-primary/20 transition-all">
          {icon}
       </div>
       <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-bold text-white tracking-tight">{title}</span>
          <p className="text-[11px] text-zinc-500 truncate">{desc}</p>
       </div>
       <span className="text-[10px] font-bold text-zinc-600 uppercase italic">{time}</span>
    </div>
  );
}
