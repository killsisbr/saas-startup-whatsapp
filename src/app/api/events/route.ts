import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const organizationId = (session.user as any).organizationId;
  if (!organizationId) return NextResponse.json({ error: "Organização não encontrada" }, { status: 400 });

  try {
    const events = await prisma.event.findMany({
      where: { organizationId },
      orderBy: { start: "asc" },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("DEBUG_API_EVENTS_GET_ERROR:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const organizationId = (session.user as any).organizationId;
  if (!organizationId) return NextResponse.json({ error: "Organização não encontrada" }, { status: 400 });

  try {
    const { title, description, start, end, color, priority, location } = await req.json();

    const event = await prisma.event.create({
      data: {
        title,
        description,
        start: new Date(start),
        end: end ? new Date(end) : null,
        color: color || "bg-primary",
        priority: priority || "NORMAL",
        location,
        organizationId,
      },
    });

    return NextResponse.json(event);
  } catch (error: any) {
    console.error("DEBUG_API_EVENTS_POST_ERROR:", error);
    return NextResponse.json({ error: "Erro ao criar evento", details: error?.message || String(error) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const organizationId = (session.user as any).organizationId;

  const body = await req.json();
  const { id, title, description, start, end, color, priority, location } = body;

  if (!organizationId) {
    console.error("DEBUG_API_EVENTS_PATCH_NO_ORG");
    return NextResponse.json({ error: "Sessão sem organização" }, { status: 400 });
  }

  if (!id) {
    console.warn("DEBUG_API_EVENTS_PATCH_NO_ID");
    return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
  }

  console.log("DEBUG_API_EVENTS_PATCH_START:", { id, organizationId, title });

  try {
    const event = await prisma.event.update({
      where: {
        id,
        organizationId // Garantia de que só edita da própria org
      },
      data: {
        title,
        description,
        start: start ? new Date(start) : undefined,
        end: end ? new Date(end) : undefined,
        color,
        priority,
        location,
      },
    });

    return NextResponse.json(event);
    } catch (error: any) {
    console.error("DEBUG_API_EVENTS_PATCH_FULL_ERROR:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    return NextResponse.json({ 
      error: "Erro ao atualizar evento", 
      details: error.message,
      code: error.code 
    }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const organizationId = (session.user as any).organizationId;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    await prisma.event.delete({
      where: { id, organizationId }, // Segurança Jarvis
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DEBUG_API_EVENTS_DELETE_ERROR:", error.message);
    return NextResponse.json({ error: "Erro ao deletar evento" }, { status: 500 });
  }
}
