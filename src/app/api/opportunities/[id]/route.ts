import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();

    // Validar que a oportunidade pertence à organização do usuário
    const existing = await prisma.opportunity.findUnique({
      where: { id },
      include: { lead: true }
    });

    if (!existing || existing.lead.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Oportunidade não encontrada" }, { status: 404 });
    }

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: { ...body },
      include: { lead: true }
    });

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error("Erro ao atualizar oportunidade:", error);
    return NextResponse.json({ error: "Erro ao atualizar oportunidade" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;

    // Validar que a oportunidade pertence à organização do usuário
    const existing = await prisma.opportunity.findUnique({
      where: { id },
      include: { lead: true }
    });

    if (!existing || existing.lead.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Oportunidade não encontrada" }, { status: 404 });
    }

    // Deletar tarefas vinculadas primeiro
    await prisma.taskCard.deleteMany({ where: { opportunityId: id } });
    await prisma.opportunity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir oportunidade:", error);
    return NextResponse.json({ error: "Erro ao excluir oportunidade" }, { status: 500 });
  }
}
