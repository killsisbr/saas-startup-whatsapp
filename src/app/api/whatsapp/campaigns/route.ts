import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { processCampaign, stopCampaign, pauseCampaign, resumeCampaign } from "@/lib/campaignService";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    const campaigns = await prisma.campaign.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: { 
        logs: { 
          take: 50, 
          orderBy: { createdAt: 'desc' } 
        } 
      }
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Erro ao buscar campanhas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const organizationId = (session.user as any).organizationId;
    const { name, message, targetTags } = await req.json();

    if (!name || !message) {
      return NextResponse.json({ error: "Nome e mensagem são obrigatórios" }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        message,
        targetTags,
        organizationId,
        status: 'PENDING'
      }
    });

    // Inicia o processamento asíncrono
    processCampaign(campaign.id, userId).catch(console.error);

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Erro ao criar campanha:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id, action } = await req.json();

    if (action === 'pause') {
      pauseCampaign(id);
      await prisma.campaign.update({ where: { id }, data: { status: 'PAUSED' } });
    } else if (action === 'resume') {
      resumeCampaign(id);
      const userId = (session.user as any).id;
      processCampaign(id, userId).catch(console.error);
    } else if (action === 'stop') {
      stopCampaign(id);
      await prisma.campaign.update({ where: { id }, data: { status: 'FAILED' } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao alterar status da campanha:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
