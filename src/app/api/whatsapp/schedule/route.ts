import { NextResponse } from 'next/server';
import { scheduleMessage } from '@/lib/schedulingService';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { content, sendAt, leadId, createEvent } = await req.json();

    if (!content || !sendAt || !leadId) {
      return NextResponse.json({ error: 'Faltam campos obrigatórios.' }, { status: 400 });
    }

    const user = await prisma.user.findFirst(); 
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

    const scheduled = await scheduleMessage({
      content,
      sendAt: new Date(sendAt),
      leadId,
      organizationId: user.organizationId,
      createEvent: !!createEvent
    });

    return NextResponse.json(scheduled);
  } catch (error) {
    console.error('Erro ao agendar mensagem:', error);
    return NextResponse.json({ error: 'Erro interno ao agendar.' }, { status: 500 });
  }
}
