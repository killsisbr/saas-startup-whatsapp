import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { prisma } from './prisma';
import { processAutoReply } from './autoReplyService';
import { startSchedulingWorker } from './schedulingService';
import { handleSalesMessage } from './ai/salesAiService';

// Inicia o worker globalmente uma única vez
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  startSchedulingWorker();
}

// Tipagem para o estado da conexão
export type WhatsAppStatus = 'DISCONNECTED' | 'INITIALIZING' | 'QR_CODE' | 'CONNECTED';

interface WhatsAppSession {
  client: Client;
  status: WhatsAppStatus;
  qrCode?: string;
  whatsappNumber?: string;
  profilePic?: string;
  syncing?: boolean;
}

const sessions: Record<string, WhatsAppSession> = {};
const initializationPromises: Record<string, Promise<WhatsAppSession>> = {};

const SESSION_DATA_PATH = 'D:/VENDA/saas-startup/sessions';

if (!fs.existsSync(SESSION_DATA_PATH)) {
  fs.mkdirSync(SESSION_DATA_PATH, { recursive: true });
}

/**
 * Retorna uma sessão existente ou cria uma nova
 */
export async function getWhatsAppSession(userId: string): Promise<WhatsAppSession | undefined> {
  return sessions[userId];
}

/**
 * Inicializa um novo cliente para o usuário
 */
export async function initializeWhatsAppClient(userId: string): Promise<WhatsAppSession> {
  if (sessions[userId]) return sessions[userId];
  if (userId in initializationPromises) return initializationPromises[userId];

  initializationPromises[userId] = (async () => {
    const sessionPath = path.join(SESSION_DATA_PATH, `session-${userId}`);
    console.log(`PONTO DE CONTROLE: Inicializando com pasta: ${sessionPath}`);
    
    if (fs.existsSync(sessionPath)) {
      const lockFiles = [
        path.join(sessionPath, 'SingletonLock'),
        path.join(sessionPath, 'Default', 'SingletonLock'),
        path.join(sessionPath, 'lock')
      ];
      lockFiles.forEach(file => {
        if (fs.existsSync(file)) {
          try { fs.unlinkSync(file); console.log(`Trava removida: ${file}`); } catch (e) {}
        }
      });
    }

    const client = new Client({
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
        userDataDir: sessionPath,
      },
      authStrategy: new LocalAuth({
        clientId: userId,
        dataPath: SESSION_DATA_PATH,
      }),
    });

    const session: WhatsAppSession = {
      client,
      status: 'INITIALIZING',
    };

    sessions[userId] = session;

    client.on('qr', async (qr) => {
      if (session.status === 'INITIALIZING' || session.status === 'QR_CODE') {
        console.log(`[WA] QR Code gerado para o usuário: ${userId}`);
        session.status = 'QR_CODE';
        try {
          session.qrCode = await qrcode.toDataURL(qr);
        } catch (err) {
          console.error('[WA] Erro ao gerar QR Code base64:', err);
        }
      }
    });

    client.on('authenticated', () => {
      console.log(`USUÁRIO AUTENTICADO para: ${userId}`);
      session.status = 'CONNECTED';
      session.qrCode = undefined;
    });

    client.on('ready', () => {
      console.log(`WhatsApp está pronto para o usuário: ${userId}`);
      session.status = 'CONNECTED';
      session.qrCode = undefined;
      session.whatsappNumber = client.info.wid.user;
    });

    client.on('message', async (msg) => {
      if (msg.fromMe) return;

      const from = msg.from.replace('@c.us', '');
      console.log(`Mensagem recebida de ${from}: ${msg.body}`);

      try {
        const fromClean = from.replace(/\D/g, '');
        
        // 1. Tentar localizar o Lead ou Criar um novo
        let lead = await prisma.lead.findFirst({
          where: { phone: { contains: fromClean.slice(-8) } }
        });

        // Se não existir lead, precisamos de uma organizationId.
        // Pegamos do usuário que inicializou a sessão.
        if (!lead) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user) {
                lead = await prisma.lead.create({
                    data: {
                        phone: fromClean,
                        name: 'Lead Novo (WA)',
                        organizationId: user.organizationId,
                        status: 'NOVO'
                    }
                });
                console.log(`[WA] Novo lead criado: ${fromClean}`);
            }
        }

        if (lead) {
          // 2. Salvar Mensagem do Lead
          await prisma.message.create({
            data: {
              text: msg.body,
              sender: 'lead',
              leadId: lead.id,
              organizationId: lead.organizationId
            }
          });
          
          await (prisma.lead as any).update({
            where: { id: lead.id },
            data: { updatedAt: new Date(), lastInteraction: new Date() }
          });

          console.log(`[WA] Mensagem salva para lead ${lead.id}`);

          // 3. Processar Automations (Auto-Reply -> AI)
          const wasAutoReplied = await processAutoReply(msg.body, from, lead.organizationId);
          
          if (!wasAutoReplied && (lead as any).aiEnabled) {
              console.log(`[WA] Chamando JARVIS AI para ${from}...`);
              const aiResponse = await handleSalesMessage(lead.organizationId, from, msg.body);
              if (aiResponse) {
                  await msg.reply(aiResponse);
                  // Salvar resposta da IA
                  await prisma.message.create({
                      data: {
                          text: aiResponse,
                          sender: 'me',
                          leadId: lead.id,
                          organizationId: lead.organizationId
                      }
                  });
              }
          }
        }
      } catch (err) {
        console.error('[WA] Erro ao processar mensagem recebida:', err);
      }
    });

    client.on('disconnected', (reason) => {
      console.log(`WhatsApp desconectado para ${userId}: ${reason}`);
      session.status = 'DISCONNECTED';
      delete sessions[userId];
    });

    console.log(`[WA] Chamando client.initialize() para ${userId}`);
    client.initialize().catch((err) => {
      console.error(`[WA] Erro ao inicializar cliente para ${userId}:`, err);
      delete sessions[userId];
    }).finally(() => {
      delete initializationPromises[userId];
    });

    return session;
  })();

  return initializationPromises[userId];
}

export async function sendMessage(userId: string, to: string, message: string) {
  const session = sessions[userId];
  if (!session || session.status !== 'CONNECTED') {
    throw new Error('WhatsApp não está conectado.');
  }

  const formattedTo = to.includes('@c.us') ? to : `${to.replace(/\D/g, '')}@c.us`;
  return await session.client.sendMessage(formattedTo, message);
}

export async function syncRecentHistory(userId: string) {
  const session = sessions[userId];
  if (!session || session.status !== 'CONNECTED') return;
  if (session.syncing) return;
  session.syncing = true;

  try {
    const client = session.client;
    const chats = await client.getChats();
    const recentChats = chats.slice(0, 30);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    
    const organizationId = user.organizationId;

    for (const chat of recentChats) {
      if (chat.isGroup) continue;
      const phone = chat.id.user;
      const contact = await chat.getContact();
      
      let lead = await prisma.lead.findFirst({
        where: { phone: { contains: phone.slice(-8) } }
      });

      if (!lead) {
        lead = await prisma.lead.create({
          data: {
            name: contact.pushname || contact.name || phone,
            phone: phone,
            status: 'IMPORTADO',
            organizationId: organizationId
          }
        });
      }

      const messages = await chat.fetchMessages({ limit: 15 });
      for (const msg of messages) {
        const existing = await prisma.message.findFirst({
          where: {
            leadId: lead.id,
            text: msg.body,
            createdAt: {
              gte: new Date(msg.timestamp * 1000 - 1000),
              lte: new Date(msg.timestamp * 1000 + 1000)
            }
          }
        });

        if (!existing) {
          await prisma.message.create({
            data: {
              text: msg.body,
              sender: msg.fromMe ? 'me' : 'lead',
              leadId: lead.id,
              organizationId: lead.organizationId,
              createdAt: new Date(msg.timestamp * 1000)
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Erro ao sincronizar histórico:', error);
  } finally {
    session.syncing = false;
  }
}

export async function getProfilePic(userId: string, phone: string) {
  const session = sessions[userId];
  if (!session || session.status !== 'CONNECTED') return undefined;
  try {
    const contact = await session.client.getContactById(phone + '@c.us');
    return await contact.getProfilePicUrl();
  } catch {
    return undefined;
  }
}

export async function logoutWhatsApp(userId: string) {
  const session = sessions[userId];
  if (session) {
    try {
      await session.client.logout();
      await session.client.destroy();
    } catch {}
    delete sessions[userId];
  }
}
