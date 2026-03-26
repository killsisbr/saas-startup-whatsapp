import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { title, projectId } = await req.json();

    if (!title || !projectId) {
      return NextResponse.json({ error: "Campos obrigatórios: title, projectId" }, { status: 400 });
    }

    // Identificar a ordem mais alta atual
    const lastColumn = await prisma.column.findFirst({
      where: { projectId },
      orderBy: { order: "desc" },
    });

    const newOrder = lastColumn ? lastColumn.order + 1 : 0;

    const column = await prisma.column.create({
      data: {
        title,
        order: newOrder,
        projectId,
      },
    });

    return NextResponse.json(column);
  } catch (error) {
    console.error("Erro ao criar coluna:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
