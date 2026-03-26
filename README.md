# JARVIS WhatsApp SaaS Startup 🚀

Uma solução profissional de CRM e Marketing via WhatsApp, construída com o DNA **JARVIS 4.1**. 

Este projeto é um SaaS robusto que integra gestão de clientes (CRM), funil de vendas (Kanban) e disparos de campanhas em massa com segmentação avançada.

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Prisma (SQLite)
- **WhatsApp**: WhatsApp-web.js (Singleton Pattern)
- **Excel/CSV**: ExcelJS (Bulk Import Engine)
- **Styling**: Tailwind CSS / Vanilla CSS
- **Auth**: NextAuth.js

## ✨ Funcionalidades Principais

### 📱 CRM Messenger
- Interface de chat em tempo real.
- Sincronização de histórico de mensagens (Últimas 50 conversas).
- Enriquecimento de perfil automático.

### 🤖 AI Scheduling & CRM Manager
- **Automação de Agendamento**: IA autônoma que qualifica leads e agenda visitas diretamente no calendário via chat.
- **Persona Engine**: Configuração dinâmica de comportamento (Local LLM ou Gemini).
- **Extração de Dados**: Captura automática de Nome, CPF e outras informações críticas durante a conversa.

### ⏰ Automação de Lembretes & Cron
- **Endpoint de Confirmação**: `/api/events/check-reminders` (Pronto para Vercel Cron ou GitHub Actions).
- **Lembrete 1h Antes**: Disparo automático de mensagem de confirmação para o lead 1 hora antes do agendamento.
- **Auto-Update**: Marcação automática de lembretes enviados para evitar duplicidade.

### 📊 Gestão de Leads & Kanban (Avançado)
- **CRUD Completo**: Criação e edição de tarefas, oportunidades e colunas diretamente na interface.
- **Pipeline Inteligente**: Movimentação automática de leads qualificados pela IA.

### 🚀 Campanhas e Disparos em Massa
- **Bulk Import**: Importação via Excel com processamento em segundo plano.
- **Logs em Tempo Real**: Monitoramento detalhado de cada envio na interface de campanha.

## ⚙️ Instalação e Configuração

1. Clone o repositório
```bash
git clone https://github.com/killsisbr/saas-startup-whatsapp.git
```

2. Instale as dependências
```bash
npm install
```

3. Configure o `.env`
```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="seu-segredo"
NEXTAUTH_URL="http://localhost:3000"

# IA Config (DNA JARVIS)
AI_PROVIDER="local" # ou "gemini"
GEMINI_API_KEY="sua-chave-aqui"
LOCAL_LLM_URL="http://127.0.0.1:11434"
LOCAL_LLM_MODEL="llama3.1:latest"
```

4. Prepare o Banco de Dados
```bash
npx prisma db push
node manual_seed.js
```

5. Inicie o Servidor
```bash
npm run dev
```

## 🔒 Segurança & Privacidade (DNA JARVIS)
- **Offline-first**: Sessões do WhatsApp e Banco de Dados (SQLite) armazenados localmente.
- **Relational Memory**: Estrutura preparada para integração com Knowledge Graphs via `src/lib/ai/aiProvider.ts`.

## 👨‍💻 Créditos
Desenvolvido por **KILLSIS** via JARVIS Swarm Engine.

---
*Este projeto é parte da iniciativa para escalar lucro via automação inteligente.*
