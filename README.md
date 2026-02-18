# PixZen - Assistente Financeiro Inteligente via WhatsApp

<div align="center">

**Gerencie suas financas pessoais e empresariais com inteligencia artificial pelo WhatsApp e Dashboard Web.**

[![Stack](https://img.shields.io/badge/React_18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Stack](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Stack](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Stack](https://img.shields.io/badge/PostgreSQL_16-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Stack](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)](https://prisma.io)
[![Stack](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white)](https://openai.com)
[![Stack](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## Sobre o Projeto

PixZen e um sistema completo de gestao financeira que combina:

- **Dashboard Web** moderno e responsivo (PWA-ready)
- **Assistente IA via WhatsApp** que registra transacoes por texto, audio, fotos e documentos
- **Contas pessoais e empresariais** com categorias brasileiras completas
- **Orcamento inteligente** com alertas e projecoes
- **Insights automaticos** baseados nos seus padroes de gasto

## Arquitetura

```
pixzen/
├── frontend/              # React 18 + Vite + TailwindCSS + shadcn-ui
├── backend-api/           # Express + Prisma + PostgreSQL (porta 3334)
├── backend-whatsapp/      # Express + OpenAI + UazAPI (porta 3333)
└── deploy/                # Nginx configs + PM2 ecosystem
```

### Diagrama de Fluxo

```
Usuario ──> WhatsApp ──> UazAPI Webhook ──> backend-whatsapp (3333)
                                               │
                                               ├── OpenAI GPT-4o (texto/audio/imagem)
                                               └── PostgreSQL ──> backend-api (3334)
                                                                     │
Usuario ──> Browser ──> Nginx (443) ──> frontend (SPA) ──────────────┘
                           └──> /api/* proxy ──> backend-api (3334)
```

---

## Funcionalidades

### Dashboard Web (frontend)

| Funcionalidade | Descricao |
|---|---|
| **Dashboard Inteligente** | Saldo, receitas, despesas, graficos e insights em tempo real |
| **Smart Insights** | Alertas automaticos: anomalias, projecoes, contas atrasadas, metas |
| **Transacoes** | CRUD completo com filtros por periodo, tipo e categoria |
| **Orcamento Mensal** | Limites por categoria com barras de progresso e alertas visuais |
| **Contas a Pagar** | Controle de vencimentos com status e recorrencia |
| **Contas a Receber** | Rastreamento de recebiveis com marcacao de recebimento |
| **Cartoes de Credito** | Cadastro de cartoes, faturas e limite utilizado |
| **Metas Financeiras** | Objetivos com depositos, progresso visual e celebracoes |
| **Lembretes** | Alertas personalizados com recorrencia e notificacoes push |
| **Analises** | Graficos de receita/despesa e distribuicao por categoria |
| **Central de Ajuda** | Guia completo com tutoriais, FAQ e busca |
| **Modo Dual** | Alterne entre conta Pessoal e Empresa com 1 clique |
| **Modo Demo** | Explore o app com dados ficticios sem cadastro |
| **Admin Panel** | Dashboard administrativo, configuracao de IA e templates |
| **Tema Dark/Light** | Troca de tema com persistencia |

### WhatsApp AI (backend-whatsapp)

| Funcionalidade | Descricao |
|---|---|
| **Texto** | Registra transacoes por mensagem natural ("Gastei 50 no uber") |
| **Audio** | Transcreve audios com Whisper e extrai transacoes |
| **Imagem** | Le recibos/comprovantes com GPT-4o Vision |
| **Documento** | Processa PDFs/documentos financeiros |
| **Templates** | Mensagens personalizaveis via painel admin |
| **Resumo Matinal** | Relatorio diario automatico as 07h |

### API Backend (backend-api)

| Endpoint | Descricao |
|---|---|
| `POST /api/auth/register` | Registro de usuario |
| `POST /api/auth/login` | Login com JWT |
| `GET/POST /api/transactions` | CRUD de transacoes |
| `GET/POST /api/bills` | Contas a pagar |
| `GET/POST /api/receivables` | Contas a receber |
| `GET/POST /api/credit-cards` | Cartoes de credito |
| `GET/POST /api/goals` | Metas financeiras |
| `POST /api/goals/:id/deposit` | Depositar na meta |
| `GET/POST /api/reminders` | Lembretes |
| `GET/POST /api/budgets` | Orcamentos mensais |
| `GET /api/budgets/insights` | Insights inteligentes |
| `POST /api/budgets/copy-previous` | Copiar orcamento do mes anterior |
| `GET/PUT /api/profile` | Perfil do usuario |
| `GET /api/subscription/status` | Status da assinatura |
| `POST /api/whatsapp/link` | Vincular WhatsApp |
| `GET /api/admin/*` | Rotas administrativas |

---

## Stack Tecnologica

### Frontend
- **React 18** com TypeScript
- **Vite** como bundler
- **TailwindCSS** + **shadcn-ui** para componentes
- **React Router v6** para navegacao SPA
- **Axios** para chamadas HTTP
- **Sonner** para notificacoes toast
- **Lucide React** para icones
- **Recharts** para graficos

### Backend API
- **Express.js** com TypeScript (compilado)
- **Prisma ORM** com PostgreSQL 16
- **JWT** para autenticacao
- **express-rate-limit** (100 req/15min geral, 10 req/15min auth)
- **bcrypt** para hash de senhas
- **node-cron** para agendamento (resumo matinal, lembretes)

### Backend WhatsApp
- **Express.js** com TypeScript
- **OpenAI GPT-4o** / **GPT-4o-mini** para processamento de linguagem
- **OpenAI Whisper** para transcricao de audio
- **UazAPI** como provider WhatsApp Business
- **PostgreSQL** (compartilhado com backend-api)

### Infraestrutura
- **VPS Contabo** (Ubuntu 22.04)
- **Nginx** como reverse proxy + SSL
- **PM2** como process manager
- **BT Panel** para gerenciamento do servidor
- **Let's Encrypt** para certificados SSL

---

## Banco de Dados

### Modelo de Dados (PostgreSQL)

```
users ──┬── profiles
        ├── assinantes (subscriptions)
        ├── transactions
        ├── credit_cards
        ├── bills
        ├── receivables
        ├── reminders
        ├── goals
        ├── budgets (raw SQL - sem model Prisma)
        ├── whatsapp_users ── whatsapp_link_codes
        ├── whatsapp_usage
        └── ai_usage_logs

ai_config (chave-valor)
message_templates (templates de mensagem)
```

### Tabelas Principais

| Tabela | Descricao |
|---|---|
| `users` | Usuarios com email, senha hash, flag admin |
| `transactions` | Transacoes com tipo, categoria, metodo de pagamento |
| `bills` | Contas a pagar com vencimento e recorrencia |
| `receivables` | Contas a receber com data esperada |
| `credit_cards` | Cartoes com limite, bandeira, vencimento |
| `goals` | Metas com valor alvo, atual, prazo |
| `budgets` | Orcamentos por categoria/mes (tabela criada via SQL) |
| `reminders` | Lembretes com recorrencia e notificacao |
| `message_templates` | Templates de mensagem WhatsApp |
| `whatsapp_users` | Usuarios vinculados ao WhatsApp |
| `ai_usage_logs` | Log de uso da OpenAI (tokens, custo) |

---

## Categorias Financeiras

### Pessoal
**Receitas:** Salario, Freelance, Investimentos, Bonus, Aluguel Recebido, Dividendos, Reembolso, Presente, Cashback

**Despesas:** Alimentacao, Mercado, Restaurante, Cafe, Transporte, Combustivel, Uber, Lazer, Streaming, Saude, Farmacia, Academia, Educacao, Compras, Roupas, Casa, Aluguel, Contas de Casa, Internet, Assinaturas, Impostos, Doacoes, Filhos, e mais...

### Empresa
**Receitas:** Vendas, Servicos, Consultoria, Contratos, Comissoes, Royalties, Recuperacao de Impostos

**Despesas:** Folha de Pagamento (salarios, pro-labore, INSS, FGTS, 13o, ferias), Beneficios (VT, VR, VA, plano saude), Servicos Terceirizados, Impostos (Simples, IRPJ, CSLL, PIS, COFINS, ISS, ICMS), Taxas Bancarias, Operacional (marketing, software, aluguel, frete)

---

## Seguranca

- JWT Secret de 128 caracteres hexadecimais
- Rate limiting: 100 req/15min (geral), 10 req/15min (auth)
- CORS restrito a `https://app.pixzen.site`
- Headers de seguranca: HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- Operacoes atomicas no banco (Prisma increment/decrement)
- Admin route guards no frontend
- Error Boundary global para crash recovery
- Bcrypt para hash de senhas
- SSL/TLS obrigatorio

---

## Instalacao e Deploy

### Pre-requisitos
- Node.js 18+
- PostgreSQL 16
- Nginx
- PM2 (`npm install -g pm2`)

### 1. Clone o repositorio
```bash
git clone https://github.com/UlissesVPS/PIXZEN.git
cd PIXZEN
```

### 2. Configure as variaveis de ambiente
```bash
cp backend-api/.env.example backend-api/.env
cp backend-whatsapp/.env.example backend-whatsapp/.env
# Edite os arquivos .env com suas credenciais
```

### 3. Instale as dependencias
```bash
cd backend-api && npm install && npx prisma generate && npx prisma migrate deploy
cd ../backend-whatsapp && npm install
cd ../frontend && npm install
```

### 4. Build
```bash
# Backend (ja compilado em dist/)
# Frontend
cd frontend && VITE_API_URL="/api" npx vite build
```

### 5. Deploy
```bash
# Copie frontend/dist para o diretorio do Nginx
# Configure o Nginx com deploy/nginx/app.pixzen.site.conf
# Inicie os servicos com PM2
pm2 start deploy/ecosystem.config.js
pm2 save
```

### 6. Crie a tabela de orcamentos (se necessario)
```sql
CREATE TABLE budgets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  month VARCHAR(7) NOT NULL,
  spent DECIMAL(12,2) DEFAULT 0,
  account_type VARCHAR(20) DEFAULT 'personal',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, account_type)
);
CREATE INDEX idx_budgets_user ON budgets(user_id);
CREATE INDEX idx_budgets_month ON budgets(user_id, month);
```

---

## Estrutura de Arquivos

```
frontend/src/
├── components/
│   ├── dashboard/         # BalanceCard, Charts, SmartInsights, Menus
│   ├── layout/            # Header, DesktopSidebar, BottomNav
│   ├── ui/                # shadcn-ui components
│   └── TrialExpiredPopup.tsx
├── contexts/
│   ├── AuthContext.tsx     # Autenticacao + Demo Mode
│   ├── FinanceContext.tsx  # Estado financeiro global
│   ├── ThemeContext.tsx    # Dark/Light mode
│   └── NotificationsContext.tsx
├── hooks/
│   ├── use-toast.ts       # Toast unificado (sonner wrapper)
│   └── useTrialCheck.ts
├── lib/
│   ├── api.ts             # Axios instance com interceptors
│   └── utils.ts
├── pages/
│   ├── Index.tsx           # Dashboard principal
│   ├── Budgets.tsx         # Orcamento mensal
│   ├── Goals.tsx           # Metas financeiras
│   ├── Bills.tsx           # Contas a pagar
│   ├── Receivables.tsx     # Contas a receber
│   ├── Transactions.tsx    # Lista de transacoes
│   ├── AddTransaction.tsx  # Nova transacao
│   ├── Analytics.tsx       # Graficos e analises
│   ├── CreditCards.tsx     # Cartoes de credito
│   ├── Reminders.tsx       # Lembretes
│   ├── HelpGuide.tsx       # Central de ajuda
│   ├── Settings.tsx        # Configuracoes
│   ├── Profile.tsx         # Perfil do usuario
│   ├── Security.tsx        # Seguranca da conta
│   ├── WhatsApp.tsx        # Vinculacao WhatsApp
│   ├── Auth.tsx            # Login/Registro
│   ├── Landing.tsx         # Landing page
│   ├── AdminDashboard.tsx  # Admin panel
│   ├── AIAdmin.tsx         # Config IA admin
│   └── AdminTemplates.tsx  # Templates admin
├── services/
│   ├── budgetApi.ts        # API de orcamentos
│   ├── billsApi.ts         # API de contas
│   ├── goalsApi.ts         # API de metas
│   ├── transactionsApi.ts  # API de transacoes
│   ├── creditCardsApi.ts   # API de cartoes
│   ├── receivablesApi.ts   # API de recebiveis
│   ├── remindersApi.ts     # API de lembretes
│   ├── authApi.ts          # API de autenticacao
│   ├── profileApi.ts       # API de perfil
│   ├── subscriptionApi.ts  # API de assinatura
│   ├── whatsappApi.ts      # API WhatsApp
│   └── adminApi.ts         # API admin
└── App.tsx                 # Router + Providers

backend-api/dist/
├── index.js                # Entry point + Express setup
├── config/env.js           # Environment config
├── lib/prisma.js           # Prisma client singleton
├── middleware/auth.js       # JWT auth + admin middleware
├── routes/
│   ├── auth.js             # Registro/Login
│   ├── transactions.js     # CRUD transacoes
│   ├── bills.js            # CRUD contas a pagar
│   ├── receivables.js      # CRUD contas a receber
│   ├── credit-cards.js     # CRUD cartoes
│   ├── goals.js            # CRUD metas + deposito
│   ├── budgets.js          # CRUD orcamentos + insights
│   ├── reminders.js        # CRUD lembretes
│   ├── profile.js          # Perfil usuario
│   ├── subscription.js     # Status assinatura
│   ├── whatsapp.js         # Vinculacao WhatsApp
│   └── admin.js            # Rotas admin (stats, AI, templates)
├── services/
│   ├── auth.js             # Logica de autenticacao
│   ├── database.js         # Queries customizadas
│   ├── openai.js           # Integracao OpenAI
│   ├── processor.js        # Processamento de mensagens
│   ├── morning-summary.js  # Resumo matinal
│   ├── scheduler.js        # Agendador de tarefas
│   └── uazapi.js           # Integracao UazAPI
├── handlers/               # Handlers por tipo de midia
├── prompts/finance.js      # Prompts do GPT
├── webhooks/uazapi.js      # Webhook receiver
└── utils/                  # Logger, media decrypt

backend-whatsapp/src/       # Codigo-fonte TypeScript
backend-whatsapp/dist/      # Codigo compilado JavaScript
```

---

## Licenca

Projeto proprietario. Todos os direitos reservados.

---

## Contato

- **Repositorio:** https://github.com/UlissesVPS/PIXZEN
- **App:** https://app.pixzen.site
