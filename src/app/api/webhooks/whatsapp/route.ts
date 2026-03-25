import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();

  // Simulação de validação de token do WhatsApp/Meta
  // Em produção, verificar X-Hub-Signature-256
  
  const { messages, contacts } = body.entry?.[0]?.changes?.[0]?.value || {};

  if (!messages || !contacts) {
    return NextResponse.json({ status: "ok" });
  }

  const message = messages[0];
  const contact = contacts[0];

  // Lógica JARVIS: Identificar Lead ou Criar Novo
  let lead = await prisma.lead.findFirst({
    where: { phone: contact.wa_id }
  });

  // Buscar a primeira organização como fallback ou usar um sistema de roteamento real
  // Em um SaaS multi-tenant real, isso viria da configuração do número de telefone ou API Key
  const organization = await prisma.organization.findFirst();
  if (!organization) return NextResponse.json({ error: "No organization found" }, { status: 500 });

  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        name: contact.profile.name,
        phone: contact.wa_id,
        organizationId: organization.id,
        status: "NOVO",
        score: 10,
      }
    });
  }

  // Verificar se já existe uma oportunidade recente aberta para este lead (prevenção de spam/duplicação)
  const existingOpportunity = await prisma.opportunity.findFirst({
    where: { 
      leadId: lead.id,
      stage: { not: "PERDIDO" },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24h
    }
  });

  if (!existingOpportunity) {
    await prisma.opportunity.create({
      data: {
        title: `Interesse WhatsApp: ${contact.profile.name}`,
        leadId: lead.id,
        stage: "CONTATO",
        value: 0,
      }
    });
  }

  return NextResponse.json({ status: "success" });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === "startup180_token") {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}
