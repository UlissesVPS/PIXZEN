import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, ChevronRight, ChevronDown, Play, BookOpen, Wallet, PieChart,
  CreditCard, Target, Bell, MessageCircle, Shield, Settings, Users, Receipt,
  TrendingUp, Plus, FileText, Smartphone, ArrowUpDown, HelpCircle, Sparkles,
  CheckCircle2, AlertCircle, Lightbulb, Zap, Eye, ExternalLink, HandCoins,
  CalendarDays, BellRing, BarChart3, Download, UserCircle, Lock, Palette,
  CircleDollarSign, Phone, Bot, ListChecks, Clock, Repeat, Star
} from 'lucide-react';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { cn } from '@/lib/utils';

// ============ TYPES ============
interface GuideStep {
  step: number;
  title: string;
  description: string;
  tip?: string;
}

interface GuideSection {
  id: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  difficulty: 'facil' | 'medio' | 'avancado';
  estimatedTime: string;
  steps: GuideStep[];
  tips?: string[];
  examples?: { text: string; result: string }[];
  relatedPages?: { name: string; path: string }[];
}

interface GuideCategory {
  id: string;
  name: string;
  icon: any;
  description: string;
  sections: GuideSection[];
}

// ============ DATA ============
const GUIDE_CATEGORIES: GuideCategory[] = [
  {
    id: 'primeiros-passos',
    name: 'Primeiros Passos',
    icon: Sparkles,
    description: 'Comece aqui se e sua primeira vez no PixZen',
    sections: [
      {
        id: 'criar-conta',
        icon: Users,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/10',
        title: 'Criando sua Conta',
        subtitle: 'Como se cadastrar e acessar o PixZen',
        difficulty: 'facil',
        estimatedTime: '2 min',
        steps: [
          { step: 1, title: 'Acesse a pagina de login', description: 'Clique em "Comecar Gratis" na pagina inicial ou acesse /auth' },
          { step: 2, title: 'Preencha seus dados', description: 'Informe seu nome, email e crie uma senha segura (minimo 6 caracteres)' },
          { step: 3, title: 'Crie sua conta', description: 'Clique em "Criar Conta" e voce sera redirecionado automaticamente ao painel' },
          { step: 4, title: 'Aproveite o trial', description: 'Voce ganha 7 dias gratis com acesso a TODAS as funcionalidades premium!' },
        ],
        tips: [
          'Use um email valido para recuperar sua senha caso precise',
          'No modo demo voce pode explorar o app sem criar conta, mas os dados nao sao salvos',
          'O trial de 7 dias inclui WhatsApp, analise de audios e imagens',
        ],
        relatedPages: [{ name: 'Login/Cadastro', path: '/auth' }],
      },
      {
        id: 'conhecendo-painel',
        icon: Eye,
        iconColor: 'text-purple-500',
        iconBg: 'bg-purple-500/10',
        title: 'Conhecendo o Painel',
        subtitle: 'Entenda cada parte do seu dashboard financeiro',
        difficulty: 'facil',
        estimatedTime: '3 min',
        steps: [
          { step: 1, title: 'Dashboard principal', description: 'Ao entrar, voce ve seu saldo total, receitas e despesas do periodo selecionado' },
          { step: 2, title: 'Alternar periodos', description: 'Use os botoes Semana/Mes/Ano para ver resumos de diferentes periodos' },
          { step: 3, title: 'Conta Pessoal vs Empresarial', description: 'Alterne entre conta pessoal e empresarial no topo. Cada uma tem transacoes separadas!' },
          { step: 4, title: 'Graficos', description: 'Role para baixo para ver graficos de receitas x despesas e distribuicao por categorias' },
          { step: 5, title: 'Transacoes recentes', description: 'No final do dashboard voce encontra suas ultimas transacoes com acesso rapido' },
        ],
        tips: [
          'O saldo e calculado automaticamente: Receitas - Despesas',
          'Use conta pessoal para gastos do dia a dia e empresarial para negocios',
          'Os graficos atualizam em tempo real conforme voce adiciona transacoes',
        ],
        relatedPages: [{ name: 'Dashboard', path: '/app' }],
      },
      {
        id: 'modo-demo',
        icon: Play,
        iconColor: 'text-green-500',
        iconBg: 'bg-green-500/10',
        title: 'Modo Demonstracao',
        subtitle: 'Explore o app sem compromisso',
        difficulty: 'facil',
        estimatedTime: '1 min',
        steps: [
          { step: 1, title: 'Ative o modo demo', description: 'Na tela de login, clique em "Experimentar sem conta" ou "Modo Demo"' },
          { step: 2, title: 'Explore livremente', description: 'Navegue por todas as paginas e veja como o app funciona com dados de exemplo' },
          { step: 3, title: 'Entenda as limitacoes', description: 'No modo demo, nenhum dado e salvo no servidor. E apenas para visualizacao' },
          { step: 4, title: 'Crie sua conta quando quiser', description: 'Saia do modo demo e crie uma conta real para comecar a registrar suas financas' },
        ],
        tips: [
          'O modo demo e perfeito para mostrar o app para amigos e familia',
          'Funcionalidades como WhatsApp e notificacoes push nao funcionam no demo',
        ],
      },
    ],
  },
  {
    id: 'transacoes',
    name: 'Transacoes',
    icon: ArrowUpDown,
    description: 'Registre e gerencie todas as suas movimentacoes financeiras',
    sections: [
      {
        id: 'adicionar-transacao',
        icon: Plus,
        iconColor: 'text-emerald-500',
        iconBg: 'bg-emerald-500/10',
        title: 'Adicionar Transacao',
        subtitle: 'Registre receitas e despesas rapidamente',
        difficulty: 'facil',
        estimatedTime: '1 min',
        steps: [
          { step: 1, title: 'Abra a tela de adicionar', description: 'Toque no botao "+" no menu inferior (mobile) ou "Nova Transacao" no menu lateral' },
          { step: 2, title: 'Escolha o tipo', description: 'Selecione "Despesa" (vermelho) ou "Receita" (verde) no topo da tela' },
          { step: 3, title: 'Digite o valor', description: 'Informe o valor. Use os botoes rapidos (R$ 10, 20, 50, 100, 200, 500) para agilizar' },
          { step: 4, title: 'Selecione a categoria', description: 'Escolha uma categoria que melhor descreve a transacao (ex: Alimentacao, Salario, Transporte)' },
          { step: 5, title: 'Adicione detalhes', description: 'Escreva uma descricao (ex: "Almoco no restaurante"), escolha a forma de pagamento e data' },
          { step: 6, title: 'Salve', description: 'Toque em "Adicionar Despesa/Receita" para salvar. Pronto!' },
        ],
        tips: [
          'Descreva suas transacoes de forma clara para facilitar a busca depois',
          'Se pagou no cartao de credito, pode parcelar em ate 18x',
          'Voce pode adicionar categorias personalizadas tocando em "+" na grade de categorias',
        ],
        examples: [
          { text: 'Almoco com colegas - R$ 45,00 - Alimentacao - Cartao Debito', result: 'Despesa registrada com sucesso' },
          { text: 'Freelance design logo - R$ 800,00 - Freelance - PIX', result: 'Receita registrada com sucesso' },
          { text: 'TV 55" - R$ 3.600,00 - Compras - Cartao Credito 12x', result: '12 parcelas de R$ 300,00 criadas' },
        ],
        relatedPages: [{ name: 'Adicionar', path: '/add' }],
      },
      {
        id: 'gerenciar-transacoes',
        icon: ListChecks,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/10',
        title: 'Gerenciar Transacoes',
        subtitle: 'Busque, edite, exclua e exporte suas transacoes',
        difficulty: 'facil',
        estimatedTime: '2 min',
        steps: [
          { step: 1, title: 'Acesse a lista', description: 'Va em "Transacoes" no menu lateral ou inferior' },
          { step: 2, title: 'Busque e filtre', description: 'Use a barra de busca para encontrar por descricao. Filtre por tipo (receita/despesa) e conta (pessoal/empresarial)' },
          { step: 3, title: 'Edite uma transacao', description: 'Toque em uma transacao para expandir e clique no icone de editar (lapis). Altere valor, descricao, categoria ou data' },
          { step: 4, title: 'Exclua uma transacao', description: 'Clique no icone da lixeira e confirme. Atencao: esta acao nao pode ser desfeita!' },
          { step: 5, title: 'Exporte para CSV', description: 'Clique no botao "Exportar" no topo para baixar todas as transacoes filtradas em formato CSV (abre no Excel)' },
        ],
        tips: [
          'As transacoes sao agrupadas por data automaticamente',
          'O CSV exportado contem: data, descricao, categoria, tipo, valor e forma de pagamento',
          'Voce pode usar o CSV para importar em planilhas ou outros apps financeiros',
        ],
        relatedPages: [{ name: 'Transacoes', path: '/transactions' }],
      },
      {
        id: 'formas-pagamento',
        icon: Wallet,
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-500/10',
        title: 'Formas de Pagamento',
        subtitle: 'PIX, cartao, dinheiro e mais',
        difficulty: 'facil',
        estimatedTime: '1 min',
        steps: [
          { step: 1, title: 'Escolha ao adicionar', description: 'Ao criar uma transacao, selecione a forma de pagamento na lista' },
          { step: 2, title: 'PIX', description: 'Para pagamentos instantaneos via PIX' },
          { step: 3, title: 'Cartao de Credito', description: 'Permite parcelamento de 1x ate 18x. Cada parcela vira uma transacao separada' },
          { step: 4, title: 'Cartao de Debito', description: 'Para compras debitadas direto da conta' },
          { step: 5, title: 'Dinheiro', description: 'Para pagamentos em especie' },
          { step: 6, title: 'Boleto / TED', description: 'Para boletos bancarios e transferencias TED' },
        ],
        tips: [
          'Ao parcelar no credito, todas as parcelas sao criadas automaticamente',
          'Cada parcela tem a descricao com o numero (ex: "TV 55" - Parcela 3/12")',
          'Voce pode visualizar gastos por forma de pagamento nos graficos',
        ],
      },
    ],
  },
  {
    id: 'analises',
    name: 'Analises e Relatorios',
    icon: BarChart3,
    description: 'Entenda suas financas com graficos e relatorios detalhados',
    sections: [
      {
        id: 'dashboard-graficos',
        icon: PieChart,
        iconColor: 'text-violet-500',
        iconBg: 'bg-violet-500/10',
        title: 'Graficos e Analises',
        subtitle: 'Visualize suas financas de forma intuitiva',
        difficulty: 'facil',
        estimatedTime: '3 min',
        steps: [
          { step: 1, title: 'Acesse Analytics', description: 'Va em "Analises" no menu lateral ou inferior' },
          { step: 2, title: 'Resumo no topo', description: 'Veja cards com total de receitas, despesas e saldo. As setas indicam se melhorou ou piorou vs periodo anterior' },
          { step: 3, title: 'Grafico de barras', description: 'Compare receitas vs despesas ao longo do tempo (por dia, semana ou mes)' },
          { step: 4, title: 'Grafico de evolucao', description: 'Acompanhe a evolucao do seu saldo ao longo do tempo com o grafico de area' },
          { step: 5, title: 'Categorias', description: 'Veja o Top 7 categorias de despesas e receitas com barras de progresso e porcentagens' },
          { step: 6, title: 'Filtre por periodo', description: 'Use Semana/Mes/Ano para ver diferentes recortes temporais' },
        ],
        tips: [
          'Setas verdes = voce melhorou vs periodo anterior. Setas vermelhas = piorou',
          'O grafico de evolucao ajuda a identificar tendencias de economia ou gasto',
          'Preste atencao nas top categorias para identificar onde cortar gastos',
        ],
        relatedPages: [{ name: 'Analises', path: '/analytics' }],
      },
      {
        id: 'exportar-relatorio',
        icon: Download,
        iconColor: 'text-teal-500',
        iconBg: 'bg-teal-500/10',
        title: 'Exportar Relatorios',
        subtitle: 'Gere relatorios para impressao ou compartilhamento',
        difficulty: 'medio',
        estimatedTime: '2 min',
        steps: [
          { step: 1, title: 'Va em Analytics', description: 'Acesse a pagina de Analises' },
          { step: 2, title: 'Selecione o periodo', description: 'Escolha o periodo desejado (semana, mes ou ano)' },
          { step: 3, title: 'Clique em Exportar', description: 'Toque no botao "Exportar Relatorio" no topo da pagina' },
          { step: 4, title: 'Relatorio HTML', description: 'Um relatorio formatado abre em nova aba com Top 10 categorias, resumo financeiro e data de geracao' },
          { step: 5, title: 'Imprima ou salve', description: 'Use Ctrl+P (ou Cmd+P no Mac) para imprimir ou salvar como PDF' },
        ],
        tips: [
          'O relatorio inclui receitas e despesas separados por categoria',
          'Voce tambem pode exportar transacoes individuais como CSV na pagina de Transacoes',
          'Util para declaracao de imposto de renda ou controle empresarial',
        ],
        relatedPages: [
          { name: 'Analises', path: '/analytics' },
          { name: 'Transacoes', path: '/transactions' },
        ],
      },
    ],
  },
  {
    id: 'cartoes',
    name: 'Cartoes de Credito',
    icon: CreditCard,
    description: 'Gerencie seus cartoes, limites e faturas',
    sections: [
      {
        id: 'gerenciar-cartoes',
        icon: CreditCard,
        iconColor: 'text-pink-500',
        iconBg: 'bg-pink-500/10',
        title: 'Gerenciar Cartoes',
        subtitle: 'Adicione e acompanhe seus cartoes de credito',
        difficulty: 'medio',
        estimatedTime: '3 min',
        steps: [
          { step: 1, title: 'Acesse Cartoes', description: 'Va em "Cartoes de Credito" no menu lateral ou inferior' },
          { step: 2, title: 'Adicione um cartao', description: 'Clique em "Adicionar Cartao" e preencha: nome, bandeira, ultimos 4 digitos, limite e dias de vencimento/fechamento' },
          { step: 3, title: 'Personalize a cor', description: 'Escolha entre 7 cores (Roxo, Laranja, Azul, Verde, Rosa, Preto, Dourado) para identificar visualmente cada cartao' },
          { step: 4, title: 'Acompanhe o uso', description: 'Cada cartao mostra uma barra de progresso do limite: branca (0-50%), amarela (50-80%) e vermelha (80-100%)' },
          { step: 5, title: 'Veja faturas', description: 'Clique em um cartao para ver historico de faturas com status: Aberta, Paga, Vencida ou Fechada' },
        ],
        tips: [
          'O limite usado e calculado automaticamente com base nas transacoes no cartao',
          'Fique atento quando a barra ficar vermelha - significa que voce esta perto do limite!',
          'Os dias de vencimento e fechamento ajudam a planejar compras no melhor momento',
          'Cadastre todos os seus cartoes para ter visao completa dos gastos',
        ],
        relatedPages: [{ name: 'Cartoes de Credito', path: '/credit-cards' }],
      },
    ],
  },
  {
    id: 'contas-receber-pagar',
    name: 'Contas a Pagar e Receber',
    icon: Receipt,
    iconColor: 'text-orange-500',
    description: 'Controle boletos, contas fixas e valores a receber',
    sections: [
      {
        id: 'contas-pagar',
        icon: Receipt,
        iconColor: 'text-red-500',
        iconBg: 'bg-red-500/10',
        title: 'Contas a Pagar',
        subtitle: 'Nunca perca o vencimento de uma conta',
        difficulty: 'facil',
        estimatedTime: '2 min',
        steps: [
          { step: 1, title: 'Acesse Contas', description: 'Va em "Contas a Pagar" no menu lateral' },
          { step: 2, title: 'Adicione uma conta', description: 'Clique em "+" e informe: descricao, valor, data de vencimento e categoria' },
          { step: 3, title: 'Configure recorrencia', description: 'Escolha se a conta e unica, semanal, mensal ou anual (ex: aluguel mensal)' },
          { step: 4, title: 'Acompanhe o status', description: 'Contas pendentes ficam em destaque. Contas vencidas aparecem com borda vermelha e alerta' },
          { step: 5, title: 'Marque como paga', description: 'Quando pagar, clique em "Marcar como Pago" para atualizar o status' },
        ],
        tips: [
          'Contas com vencimento em ate 3 dias aparecem com indicador amarelo de "vence em breve"',
          'Use filtros para ver: todas, pendentes, pagas ou vencidas',
          'Contas recorrentes sao ideais para: aluguel, assinaturas, mensalidades e contas fixas',
          'O resumo no topo mostra o total pendente para voce se planejar',
        ],
        relatedPages: [{ name: 'Contas a Pagar', path: '/bills' }],
      },
      {
        id: 'contas-receber',
        icon: HandCoins,
        iconColor: 'text-green-500',
        iconBg: 'bg-green-500/10',
        title: 'Valores a Receber',
        subtitle: 'Controle quem te deve e quando vai pagar',
        difficulty: 'facil',
        estimatedTime: '2 min',
        steps: [
          { step: 1, title: 'Acesse Recebiveis', description: 'Va em "Valores a Receber" no menu lateral' },
          { step: 2, title: 'Registre um valor', description: 'Clique em "+" e informe: descricao, valor, data prevista de pagamento e quem deve (opcional)' },
          { step: 3, title: 'Acompanhe', description: 'Veja a lista com todos os valores pendentes e o total geral no topo' },
          { step: 4, title: 'Confirme recebimento', description: 'Quando receber, marque como "Recebido"' },
        ],
        tips: [
          'Otimo para freelancers que precisam controlar pagamentos de clientes',
          'Registre emprestimos feitos a amigos/familia para nao esquecer',
          'Use para acompanhar comissoes, bonificacoes e reembolsos pendentes',
        ],
        relatedPages: [{ name: 'Valores a Receber', path: '/receivables' }],
      },
    ],
  },
  {
    id: 'metas',
    name: 'Metas Financeiras',
    icon: Target,
    description: 'Defina objetivos e acompanhe seu progresso',
    sections: [
      {
        id: 'criar-metas',
        icon: Target,
        iconColor: 'text-violet-500',
        iconBg: 'bg-violet-500/10',
        title: 'Criar e Gerenciar Metas',
        subtitle: 'Transforme sonhos em objetivos financeiros concretos',
        difficulty: 'medio',
        estimatedTime: '3 min',
        steps: [
          { step: 1, title: 'Acesse Metas', description: 'Va em "Metas" no menu lateral ou inferior' },
          { step: 2, title: 'Crie uma meta', description: 'Clique em "Nova Meta" e defina: titulo, descricao, valor alvo e prazo' },
          { step: 3, title: 'Escolha categoria', description: 'Selecione o tipo: Economia, Viagem, Compra, Educacao, Emergencia, Investimento ou Personalizado' },
          { step: 4, title: 'Personalize', description: 'Escolha um emoji (18 opcoes) e cor (10 opcoes) para identificar sua meta visualmente' },
          { step: 5, title: 'Deposite valores', description: 'Clique em "Depositar" e use os botoes rapidos (R$ 50, 100, 200, 500) ou digite um valor personalizado' },
          { step: 6, title: 'Acompanhe o progresso', description: 'Cada meta mostra: valor atual vs alvo, barra de progresso com porcentagem e dias restantes' },
        ],
        tips: [
          'Metas sao concluidas automaticamente quando atingem 100%',
          'Com 80%+ de progresso, aparece um botao para concluir manualmente',
          'Use a aba "Concluidas" para ver suas conquistas - e motivador!',
          'O resumo mostra: total economizado, metas ativas e metas concluidas',
          'Defina prazos realistas para manter a motivacao',
        ],
        examples: [
          { text: 'Viagem para praia - R$ 3.000 - Prazo: 6 meses', result: 'Preciso guardar R$ 500/mes para atingir a meta' },
          { text: 'Reserva emergencia - R$ 10.000 - Sem prazo', result: 'Deposito o que sobrar todo mes ate chegar la' },
          { text: 'Notebook novo - R$ 5.000 - Prazo: 3 meses', result: 'R$ 1.667/mes. Vou apertar os gastos!' },
        ],
        relatedPages: [{ name: 'Metas', path: '/goals' }],
      },
    ],
  },
  {
    id: 'lembretes',
    name: 'Lembretes e Notificacoes',
    icon: BellRing,
    description: 'Configure alertas e nunca esqueca um compromisso financeiro',
    sections: [
      {
        id: 'criar-lembretes',
        icon: Bell,
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-500/10',
        title: 'Criar Lembretes',
        subtitle: 'Alertas inteligentes para suas financas',
        difficulty: 'facil',
        estimatedTime: '2 min',
        steps: [
          { step: 1, title: 'Acesse Lembretes', description: 'Va em "Lembretes" no menu lateral ou via Configuracoes > Notificacoes' },
          { step: 2, title: 'Crie um lembrete', description: 'Clique em "+" e defina: titulo, descricao, data, hora e valor (opcional)' },
          { step: 3, title: 'Escolha a categoria', description: 'Selecione: Conta, Meta ou Outro' },
          { step: 4, title: 'Configure recorrencia', description: 'Escolha: Unico, Diario, Semanal, Mensal ou Anual' },
          { step: 5, title: 'Notificacao antecipada', description: 'Defina quando ser notificado: no momento, 1 hora antes, 1 dia antes, 2 dias antes ou 1 semana antes' },
          { step: 6, title: 'Ative push', description: 'Permita notificacoes do navegador para receber alertas mesmo sem o app aberto' },
        ],
        tips: [
          'Lembretes vencidos aparecem em vermelho para chamar atencao',
          'Lembretes de hoje aparecem em amarelo/amber',
          'Use o resumo no topo para ver: total de lembretes, hoje, esta semana e valor pendente',
          'Conclua lembretes com o botao de check quando a tarefa for cumprida',
          'Lembretes recorrentes sao perfeitos para contas mensais fixas',
        ],
        relatedPages: [
          { name: 'Lembretes', path: '/reminders' },
          { name: 'Notificacoes', path: '/notifications' },
        ],
      },
    ],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp AI',
    icon: MessageCircle,
    description: 'Controle suas financas direto pelo WhatsApp com inteligencia artificial',
    sections: [
      {
        id: 'vincular-whatsapp',
        icon: Phone,
        iconColor: 'text-green-500',
        iconBg: 'bg-green-500/10',
        title: 'Vincular WhatsApp',
        subtitle: 'Conecte seu numero para usar o assistente financeiro',
        difficulty: 'medio',
        estimatedTime: '3 min',
        steps: [
          { step: 1, title: 'Acesse a pagina', description: 'Va em Configuracoes > WhatsApp ou diretamente em /whatsapp' },
          { step: 2, title: 'Inicie a conversa', description: 'Clique em "Iniciar Conversa" para abrir o WhatsApp com o numero do PixZen' },
          { step: 3, title: 'Envie uma mensagem', description: 'Diga "Oi" ou qualquer coisa. O bot vai responder com um codigo de vinculacao' },
          { step: 4, title: 'Cole o codigo', description: 'Volte ao app, digite o codigo de 6 caracteres no campo e clique "Vincular"' },
          { step: 5, title: 'Pronto!', description: 'Seu WhatsApp esta conectado. Agora voce pode registrar transacoes por mensagem!' },
        ],
        tips: [
          'O codigo de vinculacao expira em 10 minutos. Se expirar, peca outro',
          'Voce pode desvincular e vincular outro numero a qualquer momento',
          'O assistente funciona 24/7 - registre gastos na hora que acontecem!',
        ],
        relatedPages: [{ name: 'WhatsApp', path: '/whatsapp' }],
      },
      {
        id: 'usar-whatsapp',
        icon: Bot,
        iconColor: 'text-green-600',
        iconBg: 'bg-green-600/10',
        title: 'Usando o Assistente AI',
        subtitle: 'Registre transacoes conversando naturalmente',
        difficulty: 'medio',
        estimatedTime: '5 min',
        steps: [
          { step: 1, title: 'Envie texto natural', description: 'Escreva como voce fala: "Gastei 45 reais no almoco" ou "Recebi 3000 de salario"' },
          { step: 2, title: 'Use comandos', description: 'Digite /ajuda para ver todos os comandos disponiveis' },
          { step: 3, title: 'Envie fotos', description: 'Tire foto de um comprovante ou nota fiscal - a IA identifica o valor e descricao automaticamente (Premium)' },
          { step: 4, title: 'Envie audios', description: 'Grave um audio descrevendo a transacao - a IA transcreve e registra (Premium)' },
          { step: 5, title: 'Envie PDFs', description: 'Encaminhe extratos e documentos em PDF para processamento automatico (Premium)' },
        ],
        examples: [
          { text: '"Gastei 150 no mercado"', result: 'Despesa: R$ 150,00 - Mercado - Categoria: Alimentacao' },
          { text: '"Recebi 5000 de freelance via pix"', result: 'Receita: R$ 5.000,00 - Freelance - PIX' },
          { text: '"Paguei 89,90 de internet"', result: 'Despesa: R$ 89,90 - Internet - Categoria: Moradia' },
          { text: '"Almocei no restaurante japones 67 reais no cartao"', result: 'Despesa: R$ 67,00 - Restaurante japones - Cartao Credito' },
          { text: '/ajuda', result: 'Lista todos os comandos e formas de uso' },
        ],
        tips: [
          'A IA entende portugues natural - nao precisa de formato especifico',
          'Quanto mais detalhes voce der, mais preciso sera o registro',
          'Mencione a forma de pagamento (pix, cartao, dinheiro) para registro completo',
          'Fotos de notas fiscais funcionam melhor com boa iluminacao',
          'Audios curtos e claros tem melhor taxa de acerto na transcricao',
          'Recurso de imagens, audios e PDFs e exclusivo para assinantes Premium',
        ],
        relatedPages: [{ name: 'WhatsApp', path: '/whatsapp' }],
      },
    ],
  },
  {
    id: 'configuracoes',
    name: 'Configuracoes e Perfil',
    icon: Settings,
    description: 'Personalize o app, gerencie sua conta e seguranca',
    sections: [
      {
        id: 'personalizar-app',
        icon: Palette,
        iconColor: 'text-indigo-500',
        iconBg: 'bg-indigo-500/10',
        title: 'Personalizar Aparencia',
        subtitle: 'Tema escuro, cores e preferencias visuais',
        difficulty: 'facil',
        estimatedTime: '1 min',
        steps: [
          { step: 1, title: 'Acesse Configuracoes', description: 'Toque no icone de engrenagem no menu' },
          { step: 2, title: 'Modo escuro/claro', description: 'Ative ou desative o tema escuro com o toggle' },
          { step: 3, title: 'Cor de destaque', description: 'Escolha entre 6 cores de destaque: Roxo, Rosa, Vermelho, Laranja, Azul ou Indigo' },
        ],
        tips: [
          'O modo escuro e mais confortavel para uso noturno e economiza bateria em telas OLED',
          'A cor de destaque afeta botoes, links e elementos interativos em todo o app',
        ],
        relatedPages: [{ name: 'Configuracoes', path: '/settings' }],
      },
      {
        id: 'perfil-conta',
        icon: UserCircle,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/10',
        title: 'Perfil e Conta',
        subtitle: 'Gerencie seus dados pessoais e assinatura',
        difficulty: 'facil',
        estimatedTime: '2 min',
        steps: [
          { step: 1, title: 'Acesse Perfil', description: 'Va em Configuracoes > Perfil ou diretamente em /profile' },
          { step: 2, title: 'Altere seu avatar', description: 'Clique na foto de perfil e escolha uma nova imagem' },
          { step: 3, title: 'Edite seu nome', description: 'Altere o campo "Nome" e clique em "Salvar"' },
          { step: 4, title: 'Veja sua assinatura', description: 'Confira o status: Ativo (verde), Trial com dias restantes (amarelo) ou Expirado (vermelho)' },
        ],
        relatedPages: [{ name: 'Perfil', path: '/profile' }],
      },
      {
        id: 'seguranca',
        icon: Lock,
        iconColor: 'text-red-500',
        iconBg: 'bg-red-500/10',
        title: 'Seguranca',
        subtitle: 'Altere sua senha e proteja sua conta',
        difficulty: 'facil',
        estimatedTime: '1 min',
        steps: [
          { step: 1, title: 'Acesse Seguranca', description: 'Va em Configuracoes > Seguranca ou diretamente em /security' },
          { step: 2, title: 'Altere sua senha', description: 'Informe a senha atual, nova senha (minimo 6 caracteres) e confirme' },
          { step: 3, title: 'Salve', description: 'Clique em "Alterar Senha" e pronto!' },
        ],
        tips: [
          'Use uma senha forte com letras, numeros e caracteres especiais',
          'Nunca compartilhe sua senha com ninguem',
          'Se esqueceu a senha, entre em contato com o suporte',
        ],
        relatedPages: [{ name: 'Seguranca', path: '/security' }],
      },
    ],
  },
];

const FAQ_ITEMS = [
  { q: 'Meus dados estao seguros?', a: 'Sim! Usamos criptografia JWT, HTTPS obrigatorio, headers de seguranca e rate limiting. Seus dados financeiros nunca sao compartilhados.' },
  { q: 'Posso usar no celular e computador?', a: 'Sim! O PixZen e 100% responsivo. Funciona em qualquer dispositivo com navegador: celular, tablet e computador.' },
  { q: 'O que acontece quando o trial de 7 dias acaba?', a: 'Voce continua usando as funcoes basicas (texto). Funcoes premium como WhatsApp com audio, imagem e PDF requerem assinatura.' },
  { q: 'Posso ter conta pessoal e empresarial?', a: 'Sim! O app tem dois tipos de conta integrados. Alterne entre eles no topo do dashboard. Cada um tem transacoes e analises separadas.' },
  { q: 'Como cancelo minha conta?', a: 'Entre em contato com o suporte. Seus dados podem ser exportados antes da exclusao.' },
  { q: 'O assistente WhatsApp entende qualquer mensagem?', a: 'Ele entende portugues natural para transacoes financeiras. Quanto mais detalhes voce der (valor, descricao, categoria), melhor o registro.' },
  { q: 'Posso exportar meus dados?', a: 'Sim! Exporte transacoes em CSV e relatorios em PDF/HTML pela pagina de Analises e Transacoes.' },
  { q: 'Quantas transacoes posso registrar?', a: 'No plano Premium e durante o trial, sao ate 999 mensagens por mes via WhatsApp. Pelo app web, nao ha limite.' },
];

// ============ COMPONENTS ============

const DifficultyBadge = ({ level }: { level: string }) => {
  const config = {
    facil: { label: 'Facil', bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', icon: Zap },
    medio: { label: 'Medio', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: Star },
    avancado: { label: 'Avancado', bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', icon: Sparkles },
  }[level] || { label: level, bg: 'bg-gray-500/10', text: 'text-gray-500', icon: HelpCircle };

  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', config.bg, config.text)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

const StepCard = ({ step }: { step: GuideStep }) => (
  <div className="flex gap-3 group">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
      {step.step}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-medium text-foreground text-sm">{step.title}</h4>
      <p className="text-muted-foreground text-sm mt-0.5 leading-relaxed">{step.description}</p>
      {step.tip && (
        <div className="flex items-start gap-1.5 mt-1.5 text-xs text-amber-600 dark:text-amber-400">
          <Lightbulb className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>{step.tip}</span>
        </div>
      )}
    </div>
  </div>
);

const ExampleCard = ({ example }: { example: { text: string; result: string } }) => (
  <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
    <div className="flex items-start gap-2">
      <MessageCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{example.text}</p>
        <div className="flex items-start gap-1.5 mt-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">{example.result}</p>
        </div>
      </div>
    </div>
  </div>
);

const SectionDetail = ({ section, onBack }: { section: GuideSection; onBack: () => void }) => {
  const Icon = section.icon;
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', section.iconBg)}>
          <Icon className={cn('h-6 w-6', section.iconColor)} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
          <p className="text-sm text-muted-foreground">{section.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <DifficultyBadge level={section.difficulty} />
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" /> {section.estimatedTime}
        </span>
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          Passo a Passo
        </h3>
        <div className="space-y-4 pl-1">
          {section.steps.map((step) => (
            <StepCard key={step.step} step={step} />
          ))}
        </div>
      </div>

      {/* Examples */}
      {section.examples && section.examples.length > 0 && (
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-green-500" />
            Exemplos
          </h3>
          <div className="grid gap-2">
            {section.examples.map((ex, i) => (
              <ExampleCard key={i} example={ex} />
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {section.tips && section.tips.length > 0 && (
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Dicas
          </h3>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-2">
            {section.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-foreground/80">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Pages */}
      {section.relatedPages && section.relatedPages.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-primary" />
            Paginas Relacionadas
          </h3>
          <div className="flex flex-wrap gap-2">
            {section.relatedPages.map((page) => (
              <a
                key={page.path}
                href={page.path}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                {page.name}
                <ChevronRight className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============ MAIN PAGE ============
export default function HelpGuide() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<GuideSection | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Search filtering
  const filteredCategories = GUIDE_CATEGORIES.map(cat => ({
    ...cat,
    sections: cat.sections.filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.steps.some(st => st.title.toLowerCase().includes(q) || st.description.toLowerCase().includes(q)) ||
        (s.tips || []).some(t => t.toLowerCase().includes(q)) ||
        (s.examples || []).some(e => e.text.toLowerCase().includes(q) || e.result.toLowerCase().includes(q))
      );
    }),
  })).filter(cat => cat.sections.length > 0);

  const totalSections = GUIDE_CATEGORIES.reduce((acc, cat) => acc + cat.sections.length, 0);
  const filteredSections = filteredCategories.reduce((acc, cat) => acc + cat.sections.length, 0);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (selectedSection) setSelectedSection(null);
        else if (selectedCategory) setSelectedCategory(null);
        else if (searchQuery) setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedSection, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border/50">
          <div className="container flex h-16 items-center px-4 gap-3">
            <div className="md:hidden flex-shrink-0">
              <MobileSidebar />
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
              <h1 className="font-semibold truncate">Central de Ajuda</h1>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 container px-4 py-6 pb-24 md:pb-6 max-w-3xl mx-auto w-full">
          {selectedSection ? (
            <SectionDetail
              section={selectedSection}
              onBack={() => setSelectedSection(null)}
            />
          ) : (
            <>
              {/* Hero */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <HelpCircle className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Como posso ajudar?</h1>
                <p className="text-muted-foreground text-sm">
                  Tutoriais completos para dominar o PixZen
                </p>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  placeholder="Buscar tutorial... (pressione / para focar)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-11 bg-card border-border/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {searchQuery && (
                <p className="text-xs text-muted-foreground mb-4">
                  {filteredSections} de {totalSections} tutoriais encontrados
                </p>
              )}

              {/* Quick Start Banner */}
              {!searchQuery && !selectedCategory && (
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">Inicio Rapido</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-2">Novo no PixZen? Siga estes 3 passos para comecar:</p>
                      <div className="space-y-1.5">
                        {[
                          { n: '1', t: 'Crie sua conta', action: () => { const s = GUIDE_CATEGORIES[0].sections[0]; setSelectedSection(s); }},
                          { n: '2', t: 'Adicione sua primeira transacao', action: () => { const s = GUIDE_CATEGORIES[1].sections[0]; setSelectedSection(s); }},
                          { n: '3', t: 'Vincule seu WhatsApp', action: () => { const s = GUIDE_CATEGORIES[6].sections[0]; setSelectedSection(s); }},
                        ].map(item => (
                          <button
                            key={item.n}
                            onClick={item.action}
                            className="flex items-center gap-2 text-sm text-foreground/80 hover:text-primary transition-colors w-full text-left"
                          >
                            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{item.n}</span>
                            <span>{item.t}</span>
                            <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Categories */}
              <div className="space-y-4">
                {filteredCategories.map((category) => {
                  const Icon = category.icon;
                  const isExpanded = selectedCategory === category.id || !!searchQuery;

                  return (
                    <div key={category.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                      <button
                        onClick={() => setSelectedCategory(isExpanded && !searchQuery ? null : category.id)}
                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm">{category.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{category.description}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                            {category.sections.length} {category.sections.length === 1 ? 'guia' : 'guias'}
                          </span>
                          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-200">
                          {category.sections.map((section) => {
                            const SIcon = section.icon;
                            return (
                              <button
                                key={section.id}
                                onClick={() => setSelectedSection(section)}
                                className="w-full flex items-center gap-3 p-3 px-4 text-left hover:bg-muted/40 transition-colors border-b border-border/30 last:border-b-0"
                              >
                                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', section.iconBg)}>
                                  <SIcon className={cn('h-4 w-4', section.iconColor)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-foreground text-sm">{section.title}</h4>
                                  <p className="text-xs text-muted-foreground truncate">{section.subtitle}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <DifficultyBadge level={section.difficulty} />
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* No results */}
              {searchQuery && filteredCategories.length === 0 && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">Nenhum resultado</h3>
                  <p className="text-sm text-muted-foreground">
                    Tente buscar por outro termo como "transacao", "whatsapp", "cartao" ou "meta"
                  </p>
                </div>
              )}

              {/* FAQ */}
              {!searchQuery && (
                <div className="mt-8">
                  <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    Perguntas Frequentes
                  </h2>
                  <div className="space-y-2">
                    {FAQ_ITEMS.map((faq, i) => (
                      <div key={i} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                        <button
                          onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                          className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-muted/30 transition-colors"
                        >
                          <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="flex-1 text-sm font-medium text-foreground">{faq.q}</span>
                          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expandedFaq === i && 'rotate-180')} />
                        </button>
                        {expandedFaq === i && (
                          <div className="px-3.5 pb-3.5 pl-10 animate-in fade-in slide-in-from-top-2 duration-200">
                            <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-xs text-muted-foreground">
                  Ainda precisa de ajuda? Entre em contato pelo{' '}
                  <a href="/whatsapp" className="text-primary hover:underline">WhatsApp</a>
                </p>
              </div>
            </>
          )}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
