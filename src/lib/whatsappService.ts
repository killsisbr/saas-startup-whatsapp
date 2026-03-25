import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { prisma } from './prisma';

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
  if (initializationPromises[userId]) return initializationPromises[userId];

  initializationPromises[userId] = (async () => {
    const sessionPath = path.join(SESSION_DATA_PATH, `session-${userId}`);
    console.log(`PONTO DE CONTROLE: Inicializando com pasta: ${sessionPath}`);
    
    if (fs.existsSync(sessionPath)) {
      // Limpar travas do Puppeteer (bug comum no Windows)
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
      // Pequeno delay para evitar mostrar QR se a restauração for iminente
      setTimeout(async () => {
        if (session.status === 'INITIALIZING') {
          console.log(`QR Code gerado para o usuário: ${userId}`);
          session.status = 'QR_CODE';
          try {
            session.qrCode = await qrcode.toDataURL(qr);
          } catch (err) {
            console.error('Erro ao gerar QR Code base64:', err);
          }
        }
      }, 5000); // 5 segundos de carência
    });

    client.on('authenticated', () => {
      console.log(`USUÁRIO AUTENTICADO (Sessão restaurada) para: ${userId}`);
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
        const lead = await prisma.lead.findFirst({
          where: {
            phone: {
              contains: from.slice(-8)
            }
          }
        });

        if (lead) {
          await prisma.message.create({
            data: {
              text: msg.body,
              sender: 'lead',
              leadId: lead.id,
              organizationId: lead.organizationId
            }
          });
          
          await prisma.lead.update({
            where: { id: lead.id },
            data: { updatedAt: new Date() }
          });
        }
      } catch (err) {
        console.error('Erro ao processar mensagem recebida:', err);
      }
    });

    client.on('disconnected', (reason) => {
      console.log(`WhatsApp desconectado para o usuário: ${userId}. Motivo: ${reason}`);
      session.status = 'DISCONNECTED';
      session.qrCode = undefined;
      session.whatsappNumber = undefined;
      delete sessions[userId];
    });

    client.on('auth_failure', (msg) => {
      console.error(`FALHA NA AUTENTICAÇÃO para o usuário: ${userId}:`, msg);
      session.status = 'DISCONNECTED';
      delete sessions[userId];
    });

    // Inicializa sem bloquear a resposta da API (mas agora dentro da Promise controlada)
    client.initialize().catch((err) => {
      console.error(`Erro ao inicializar cliente para ${userId}:`, err);
      delete sessions[userId];
    }).finally(() => {
      delete initializationPromises[userId];
    });

    return session;
  })();

  return initializationPromises[userId];
}

/**
 * Envia uma mensagem simples
 */
export async function sendMessage(userId: string, to: string, message: string) {
  const session = sessions[userId];
  if (!session || session.status !== 'CONNECTED') {
    throw new Error('WhatsApp não está conectado.');
  }

  const formattedTo = to.includes('@c.us') ? to : `${to.replace(/\D/g, '')}@c.us`;
  return await session.client.sendMessage(formattedTo, message);
}

/**
 * Desconecta e limpa a sessão
 */
export function stopCampaign(campaignId: string) {
  // Assuming activeCampaigns and pausedCampaigns are defined elsewhere
  // For now, this function does nothing without those definitions.
  // activeCampaigns.delete(campaignId);
  // pausedCampaigns.delete(campaignId);
  console.log(`stopCampaign called for campaignId: ${campaignId}. (No-op as activeCampaigns/pausedCampaigns are not defined)`);
}

/**
 * Sincroniza as últimas conversas e mensagens do WhatsApp para o CRM
 */
export async function syncRecentHistory(userId: string) {
  const session = sessions[userId];
  if (!session || session.status !== 'CONNECTED') {
    throw new Error('WhatsApp não conectado.');
  }

  if (session.syncing) return;
  session.syncing = true;

  try {
    const client = session.client;
    const chats = await client.getChats();
    // Pega os últimos 30 chats para não sobrecarregar
    const recentChats = chats.slice(0, 30);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(`Usuário ${userId} não encontrado.`);
    }
    const organizationId = user.organizationId;

    for (const chat of recentChats) {
      if (chat.isGroup) continue;

      const phone = chat.id.user;
      const contact = await chat.getContact();
      const profilePic = await contact.getProfilePicUrl().catch(() => undefined);
      
      // Busca ou cria o lead
      let lead = await prisma.lead.findFirst({
        where: { phone: { contains: phone.slice(-8) } }
      });

      if (!lead) {
        // Auto-import
        lead = await prisma.lead.create({
          data: {
            name: contact.pushname || contact.name || phone,
            phone: phone,
            status: 'IMPORTADO',
            organizationId: organizationId
          }
        });
      }

      // Busca as últimas 15 mensagens
      const messages = await chat.fetchMessages({ limit: 15 });
      for (const msg of messages) {
        // Evita duplicatas simples contando o tempo e o texto
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
    throw error;
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

/**
 * Desconecta e limpa a sessão
 */
export async function logoutWhatsApp(userId: string) {
  const session = sessions[userId];
  if (session) {
    try {
      await session.client.logout();
      await session.client.destroy();
    } catch (err) {
      console.error(`Erro ao fazer logout do cliente ${userId}:`, err);
    }
    delete sessions[userId];
  }
}
