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

### 📊 Gestão de Leads & Kanban
- Registro automático de novos contatos vindos do WhatsApp.
- Pipeline de vendas (Kanban) para controle de oportunidades.
- Tagging automático para segmentação de listas.

### 🚀 Campanhas e Disparos em Massa
- **Importação via Excel**: Módulo de upload `.xlsx` para até milhares de leads.
- **Segmentação por Tag**: Dispare mensagens apenas para grupos específicos (ex: "Lista-Pascoa").
- **Variáveis de Mensagem**: Use `@nome` para personalizar cada envio.
- **Controle de Fluxo**: Pause, retome ou pare disparos em tempo real.

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
- **Offline-first**: Sessões do WhatsApp são armazenadas localmente em `./sessions`.
- **Relational Context**: Estrutura preparada para integração com Knowledge Graphs.

## 👨‍💻 Créditos
Desenvolvido por **KILLSIS** via JARVIS Swarm Engine.

---
*Este projeto é parte da iniciativa para escalar lucro via automação inteligente.*
