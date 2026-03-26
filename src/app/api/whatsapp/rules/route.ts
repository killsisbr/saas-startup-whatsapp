import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // @ts-ignore
    const rules = await prisma.autoReplyRule.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(rules);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar regras.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { trigger, response, matchType } = await req.json();
    
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

    // @ts-ignore
    const rule = await prisma.autoReplyRule.create({
      data: {
        trigger,
        response,
        matchType: matchType || 'KEYWORD',
        organizationId: user.organizationId,
        isActive: true
      }
    });

    return NextResponse.json(rule);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar regra.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    // @ts-ignore
    await prisma.autoReplyRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir regra.' }, { status: 500 });
  }
}
