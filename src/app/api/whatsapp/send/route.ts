import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 400 });
    }

    const { phone, message, leadId } = await req.json();

    if (!phone || !message || !leadId) {
      return NextResponse.json({ error: "Telefone, mensagem e leadId são obrigatórios" }, { status: 400 });
    }

    console.log(`[JARVIS] Enviando mensagem para ${phone}: ${message}`);

    // Salvar a mensagem original do usuário (CRM) no banco de dados
    const sentMessage = await prisma.message.create({
      data: {
        text: message,
        sender: "me",
        leadId,
        organizationId
      }
    });

    // Atualiza o score do Lead por interação ativa e o status se for NOVO
    await prisma.lead.update({
      where: { id: leadId },
      data: { 
        score: { increment: 5 },
        status: "EM ANDAMENTO",
        updatedAt: new Date()
      }
    });

    // REAL WHATSAPP SENDING
    try {
        const { sendMessage } = require("@/lib/whatsappService");
        const userId = (session.user as any).id;
        await sendMessage(userId, phone, message);
        console.log(`[WA] Mensagem real enviada para ${phone}`);
    } catch (err: any) {
        console.error("[WA] Falha ao enviar mensagem real:", err.message);
        // Opcional: Marcar a mensagem como falha no banco se necessário
    }

    return NextResponse.json({ success: true, message: sentMessage, timestamp: sentMessage.createdAt });
  } catch (error: any) {
    console.error("Erro ao enviar mensagem:", error);
    return NextResponse.json({ error: "Erro interno ao enviar mensagem" }, { status: 500 });
  }
}
