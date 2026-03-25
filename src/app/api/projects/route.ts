import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let organizationId = session.user.organizationId;

  if (!organizationId) {
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    organizationId = admin?.organizationId || "";
  }

  let projects = await prisma.project.findMany({
    where: { organizationId },
    include: { 
      columns: {
        orderBy: { order: "asc" },
        include: { cards: true }
      }
    },
  });

  if (projects.length === 0) {
    // Criar um projeto inicial para o usuario ver algo
    const newProject = await prisma.project.create({
        data: {
          name: "Meu Primeiro Projeto",
          organizationId,
          columns: {
            create: [
              { title: "A Fazer", order: 0 },
              { title: "Em Andamento", order: 1 },
              { title: "Concluído", order: 2 },
            ],
          },
        },
        include: { columns: { include: { cards: true } } },
      });
      projects = [newProject];
  }

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const data = await req.json();

  const project = await prisma.project.create({
    data: {
      ...data,
      organizationId: session.user.organizationId,
    },
  });

  return NextResponse.json(project);
}
