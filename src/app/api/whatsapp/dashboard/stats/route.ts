import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;

    const totalMessages = await (prisma as any).message.count({ where: { organizationId } });
    const receivedMessages = await (prisma as any).message.count({ where: { organizationId, sender: 'lead' } });
    const sentMessages = await (prisma as any).message.count({ where: { organizationId, sender: 'me' } });

    const totalCampaigns = await (prisma as any).campaign.count({ where: { organizationId } });
    const completedCampaigns = await (prisma as any).campaign.count({ where: { organizationId, status: 'COMPLETED' } });

    const recentLeads = await (prisma as any).lead.count({ 
      where: { 
        organizationId, 
        updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      } 
    });

    return NextResponse.json({
      totalMessages,
      receivedMessages,
      sentMessages,
      totalCampaigns,
      completedCampaigns,
      recentLeads
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
