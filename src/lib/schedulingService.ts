import { prisma } from './prisma';
import { getWhatsAppSession } from './whatsappService';

/**
 * Inicia o worker de mensagens agendadas
 */
export function startSchedulingWorker() {
  console.log('[JARVIS] Starting Scheduling Worker...');
  
  setInterval(async () => {
    try {
      await processScheduledMessages();
    } catch (err) {
      console.error('[JARVIS] Error in scheduled worker:', err);
    }
  }, 60000);
}

/**
 * Processa mensagens que devem ser enviadas agora
 */
async function processScheduledMessages() {
  const now = new Date();
  
  // @ts-ignore - Prisma gera camelCase
  const pending = await prisma.scheduledMessage.findMany({
    where: {
      status: 'PENDING',
      sendAt: { lte: now }
    },
    include: { lead: true }
  });

  if (pending.length === 0) return;

  console.log(`[JARVIS] Processing ${pending.length} scheduled messages...`);

  for (const msg of pending) {
    try {
      // PROCURA QUALQUER USUÁRIO DA ORGANIZAÇÃO QUE ESTEJA CONECTADO
      const organizationUsers = await prisma.user.findMany({ where: { organizationId: msg.organizationId } });
      let session = null;
      for (const user of organizationUsers) {
          session = await getWhatsAppSession(user.id);
          if (session && session.status === 'CONNECTED') break;
      }
      
      if (session && session.status === 'CONNECTED' && session.client) {
        console.log(`[JARVIS] Sessão encontrada para org ${msg.organizationId}. Enviando...`);
        const phone = msg.lead.phone;
        await session.client.sendMessage(`${phone}@c.us`, msg.content);
        
        // @ts-ignore
        await prisma.scheduledMessage.update({
          where: { id: msg.id },
          data: { status: 'SENT' }
        });

        await prisma.message.create({
          data: {
            text: msg.content,
            sender: 'me',
            leadId: msg.leadId,
            organizationId: msg.organizationId
          }
        });

        console.log(`[JARVIS] Scheduled message sent to ${phone}`);
      }
    } catch (err) {
      console.error(`[JARVIS] Failed to send scheduled message ${msg.id}:`, err);
      // @ts-ignore
      await prisma.scheduledMessage.update({
        where: { id: msg.id },
        data: { status: 'FAILED' }
      });
    }
  }
}

export async function scheduleMessage(data: {
  content: string;
  sendAt: Date;
  leadId: string;
  organizationId: string;
  createEvent?: boolean;
}) {
  // @ts-ignore
  const scheduled = await prisma.scheduledMessage.create({
    data: {
      content: data.content,
      sendAt: data.sendAt,
      leadId: data.leadId,
      organizationId: data.organizationId,
      status: 'PENDING'
    }
  });

  if (data.createEvent) {
    const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
    await prisma.event.create({
      data: {
        title: `WhatsApp: ${lead?.name || 'Cliente'}`,
        description: `Envio automático: ${data.content}`,
        start: data.sendAt,
        color: 'bg-emerald-500',
        organizationId: data.organizationId,
        priority: 'NORMAL'
      }
    });
  }

  return scheduled;
}
