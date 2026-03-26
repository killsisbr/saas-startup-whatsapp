import { prisma } from '@/lib/prisma';
import { generateResponse } from './aiProvider';
import { OllamaMessage } from './ollamaClient';

// Estados da Jornada de Compra
export enum SalesState {
  GREETING = 'inicio',           // Primeiro contato
  QUALIFICATION = 'qualificacao', // Entendendo o desejo
  OFFER = 'proposta',            // Apresentando planos/ofertas
  NEGOTIATION = 'negociacao',    // Lidando com dúvidas/objeções
  LEAD_CAPTURE = 'captura_lead', // Coletando CPF, Nome, Email, etc.
  CLOSING = 'fechamento'         // Direcionando para o humano
}

// Fallbacks para o Agente
const DEFAULT_AGENT_NAME = "JARVIS";
const DEFAULT_TEMPERAMENT = "Profissional, consultivo e focado em resultados.";
const DEFAULT_BIO = "Especialista em vendas e suporte do sistema Startup 180.";
const DEFAULT_PRODUCTS = "Consultar nossa linha de serviços e soluções SaaS.";

// Prompts baseados no estado
const STATE_PROMPTS: Record<string, string> = {
  [SalesState.GREETING]: `Sua missão é ser o primeiro contato impecável. Seja simpático, proativo e identifique o que o cliente busca (serviço, produto ou suporte).`,
  [SalesState.QUALIFICATION]: `Sua missão é QUALIFICAR o lead. Entenda a dor do cliente ou o que ele deseja alcançar precisamente. Mostre que nossa solução é o caminho ideal.`,
  [SalesState.OFFER]: `Sua missão é APRESENTAR A VANTAGEM. Use argumentos de valor e escassez. Foque em como o produto/serviço resolve o problema dele agora.`,
  [SalesState.NEGOTIATION]: `Sua missão é QUEBRAR OBJEÇÕES. Se o cliente estiver inseguro, mostre provas sociais ou garantias. Mova a conversa para a coleta de dados e fechamento.`,
  [SalesState.LEAD_CAPTURE]: `Sua missão é COLETAR DADOS. Precisamos de: Nome Completo e E-mail para formalizar a proposta. Peça educadamente o que falta.`,
  [SalesState.CLOSING]: `Sua missão é CONCLUIR. Agradeça os dados e informe que um especialista entrará em contato em breve.`
};

/**
 * Processo principal: recebe mensagem do cliente, processa e retorna resposta
 */
export async function handleSalesMessage(organizationId: string, leadPhone: string, userMessage: string): Promise<string> {
  try {
    // 1. Buscar ou Criar Lead (Safer Query)
    let lead: any = await (prisma.lead as any).findFirst({
      where: { phone: leadPhone },
      include: { conversations: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    if (!lead) {
      lead = await (prisma.lead as any).create({
        data: {
          phone: leadPhone,
          name: leadPhone === '5500000000000' ? 'Test User (Simulação)' : 'Lead Novo',
          organizationId: organizationId,
          status: leadPhone === '5500000000000' ? 'SIMULACAO' : 'NOVO'
        },
        include: { conversations: { orderBy: { createdAt: 'desc' }, take: 1 } }
      });
    }

    // 2. Buscar conversa ativa
    let conversation = lead?.conversations?.[0];
    let etapa = (conversation?.etapa as SalesState) || SalesState.GREETING;
    let dados = conversation ? JSON.parse(conversation.dados) : { history: [] };
    
    // 3. Extrair dados de lead (Heurística)
    const leadData = extractLeadData(userMessage, { nome: lead.name, email: lead.email || '' });
    if (leadData.email && leadData.email !== lead.email) {
        await (prisma.lead as any).update({ where: { id: lead.id }, data: { email: leadData.email } });
    }
    if (leadData.nome && leadData.nome !== lead.name && leadData.nome !== 'Lead Novo' && leadData.nome !== 'Test User (Simulação)') {
        await (prisma.lead as any).update({ where: { id: lead.id }, data: { name: leadData.nome } });
        // Sincronizar título da oportunidade no Kanban
        await (prisma.opportunity as any).updateMany({
            where: { leadId: lead.id },
            data: { title: `Oportunidade - ${leadData.nome}` }
        });
    }

    // 4. Lógica de transição de etapa
    if (etapa === SalesState.OFFER || etapa === SalesState.NEGOTIATION || etapa === SalesState.QUALIFICATION) {
      const lowerMsg = userMessage.toLowerCase();
      if (lowerMsg.includes('quero') || lowerMsg.includes('como faz') || lowerMsg.includes('fechar') || lowerMsg.includes('preço')) {
        etapa = SalesState.LEAD_CAPTURE;
      }
    }

    // 5. Construir System Prompt Dinâmico (Safer)
    let aiConfig = null;
    try {
        aiConfig = await (prisma as any).aiAgentConfig.findUnique({
            where: { organizationId }
        });
    } catch (e) {
        console.warn('[Sales AI] AiAgentConfig fetch failed, using defaults.');
    }

    const agentName = aiConfig?.name || DEFAULT_AGENT_NAME;
    const agentTemperament = aiConfig?.temperament || DEFAULT_TEMPERAMENT;
    const agentBio = aiConfig?.bio || DEFAULT_BIO;
    const agentProducts = aiConfig?.products || DEFAULT_PRODUCTS;

    // Agenda Context
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    let upcomingEvents: any[] = [];
    let leadAppointments: any[] = [];
    try {
        upcomingEvents = await (prisma as any).event.findMany({
            where: {
                organizationId,
                start: { gte: today, lte: nextWeek }
            },
            orderBy: { start: 'asc' }
        });

        leadAppointments = upcomingEvents.filter((e: any) => e.description && e.description.includes(lead.phone));
    } catch (e) {
        console.warn('[Sales AI] Event fetch failed.');
    }

    const busySlots = upcomingEvents.map((e: any) => {
        const d = new Date(e.start);
        return `${d.getDate()}/${d.getMonth()+1} às ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    }).join(', ');

    const leadAppointmentsStr = leadAppointments.map((e: any) => {
        const d = new Date(e.start);
        return `ID ${e.id} (${d.getDate()}/${d.getMonth()+1} às ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')})`;
    }).join('\n');

    const agendaContext = busySlots ? `Horários Ocupados (Não agendar nestes): ${busySlots}` : `A agenda está totalmente livre.`;
    const leadAppointmentsText = leadAppointments.length > 0
        ? `\nVISITAS JÁ MARCADAS DO CLIENTE ATUAL:\n${leadAppointmentsStr}`
        : `\nO cliente NÃO possui visitas marcadas atualmente.`;
    const todayStr = `${today.getDate()}/${today.getMonth()+1}/${today.getFullYear()}`;

    let fasePrompt = STATE_PROMPTS[etapa];
    if (etapa === SalesState.LEAD_CAPTURE) {
      const currentData = { nome: lead.name, email: lead.email || '' };
      const missing = getMissingLeadFields(currentData);
      if (missing.length > 0) {
        fasePrompt += `\nCAMPOS QUE AINDA PRECISAMOS: ${missing.join(', ').toUpperCase()}.`;
      }
    }

    const systemPrompt = `Você é ${agentName}, ${agentBio}.
REGRAS:
- Temperamento: ${agentTemperament}
- Conhecimento de Produtos/Ofertas: ${agentProducts}
- Coleta de Dados: Peça o Nome e E-mail de forma natural para prosseguir (se ainda não tivermos).
- Limite: Responda em no máximo 80 palavras. Use emojis estratégicos 🚀.

CONTEXTO DE AGENDA:
Hoje é dia ${todayStr} do ano ${today.getFullYear()}.
${agendaContext}${leadAppointmentsText}

AÇÕES DE AGENDA PERMITIDAS:
- Para AGENDAR visita nova, certifique-se que está livre, aceite e adicione obrigatoriamente no FINAL da resposta: [AGENDAR:YYYY-MM-DDTHH:MM]
- Para REAGENDAR uma visita existente dele, adicione no FINAL: [REAGENDAR:ID_DO_EVENTO:YYYY-MM-DDTHH:MM]
- Para CANCELAR uma visita existente dele, adicione no FINAL: [CANCELAR:ID_DO_EVENTO]
- Para CONSULTAR quando é a visita, use as "VISITAS JÁ MARCADAS" e responda naturalmente.
EXEMPLO GERAL: "Cancelei a visita como pediu. [CANCELAR:cuid123]" ou "Perfeito, agendado para amanhã. [AGENDAR:2026-03-27T13:40]"

FASE ATUAL DA CONVERSA: ${fasePrompt}
`;

    // 6. Gerar resposta via IA
    const chatHistory = (dados.history || []).slice(-6);
    const aiResponse = await generateResponse(userMessage, chatHistory, systemPrompt);

    // 6.5 Sincronizar Agenda IA
    let finalResponse = aiResponse;

    // Novo Agendamento
    const scheduleMatch = finalResponse.match(/\[AGENDAR:([^\]]+)\]/);
    if (scheduleMatch) {
        const dateString = scheduleMatch[1];
        try {
            const eventDate = new Date(dateString);
            if (!isNaN(eventDate.getTime())) {
                await (prisma as any).event.create({
                    data: {
                        title: `Visita / Reunião - ${lead.name}`,
                        description: `Agendado automaticamente pelo Jarvis. Fone: ${lead.phone}`,
                        start: eventDate,
                        end: new Date(eventDate.getTime() + 60 * 60 * 1000), // + 1 Hora
                        organizationId,
                        priority: 'QUENTE'
                    }
                });
                console.log(`[Sales AI] Evento criado no Prisma para: ${eventDate.toISOString()}`);
            }
        } catch (err) {
            console.error('[Sales AI] Falha ao criar Evento de Agendamento:', err);
        }
    }

    // Reagendamento
    const rescheduleMatch = finalResponse.match(/\[REAGENDAR:([^:]+):([^\]]+)\]/);
    if (rescheduleMatch) {
        const eventId = rescheduleMatch[1];
        const newDateString = rescheduleMatch[2];
        try {
            const eventDate = new Date(newDateString);
            if (!isNaN(eventDate.getTime())) {
                const existing = await (prisma as any).event.findUnique({ where: { id: eventId } });
                if (existing) {
                    await (prisma as any).event.update({
                        where: { id: eventId },
                        data: {
                            start: eventDate,
                            end: new Date(eventDate.getTime() + 60 * 60 * 1000)
                        }
                    });
                    console.log(`[Sales AI] Evento ${eventId} REAGENDADO para: ${eventDate.toISOString()}`);
                }
            }
        } catch (err) { console.error('[Sales AI] Erro ao Reagendar:', err); }
    }

    // Cancelamento
    const cancelMatch = finalResponse.match(/\[CANCELAR:([^\]]+)\]/);
    if (cancelMatch) {
        const eventId = cancelMatch[1];
        try {
            await (prisma as any).event.delete({ where: { id: eventId } });
            console.log(`[Sales AI] Evento ${eventId} CANCELADO.`);
        } catch (err) { console.error('[Sales AI] Erro ao Cancelar Evento:', err); }
    }

    // Remove as tags mágicas e limpa o output para o usuário
    finalResponse = finalResponse.replace(/\[(AGENDAR|REAGENDAR|CANCELAR)[^\]]*\]/gi, '').trim();

    // 7. Atualizar Histórico e Finalizar Etapa
    chatHistory.push({ role: 'user', content: userMessage });
    chatHistory.push({ role: 'assistant', content: finalResponse });
    
    let outcome = 'pending';
    if (etapa === SalesState.LEAD_CAPTURE) {
       const missing = getMissingLeadFields({ nome: lead.name, email: lead.email || '' });
       if (missing.length === 0) {
           etapa = SalesState.CLOSING;
           outcome = 'success';
           // Mover lead no Kanban automaticamente
           await (prisma.opportunity as any).updateMany({
               where: { leadId: lead.id },
               data: { stage: 'NEGOCIACAO' }
           });
       }
    } else if (isClosingInferred(finalResponse) || scheduleMatch) {
        etapa = SalesState.CLOSING;
        outcome = 'success';
    } else if (etapa === SalesState.GREETING && finalResponse.length > 5) {
        etapa = SalesState.QUALIFICATION;
    }

    // 7.5 Sincronizar com Kanban (Opportunity)
    const stageMapping: Record<string, string> = {
      [SalesState.GREETING]: 'CONTATO INICIAL',
      [SalesState.QUALIFICATION]: 'QUALIFICAÇÃO',
      [SalesState.OFFER]: 'PROPOSTA',
      [SalesState.NEGOTIATION]: 'NEGOCIAÇÃO',
      [SalesState.LEAD_CAPTURE]: 'QUALIFICAÇÃO',
      [SalesState.CLOSING]: 'FECHAMENTO'
    };

    try {
      let targetStage = stageMapping[etapa] || 'CONTATO INICIAL';
      
      // Regra de Ouro (DNA MASTER): Se o lead forneceu Nome e CPF, ele vai direto para "QUALIFICADO"
      const missingFields = getMissingLeadFields({ nome: lead.name, email: lead.email || '', cpf: dados.cpf || '' });
      if (!missingFields.includes('nome') && !missingFields.includes('cpf')) {
          targetStage = 'QUALIFICADO';
      }

      let opportunity = await (prisma.opportunity as any).findFirst({
          where: { leadId: lead.id },
          orderBy: { updatedAt: 'desc' }
      });

      if (opportunity) {
          if (opportunity.stage !== targetStage) {
              opportunity = await (prisma.opportunity as any).update({
                  where: { id: opportunity.id },
                  data: { stage: targetStage }
              });
              console.log(`[Kanban] Oportunidade ${opportunity.id} movida para ${targetStage}`);
          }
      } else {
          opportunity = await (prisma.opportunity as any).create({
              data: {
                  title: `Oportunidade - ${lead.name}`,
                  stage: targetStage,
                  leadId: lead.id,
                  value: 0
              }
          });
          console.log(`[Kanban] Nova oportunidade criada para ${lead.name} em ${targetStage}`);
      }
    } catch (kanbanErr) {
      console.error('[Kanban Sync] Erro ao sincronizar estágio:', kanbanErr);
    }

    // Persistir conversa
    if (conversation) {
        await (prisma as any).salesConversation.update({
            where: { id: conversation.id },
            data: {
                etapa: etapa,
                lastOutcome: outcome,
                dados: JSON.stringify({ ...dados, history: chatHistory })
            }
        });
    } else {
        await (prisma as any).salesConversation.create({
            data: {
                leadId: lead.id,
                organizationId: organizationId,
                etapa: etapa,
                lastOutcome: outcome,
                dados: JSON.stringify({ history: chatHistory })
            }
        });
    }

    return finalResponse;

  } catch (error: any) {
    console.error('[Sales AI] Erro Crítico:', error);
    console.error('[Sales AI] Stack:', error?.stack);
    return "Desculpe, tive uma oscilação no meu processamento. Como posso te ajudar com nossos serviços hoje? 🚀";
  }
}

function extractLeadData(message: string, current: { nome: string; email: string; cpf?: string }) {
  const data = { ...current };
  const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) data.email = emailMatch[0];

  const nomeMatch = message.match(/(?:meu nome é|sou o|me chamo|aqui é o|nome:)\s+([A-ZÀ-Ú][a-zà-ú]+\s+[A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i);
  if (nomeMatch) data.nome = nomeMatch[1];
  
  const cpfMatch = message.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/);
  if (cpfMatch) data.cpf = cpfMatch[0];
  
  return data;
}

function getMissingLeadFields(lead: { nome: string; email: string; cpf?: string }) {
  const missing = [];
  if (!lead.nome || lead.nome === 'Lead Novo' || lead.nome === 'Test User (Simulação)') missing.push('nome');
  if (!lead.cpf) missing.push('cpf');
  return missing;
}

function isClosingInferred(message: string) {
    const keywords = ['especialista entrará em contato', 'contato agendado', 'proposta enviada', 'obrigado pelos dados'];
    const msg = message.toLowerCase();
    return keywords.some(kw => msg.includes(kw));
}
