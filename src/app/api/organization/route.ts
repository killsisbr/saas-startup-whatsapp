import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const organization = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });

  if (!organization) return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });

  return NextResponse.json(organization);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const { name, slug } = await req.json();

  const organization = await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: {
      ...(name && { name }),
      ...(slug && { slug }),
    },
  });

  return NextResponse.json(organization);
}
