import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { importLeadsFromBuffer } from '@/lib/importService';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const organizationId = (session.user as any).organizationId;

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const tag = formData.get('tag') as string || `import-${new Date().toISOString().split('T')[0]}`;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importLeadsFromBuffer(buffer, organizationId, tag);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro no upload de importação:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
