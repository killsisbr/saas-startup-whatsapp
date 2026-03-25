import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  let organizationId = session.user.organizationId;
  if (!organizationId) {
    const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
    organizationId = admin?.organizationId || "";
  }

  const customers = await prisma.customer.findMany({
    where: { organizationId },
    include: { subscriptions: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(customers);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { name, domain, mrr, ltv, status } = await req.json();

  let organizationId = session.user.organizationId;
  if (!organizationId) {
    const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
    organizationId = admin?.organizationId || "";
  }

  const customer = await prisma.customer.create({
    data: {
      name,
      domain,
      mrr: parseFloat(mrr) || 0,
      ltv: parseFloat(ltv) || 0,
      status: status || "ATIVO",
      organizationId,
    },
  });

  return NextResponse.json(customer);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.domain !== undefined && { domain: data.domain }),
      ...(data.mrr !== undefined && { mrr: parseFloat(data.mrr) || 0 }),
      ...(data.ltv !== undefined && { ltv: parseFloat(data.ltv) || 0 }),
      ...(data.status && { status: data.status }),
    },
  });

  return NextResponse.json(customer);
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

  await prisma.subscription.deleteMany({ where: { customerId: id } });
  await prisma.customer.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
