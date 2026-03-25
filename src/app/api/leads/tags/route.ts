import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;

    // Busca todas as tags distintas dos leads da organização
    const leads = await prisma.lead.findMany({
      where: { organizationId },
      select: { tags: true }
    });

    const tagsSet = new Set<string>();
    leads.forEach(l => {
      if (l.tags) {
        l.tags.split(',').forEach(t => tagsSet.add(t.trim()));
      }
    });

    return NextResponse.json(Array.from(tagsSet));
  } catch (error: any) {
    console.error('Erro ao buscar tags:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
