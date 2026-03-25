import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const orgId = session.user.organizationId;

  const [transactions, leads, customers, opportunities] = await Promise.all([
    prisma.transaction.findMany({ where: { organizationId: orgId }, orderBy: { date: "desc" } }),
    prisma.lead.findMany({ where: { organizationId: orgId }, include: { opportunities: true } }),
    prisma.customer.findMany({ where: { organizationId: orgId } }),
    prisma.opportunity.findMany({ where: { lead: { organizationId: orgId } }, include: { lead: true } }),
  ]);

  // Receita mensal (últimos 6 meses)
  const now = new Date();
  const monthlyRevenue: { month: string; income: number; expenses: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthLabel = d.toLocaleString("pt-BR", { month: "short" }).toUpperCase();
    
    const income = transactions
      .filter(t => (t.type === "INCOME" || t.type === "ENTRADA") && new Date(t.date) >= d && new Date(t.date) < nextMonth)
      .reduce((acc, t) => acc + t.amount, 0);
    
    const expenses = transactions
      .filter(t => (t.type === "EXPENSE" || t.type === "SAIDA") && new Date(t.date) >= d && new Date(t.date) < nextMonth)
      .reduce((acc, t) => acc + t.amount, 0);

    monthlyRevenue.push({ month: monthLabel, income, expenses });
  }

  // Leads por estágio
  const leadsByStatus: Record<string, number> = {};
  leads.forEach(l => {
    leadsByStatus[l.status] = (leadsByStatus[l.status] || 0) + 1;
  });

  // Oportunidades por estágio
  const opportunitiesByStage: Record<string, { count: number; value: number }> = {};
  opportunities.forEach(o => {
    if (!opportunitiesByStage[o.stage]) opportunitiesByStage[o.stage] = { count: 0, value: 0 };
    opportunitiesByStage[o.stage].count++;
    opportunitiesByStage[o.stage].value += o.value;
  });

  // Top clientes por MRR
  const topCustomers = [...customers]
    .sort((a, b) => b.mrr - a.mrr)
    .slice(0, 5)
    .map(c => ({ name: c.name, mrr: c.mrr, ltv: c.ltv, status: c.status }));

  // Resumo geral
  const totalIncome = transactions.filter(t => t.type === "INCOME" || t.type === "ENTRADA").reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "EXPENSE" || t.type === "SAIDA").reduce((acc, t) => acc + t.amount, 0);
  const totalMrr = customers.reduce((acc, c) => acc + c.mrr, 0);
  const activeCustomers = customers.filter(c => c.status === "ATIVO").length;

  return NextResponse.json({
    monthlyRevenue,
    leadsByStatus,
    opportunitiesByStage,
    topCustomers,
    summary: {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      totalMrr,
      totalLeads: leads.length,
      totalCustomers: customers.length,
      activeCustomers,
      totalOpportunities: opportunities.length,
      pipelineValue: opportunities.reduce((acc, o) => acc + o.value, 0),
    }
  });
}
