import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { syncRecentHistory } from "@/lib/whatsappService";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await syncRecentHistory(userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao sincronizar WhatsApp:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
