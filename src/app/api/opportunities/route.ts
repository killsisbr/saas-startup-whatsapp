import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let organizationId = session.user.organizationId;
  if (!organizationId) {
    const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
    organizationId = admin?.organizationId || "";
  }

  const opportunities = await prisma.opportunity.findMany({
    where: {
      lead: {
        organizationId
      }
    },
    include: { lead: true, tasks: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(opportunities);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { title, value, status, leadId: providedLeadId } = await req.json();

  let leadId = providedLeadId;

  if (!leadId) {
    const lead = await prisma.lead.create({
      data: {
        name: title,
        phone: '00000000', // Placeholder para criação manual via Kanban
        organizationId: session.user.organizationId,
      },
    });
    leadId = lead.id;
  }

  const opportunity = await prisma.opportunity.create({
    data: {
      title,
      value: value || 0,
      stage: status || "CONTATO",
      leadId,
    },
  });

  return NextResponse.json(opportunity);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id, ...data } = await req.json();

  const opportunity = await prisma.opportunity.update({
    where: { id },
    data,
  });

  return NextResponse.json(opportunity);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    await prisma.opportunity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar oportunidade:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
