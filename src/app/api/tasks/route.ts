import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const columnId = searchParams.get("columnId");

  const tasks = await prisma.taskCard.findMany({
    where: {
      column: {
        project: { organizationId: session.user.organizationId }
      },
      ...(columnId ? { columnId } : {})
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { title, description, columnId, priority } = await req.json();

  let organizationId = session.user.organizationId;
  let userId = session.user.id;

  if (!organizationId || !userId) {
    // Fallback para o admin se por algum motivo a sessao estiver vindo sem os campos customizados
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    organizationId = admin?.organizationId || "";
    userId = admin?.id || "";
  }

  // Mapeamento inteligente de placeholders para Column IDs reais
  const placeholders: Record<string, string> = {
    "todo": "A Fazer",
    "doing": "Em Andamento",
    "review": "Em Revisão",
    "done": "Concluído"
  };

  let targetColumnId = columnId;

  // Se for um placeholder ou estiver vazio, buscamos o projeto/coluna real
  if (!targetColumnId || placeholders[targetColumnId]) {
    const project = await prisma.project.findFirst({
      where: { organizationId },
      include: { columns: { orderBy: { order: "asc" } } }
    });

    if (!project || project.columns.length === 0) {
      // Criar projeto padrao (conforme lógica anterior)
      const newProject = await prisma.project.create({
        data: {
          name: "Startup 180 Admin Project",
          organizationId,
          columns: {
            create: [
              { title: "A Fazer", order: 0 },
              { title: "Em Andamento", order: 1 },
              { title: "Em Revisão", order: 2 },
              { title: "Concluído", order: 3 },
            ]
          }
        },
        include: { columns: true }
      });
      
      if (placeholders[targetColumnId]) {
          const match = newProject.columns.find((c: any) => c.title === placeholders[targetColumnId]);
          targetColumnId = match ? match.id : newProject.columns[0].id;
      } else {
          targetColumnId = newProject.columns[0].id;
      }
    } else {
      if (placeholders[targetColumnId]) {
          const match = project.columns.find((c: any) => c.title === placeholders[targetColumnId]);
          targetColumnId = match ? match.id : project.columns[0].id;
      } else {
          targetColumnId = project.columns[0].id;
      }
    }
  }

  if (!targetColumnId) {
    return NextResponse.json({ error: "Nenhuma coluna encontrada para criar a tarefa" }, { status: 400 });
  }

  const task = await prisma.taskCard.create({
    data: {
      title,
      description,
      columnId: targetColumnId,
      priority: priority || "MÉDIA",
      userId,
    }
  });

  return NextResponse.json(task);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    await prisma.taskCard.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar tarefa:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  
    const { id, ...data } = await req.json();
  
    const task = await prisma.taskCard.update({
      where: { id },
      data,
    });
  
    return NextResponse.json(task);
  }


