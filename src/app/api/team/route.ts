import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let organizationId = session.user.organizationId;
  if (!organizationId) {
    const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
    organizationId = admin?.organizationId || "";
  }

  const members = await prisma.user.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    }
  });

  return NextResponse.json(members);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // RBAC: somente ADMIN pode convidar membros
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Permissão negada. Somente ADMINs podem convidar membros." }, { status: 403 });
  }

  const { name, email, role } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 });
  }

  // Verificar se email já existe
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email já cadastrado no sistema" }, { status: 409 });
  }

  let organizationId = session.user.organizationId;
  if (!organizationId) {
    const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
    organizationId = admin?.organizationId || "";
  }

  // Gerar senha temporária e hashear
  const tempPassword = `Startup180_${Date.now().toString(36)}`;
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || "MEMBER",
      organizationId,
    },
  });

  return NextResponse.json({ ...user, tempPassword });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const { id, role, name } = await req.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const user = await prisma.user.update({
    where: { id },
    data: { ...(role && { role }), ...(name && { name }) },
  });

  return NextResponse.json(user);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  // Não permitir auto-exclusão
  if (id === session.user.id) {
    return NextResponse.json({ error: "Não é possível excluir a si mesmo" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
