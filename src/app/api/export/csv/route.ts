import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

function toCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.join(",");
  const dataLines = rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(","));
  return [headerLine, ...dataLines].join("\n");
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const orgId = session.user.organizationId;

  let csv = "";
  let filename = "export.csv";

  switch (type) {
    case "leads": {
      const leads = await prisma.lead.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } });
      csv = toCsv(
        ["Nome", "Email", "Telefone", "Status", "Score", "Criado em"],
        leads.map(l => [l.name, l.email || "", l.phone || "", l.status, l.score.toString(), new Date(l.createdAt).toLocaleDateString()])
      );
      filename = "leads.csv";
      break;
    }
    case "customers": {
      const customers = await prisma.customer.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } });
      csv = toCsv(
        ["Nome", "Domínio", "MRR", "LTV", "Status", "Criado em"],
        customers.map(c => [c.name, c.domain || "", c.mrr.toString(), c.ltv.toString(), c.status, new Date(c.createdAt).toLocaleDateString()])
      );
      filename = "clientes.csv";
      break;
    }
    case "transactions": {
      const transactions = await prisma.transaction.findMany({ where: { organizationId: orgId }, orderBy: { date: "desc" } });
      csv = toCsv(
        ["Descrição", "Valor", "Tipo", "Categoria", "Data"],
        transactions.map(t => [t.description, t.amount.toString(), t.type, t.category || "", new Date(t.date).toLocaleDateString()])
      );
      filename = "transacoes.csv";
      break;
    }
    case "opportunities": {
      const opportunities = await prisma.opportunity.findMany({
        where: { lead: { organizationId: orgId } },
        include: { lead: true },
        orderBy: { createdAt: "desc" }
      });
      csv = toCsv(
        ["Título", "Lead", "Valor", "Estágio", "Criado em"],
        opportunities.map(o => [o.title, o.lead.name, o.value.toString(), o.stage, new Date(o.createdAt).toLocaleDateString()])
      );
      filename = "oportunidades.csv";
      break;
    }
    default:
      return NextResponse.json({ error: "Tipo inválido. Use: leads, customers, transactions, opportunities" }, { status: 400 });
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
