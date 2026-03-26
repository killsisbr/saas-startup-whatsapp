import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "tmp", "ai-api-debug.log");
function logToFile(msg: string) {
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      console.error("[AI Config API] GET - Sem organização na sessão", session?.user);
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    let config = await (prisma as any).aiAgentConfig.findUnique({
      where: { organizationId: orgId }
    });

    if (!config) {
      console.log("[AI Config API] GET - Criando config padrão para org:", orgId);
      config = await (prisma as any).aiAgentConfig.create({
        data: {
          organizationId: orgId,
          name: "Membro Digital (Alpha)",
          temperament: "Especialista rápido e prestativo.",
          bio: "Vendedor de altíssima conversão pronto para qualificar leads.",
          products: "1. Starter: R$ 49/mês\n2. Pro: R$ 99/mês\n3. Enterprise: R$ 299/mês"
        }
      });
    }

    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Erro ao buscar config IA:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      console.error("[AI Config API] PATCH - Sem organização na sessão", session?.user);
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { name, temperament, bio, products, active } = await req.json();
    const orgId = session.user.organizationId;

    console.log("[AI Config API] PATCH - Salvando para org:", orgId, { name, active });

    const config = await (prisma as any).aiAgentConfig.upsert({
      where: { organizationId: orgId },
      update: {
        name,
        temperament,
        bio,
        products,
        active
      },
      create: {
        organizationId: orgId,
        name,
        temperament,
        bio,
        products,
        active
      }
    });

    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Erro ao salvar config IA:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
