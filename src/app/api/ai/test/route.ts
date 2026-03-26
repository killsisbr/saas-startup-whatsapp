import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { handleSalesMessage } from "@/lib/ai/salesAiService";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { message } = await req.json();
    const testPhone = "5500000000000"; // Número reservado para simulação

    // Garantir que existe um lead de teste para a organização
    let lead = await prisma.lead.findFirst({
      where: { phone: testPhone }
    });

    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          phone: testPhone,
          name: "Test User (Simulação)",
          organizationId: session.user.organizationId,
          status: "SIMULACAO"
        }
      });
    }

    // Processar mensagem via engine de vendas
    const response = await handleSalesMessage(session.user.organizationId, testPhone, message);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Erro no teste de IA:", error);
    return NextResponse.json({ error: "Erro interno no simulador" }, { status: 500 });
  }
}
