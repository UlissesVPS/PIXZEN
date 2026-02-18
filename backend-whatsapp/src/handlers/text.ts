import { TransactionData } from '../types';
import { openaiService } from '../services/openai';
import { supabaseService } from '../services/supabase';
import { uazapiService } from '../services/uazapi';
import { logger } from '../utils/logger';
import { HELP_MESSAGE, ERROR_MESSAGES } from '../prompts/finance';

const COMMANDS = {
  HELP: ['/ajuda', '/help', 'ajuda', 'help', '?'],
  BALANCE: ['/saldo', '/resumo', 'saldo', 'resumo'],
};

export async function handleTextMessage(
  phone: string,
  text: string,
  userId: string
): Promise<void> {
  const normalizedText = text.toLowerCase().trim();

  if (COMMANDS.HELP.some(cmd => normalizedText === cmd)) {
    await uazapiService.sendText(phone, HELP_MESSAGE);
    return;
  }

  if (COMMANDS.BALANCE.some(cmd => normalizedText.startsWith(cmd))) {
    await handleBalanceCommand(phone, userId);
    return;
  }

  await processFinancialText(phone, text, userId);
}

async function handleBalanceCommand(phone: string, userId: string): Promise<void> {
  try {
    const personalSummary = await supabaseService.getMonthSummary(userId, 'personal');
    const businessSummary = await supabaseService.getMonthSummary(userId, 'business');

    const currentMonth = new Date().toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    });

    let message = `*Resumo de ${currentMonth}*\n\n`;
    message += `*Conta Pessoal*\n`;
    message += `   Receitas: R$ ${personalSummary.income.toFixed(2)}\n`;
    message += `   Despesas: R$ ${personalSummary.expense.toFixed(2)}\n`;
    message += `   Saldo: R$ ${personalSummary.balance.toFixed(2)}\n`;
    message += `   Transacoes: ${personalSummary.transactionCount}\n\n`;
    message += `*Conta Empresarial*\n`;
    message += `   Receitas: R$ ${businessSummary.income.toFixed(2)}\n`;
    message += `   Despesas: R$ ${businessSummary.expense.toFixed(2)}\n`;
    message += `   Saldo: R$ ${businessSummary.balance.toFixed(2)}\n`;
    message += `   Transacoes: ${businessSummary.transactionCount}\n\n`;

    const totalBalance = personalSummary.balance + businessSummary.balance;
    message += `*Saldo Total: R$ ${totalBalance.toFixed(2)}*`;

    await uazapiService.sendText(phone, message);
  } catch (error) {
    logger.error('Erro ao buscar saldo', error);
    await uazapiService.sendText(phone, ERROR_MESSAGES.GENERAL);
  }
}

async function processFinancialText(
  phone: string,
  text: string,
  userId: string
): Promise<void> {
  try {
    logger.info(`Processando texto financeiro: "${text}"`);

    const transactionData = await openaiService.analyzeText(text);

    if (!transactionData) {
      await uazapiService.sendText(
        phone,
        'Nao consegui identificar uma transacao nessa mensagem.\n\n' +
        'Tente algo como:\n' +
        '- "gastei 50 no mercado"\n' +
        '- "recebi 1500 de salario"\n' +
        '- "paguei 89,90 de internet"\n\n' +
        'Digite /ajuda para ver mais exemplos.'
      );
      return;
    }

    // Sempre usar conta pessoal (empresarial em desenvolvimento)
    const accountType = 'personal';

    const saved = await supabaseService.saveTransaction(
      userId,
      transactionData,
      'whatsapp_text',
      accountType
    );

    if (!saved) {
      await uazapiService.sendText(phone, ERROR_MESSAGES.SAVE_FAILED);
      return;
    }

    await supabaseService.incrementUsage(userId, 'messages');

    const emoji = transactionData.type === 'income' ? '💰' : '💸';
    const typeText = transactionData.type === 'income' ? 'Receita' : 'Despesa';
    const accountText = 'Pessoal'; // Empresarial em desenvolvimento

    const confirmationMessage =
      `${emoji} *${typeText} registrada!*\n\n` +
      `💵 Valor: R$ ${transactionData.amount.toFixed(2)}\n` +
      `📁 Categoria: ${transactionData.category}\n` +
      `📝 Descricao: ${transactionData.description}\n` +
      `📅 Data: ${formatDate(transactionData.date)}\n` +
      `🏦 Conta: ${accountText}`;

    await uazapiService.sendText(phone, confirmationMessage);

  } catch (error) {
    logger.error('Erro ao processar texto financeiro', error);
    await uazapiService.sendText(phone, ERROR_MESSAGES.GENERAL);
  }
}

function detectAccountType(text: string): 'personal' | 'business' {
  const businessKeywords = [
    'empresa', 'empresarial', 'negocio', 'comercial',
    'loja', 'cliente', 'fornecedor', 'nota fiscal', 'nf',
    'cnpj', 'pj', 'mei', 'funcionario'
  ];

  const normalizedText = text.toLowerCase();

  for (const keyword of businessKeywords) {
    if (normalizedText.includes(keyword)) {
      return 'business';
    }
  }

  return 'personal';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}
