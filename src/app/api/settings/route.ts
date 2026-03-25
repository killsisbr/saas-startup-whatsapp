import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!session.user.id) {
      return NextResponse.json({ error: "Sessão inválida. Faça login novamente." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, role: true, organizationId: true }
    });

    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { id: true, name: true, slug: true, createdAt: true }
    });

    return NextResponse.json({ user, organization });
  } catch (error: any) {
    console.error("GET /api/settings ERROR:", error.message || error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { userName, orgName, currentPassword, newPassword } = await req.json();

    // Atualizar nome do usuário
    if (userName) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: userName }
      });
    }

    // Atualizar nome da organização (apenas ADMIN)
    if (orgName && session.user.role === "ADMIN") {
      await prisma.organization.update({
        where: { id: session.user.organizationId },
        data: { name: orgName }
      });
    }

    // Alterar senha
    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });

      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashed }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/settings ERROR:", error.message || error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
