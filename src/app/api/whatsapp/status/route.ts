import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getWhatsAppSession, initializeWhatsAppClient, logoutWhatsApp } from "@/lib/whatsappService";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    let waSession = await getWhatsAppSession(userId);

    // Se a sessão não existe na memória, tenta inicializar automaticamente
    if (!waSession) {
      console.log(`Iniciando auto-restauração para ${userId}`);
      waSession = await initializeWhatsAppClient(userId);
    }

    return NextResponse.json({
      status: waSession.status,
      qrCode: waSession.qrCode,
      whatsappNumber: waSession.whatsappNumber,
    });
  } catch (error) {
    console.error("Erro ao buscar status do WhatsApp:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const waSession = await initializeWhatsAppClient(userId);

    return NextResponse.json({
      status: waSession.status,
      qrCode: waSession.qrCode,
    });
  } catch (error) {
    console.error("Erro ao inicializar WhatsApp:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await logoutWhatsApp(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao desconectar WhatsApp:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
