import { prisma } from './prisma';
import { getWhatsAppSession } from './whatsappService';

export async function processAutoReply(messageBody: string, phone: string, organizationId: string) {
  try {
    // 1. Busca regras ativas da organização
    // @ts-ignore - Prisma gera camelCase para as tabelas
    const rules = await prisma.autoReplyRule.findMany({
      where: { organizationId, isActive: true }
    });

    for (const rule of rules) {
      let isMatch = false;
      const cleanBody = (messageBody || '').toLowerCase().trim();
      const cleanTrigger = (rule.trigger || '').toLowerCase().trim();

      if (rule.matchType === 'KEYWORD') {
        isMatch = cleanBody === cleanTrigger;
      } else if (rule.matchType === 'CONTAINS') {
        isMatch = cleanBody.includes(cleanTrigger);
      } else if (rule.matchType === 'REGEX') {
        try {
          const regex = new RegExp(rule.trigger, 'i');
          isMatch = regex.test(messageBody);
        } catch (e) {
          console.error(`Erro na Regex da regra ${rule.id}:`, e);
        }
      }

      if (isMatch) {
        console.log(`[JARVIS] Rule Match: ${rule.trigger}. Sending response...`);
        // O userId aqui é o que identifica a sessão. Em um SaaS real, você teria o link Org -> User.
        // Como estamos em teste, vamos tentar pegar a primeira sessão ativa ou passar um ownerId.
        // Simplificando: vamos assumir que existe um usuário 'admin' ou similar.
        const session = await getWhatsAppSession(organizationId); // Agora await
        
        if (session && session.status === 'CONNECTED' && session.client) {
          await session.client.sendMessage(`${phone}@c.us`, rule.response);
          
          await prisma.message.create({
            data: {
              text: rule.response,
              sender: 'me',
              leadId: await getOrCreateLeadId(phone, organizationId),
              organizationId
            }
          });
          
          return true;
        }
      }
    }
    
    await updateLeadFunnel(phone, organizationId);
    return false;
  } catch (error) {
    console.error('[JARVIS] Error in auto-reply logic:', error);
    return false;
  }
}

async function getOrCreateLeadId(phone: string, organizationId: string) {
  const lead = await prisma.lead.findFirst({
    where: { phone }
  });
  if (lead) return lead.id;
  
  const newLead = await prisma.lead.create({
    data: {
      phone,
      name: phone,
      organizationId,
      status: 'CONTATO'
    }
  });
  return newLead.id;
}

async function updateLeadFunnel(phone: string, organizationId: string) {
  try {
    const lead = await prisma.lead.findFirst({
      where: { phone }
    });

    if (lead) {
      if (lead.status === 'NOVO') {
        console.log(`[JARVIS] Auto-Funnel: Moving lead ${phone} from NOVO to CONTATO`);
        await prisma.lead.update({
          where: { id: lead.id },
          data: { 
            status: 'CONTATO',
            // @ts-ignore - lastInteraction pode não estar no tipo se o client for antigo
            lastInteraction: new Date()
          }
        });
        
        const existingOp = await prisma.opportunity.findFirst({
          where: { leadId: lead.id }
        });
        
        if (!existingOp) {
          await prisma.opportunity.create({
            data: {
              title: `Oportunidade - ${lead.name || phone}`,
              stage: 'CONTATO',
              leadId: lead.id,
              value: 0
            }
          });
        }
      } else {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { 
             // @ts-ignore
             lastInteraction: new Date() 
          }
        });
      }
    }
  } catch (err) {
    console.error('[JARVIS] Error updating lead funnel:', err);
  }
}
