import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId;

  const [customers, transactions] = await Promise.all([
    prisma.customer.findMany({
      where: { organizationId },
      include: { subscriptions: true },
    }),
    prisma.transaction.findMany({
      where: { organizationId },
      orderBy: { date: "desc" },
    }),
  ]);

  // Cálculo de métricas agregadas
  const totalMrr = customers.reduce((acc: number, c: any) => acc + (c.mrr || 0), 0);
  const totalLtv = customers.reduce((acc: number, c: any) => acc + (c.ltv || 0), 0);
  
  const totalIncome = transactions
    .filter((t: any) => t.type === "INCOME" || t.type === "ENTRADA")
    .reduce((acc: number, t: any) => acc + t.amount, 0);

  const totalExpenses = transactions
    .filter((t: any) => t.type === "EXPENSE" || t.type === "SAIDA")
    .reduce((acc: number, t: any) => acc + t.amount, 0);

  // Gráfico mensal dinâmico (últimos 6 meses)
  const now = new Date();
  const monthlyChart: { month: string; income: number; expenses: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthLabel = d.toLocaleString("pt-BR", { month: "short" }).toUpperCase();
    
    const inc = transactions
      .filter((t: any) => (t.type === "INCOME" || t.type === "ENTRADA") && new Date(t.date) >= d && new Date(t.date) < nextMonth)
      .reduce((acc: number, t: any) => acc + t.amount, 0);
    
    const exp = transactions
      .filter((t: any) => (t.type === "EXPENSE" || t.type === "SAIDA") && new Date(t.date) >= d && new Date(t.date) < nextMonth)
      .reduce((acc: number, t: any) => acc + t.amount, 0);

    monthlyChart.push({ month: monthLabel, income: inc, expenses: exp });
  }

  // Comparativo de despesas com mês anterior
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonthExpenses = transactions
    .filter((t: any) => (t.type === "EXPENSE" || t.type === "SAIDA") && new Date(t.date) >= thisMonth)
    .reduce((acc: number, t: any) => acc + t.amount, 0);
  const lastMonthExpenses = transactions
    .filter((t: any) => (t.type === "EXPENSE" || t.type === "SAIDA") && new Date(t.date) >= lastMonth && new Date(t.date) < thisMonth)
    .reduce((acc: number, t: any) => acc + t.amount, 0);
  const expenseChange = lastMonthExpenses > 0 ? Math.round(((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100) : 0;

  return NextResponse.json({
    customers,
    transactions,
    monthlyChart,
    stats: {
      totalMrr,
      totalLtv,
      totalIncome,
      totalExpenses,
      activeCount: customers.filter((c: any) => c.status === 'ATIVO').length,
      expenseChange,
    }
  });
}
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { description, amount, type, category, date } = await req.json();

  let organizationId = session.user.organizationId;
  if (!organizationId) {
    const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
    organizationId = admin?.organizationId || "";
  }

  const transaction = await prisma.transaction.create({
    data: {
      description,
      amount: parseFloat(amount),
      type,
      category,
      date: new Date(date),
      organizationId,
    },
  });

  return NextResponse.json(transaction);
}
