import { prisma } from './prisma';
import { sendMessage } from './whatsappService';

const activeCampaigns = new Set<string>();
const pausedCampaigns = new Set<string>();

/**
 * Inicia o processamento de uma campanha em background
 */
export async function processCampaign(campaignId: string, userId: string) {
  if (activeCampaigns.has(campaignId)) return;
  
  activeCampaigns.add(campaignId);
  
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { 
        organization: true
      }
    });

    if (!campaign) {
      console.error(`Campanha ${campaignId} não encontrada.`);
      return;
    }

    // Busca leads filtrando por tags se necessário
    const targetTags = campaign.targetTags ? campaign.targetTags.split(',') : [];
    
    let leads;
    if (targetTags.length > 0) {
      // Busca leads que tenham QUALQUER uma das tags (SQLite não tem arrays, então usamos OR com contains)
      leads = await prisma.lead.findMany({
        where: {
          organizationId: campaign.organizationId,
          phone: { not: null },
          OR: targetTags.map(tag => ({
            tags: { contains: tag }
          }))
        }
      });
    } else {
      leads = await prisma.lead.findMany({
        where: {
          organizationId: campaign.organizationId,
          phone: { not: null }
        }
      });
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { 
        status: 'PROCESSING', 
        totalContacts: leads.length,
        processedCount: 0,
        successCount: 0,
        failedCount: 0
      }
    });

    console.log(`Iniciando campanha ${campaign.name} para ${leads.length} leads.`);

    for (const lead of leads) {
      // Verifica se a campanha ainda está ativa (não foi parada)
      if (!activeCampaigns.has(campaignId)) {
        console.log(`Campanha ${campaignId} interrompida pelo usuário.`);
        break;
      }
      
      // Lógica de Pausa
      while (pausedCampaigns.has(campaignId)) {
        await new Promise(r => setTimeout(r, 2000));
        // Se for parada enquanto pausada
        if (!activeCampaigns.has(campaignId)) break;
      }

      const phone = lead.phone as string;
      const message = campaign.message
        .replace(/@nome/g, lead.name)
        .replace(/@id/g, lead.id);

      try {
        await sendMessage(userId, phone, message);
        
        await prisma.campaignLog.create({
          data: { 
            campaignId, 
            phone, 
            status: 'SENT' 
          }
        });

        await prisma.campaign.update({
          where: { id: campaignId },
          data: { 
            successCount: { increment: 1 }, 
            processedCount: { increment: 1 } 
          }
        });

        console.log(`Mensagem enviada para ${lead.name} (${phone})`);
      } catch (err: any) {
        console.error(`Falha ao enviar para ${phone}:`, err.message);
        
        await prisma.campaignLog.create({
          data: { 
            campaignId, 
            phone, 
            status: 'FAILED', 
            error: err.message 
          }
        });

        await prisma.campaign.update({
          where: { id: campaignId },
          data: { 
            failedCount: { increment: 1 }, 
            processedCount: { increment: 1 } 
          }
        });
      }

      // Delay de segurança entre disparos (5 a 10 segundos aleatórios)
      const delay = Math.floor(Math.random() * 5000) + 5000;
      await new Promise(r => setTimeout(r, delay));
    }

    // Finaliza o status
    const finalStatus = activeCampaigns.has(campaignId) ? 'COMPLETED' : 'PAUSED';
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: finalStatus }
    });

    console.log(`Campanha ${campaign.name} finalizada com status: ${finalStatus}`);

  } catch (error: any) {
    console.error(`Erro fatal na execução da campanha ${campaignId}:`, error);
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'FAILED' }
    });
  } finally {
    activeCampaigns.delete(campaignId);
    pausedCampaigns.delete(campaignId);
  }
}

export function pauseCampaign(campaignId: string) {
  pausedCampaigns.add(campaignId);
}

export function resumeCampaign(campaignId: string) {
  pausedCampaigns.delete(campaignId);
}

export function stopCampaign(campaignId: string) {
  activeCampaigns.delete(campaignId);
  pausedCampaigns.delete(campaignId);
}
