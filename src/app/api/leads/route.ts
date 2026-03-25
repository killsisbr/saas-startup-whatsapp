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

  const leads = await prisma.lead.findMany({
    where: { organizationId },
    include: { opportunities: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leads);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const data = await req.json();

  const lead = await prisma.lead.create({
    data: {
      ...data,
      organizationId: session.user.organizationId,
      consentGiven: data.consentGiven || false,
      consentDate: data.consentGiven ? new Date() : null,
    },
  });

  return NextResponse.json(lead);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const lead = await prisma.lead.update({
    where: { id },
    data: { ...data, updatedAt: new Date() },
  });

  return NextResponse.json(lead);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  // Deletar oportunidades vinculadas primeiro
  const opportunities = await prisma.opportunity.findMany({ where: { leadId: id } });
  for (const opp of opportunities) {
    await prisma.taskCard.deleteMany({ where: { opportunityId: opp.id } });
  }
  await prisma.opportunity.deleteMany({ where: { leadId: id } });
  await prisma.lead.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
