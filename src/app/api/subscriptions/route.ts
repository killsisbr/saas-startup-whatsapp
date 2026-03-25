import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const orgId = session.user.organizationId;

  const subscriptions = await prisma.subscription.findMany({
    where: { customer: { organizationId: orgId } },
    include: { customer: { select: { name: true, id: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(subscriptions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { plan, status, price, customerId } = await req.json();

  if (!plan || !customerId) {
    return NextResponse.json({ error: "Plano e cliente são obrigatórios" }, { status: 400 });
  }

  const subscription = await prisma.subscription.create({
    data: {
      plan,
      status: status || "ATIVO",
      price: parseFloat(price) || 0,
      customerId,
    },
  });

  return NextResponse.json(subscription);
}
