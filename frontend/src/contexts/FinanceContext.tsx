import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { transactionsApi } from '@/services/transactionsApi';
import { creditCardsApi } from '@/services/creditCardsApi';
import { billsApi } from '@/services/billsApi';
import { receivablesApi } from '@/services/receivablesApi';

export type AccountType = 'personal' | 'business';
export type TransactionType = 'income' | 'expense';
export type PeriodFilter = 'week' | 'month' | 'year';
export type PaymentMethod = 'pix' | 'cash' | 'boleto' | 'credit_card' | 'debit_card' | 'ted';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  accountType?: AccountType;
  isCustom?: boolean;
}

export interface CreditCard {
  id: string;
  name: string;
  lastDigits: string;
  brand: 'visa' | 'mastercard' | 'elo' | 'amex' | 'other';
  limit: number;
  usedLimit: number;
  dueDay: number;
  closingDay: number;
  color: string;
  accountType: AccountType;
}

export interface CardInvoice {
  id: string;
  cardId: string;
  month: number;
  year: number;
  total: number;
  dueDate: Date;
  status: 'open' | 'closed' | 'paid' | 'overdue';
  transactions: string[];
}

export interface Bill {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  categoryId: string;
  status: 'pending' | 'paid' | 'overdue';
  recurrence?: 'monthly' | 'weekly' | 'yearly' | 'once';
  accountType: AccountType;
}

export interface Receivable {
  id: string;
  description: string;
  amount: number;
  expectedDate: Date;
  categoryId: string;
  status: 'pending' | 'received' | 'overdue';
  payer?: string;
  accountType: AccountType;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: Date;
  accountType: AccountType;
  paymentMethod?: PaymentMethod;
  cardId?: string;
  installments?: number;
  currentInstallment?: number;
  installmentGroupId?: string;
}

interface FinanceContextType {
  accountType: AccountType;
  setAccountType: (type: AccountType) => void;
  periodFilter: PeriodFilter;
  setPeriodFilter: (filter: PeriodFilter) => void;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void | Promise<void>;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => Promise<void>;
  deleteTransaction: (id: string) => void | Promise<void>;
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => string;
  deleteCategory: (id: string) => void;
  getFilteredTransactions: () => Transaction[];
  getTotalIncome: () => number;
  getTotalExpense: () => number;
  getBalance: () => number;
  getCategoriesByType: (type: TransactionType, account: AccountType) => Category[];
  creditCards: CreditCard[];
  addCreditCard: (card: Omit<CreditCard, 'id'>) => void;
  updateCreditCard: (id: string, card: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string) => void;
  getCardInvoices: (cardId: string) => CardInvoice[];
  bills: Bill[];
  addBill: (bill: Omit<Bill, 'id'>) => void;
  updateBill: (id: string, bill: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  markBillAsPaid: (id: string) => void;
  receivables: Receivable[];
  addReceivable: (receivable: Omit<Receivable, 'id'>) => void;
  updateReceivable: (id: string, receivable: Partial<Receivable>) => void;
  deleteReceivable: (id: string) => void;
  markAsReceived: (id: string) => void;
}

const defaultCategories: Category[] = [
  // ========== PERSONAL INCOME ==========
  { id: 'salary', name: 'Salário', icon: '💰', color: 'hsl(152, 69%, 40%)', type: 'income', accountType: 'personal' },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: 'hsl(217, 91%, 60%)', type: 'income', accountType: 'personal' },
  { id: 'investments', name: 'Investimentos', icon: '📈', color: 'hsl(160, 84%, 39%)', type: 'income', accountType: 'personal' },
  { id: 'bonus', name: 'Bônus', icon: '🎁', color: 'hsl(38, 92%, 50%)', type: 'income', accountType: 'personal' },
  { id: 'rental', name: 'Aluguel Recebido', icon: '🏠', color: 'hsl(199, 89%, 48%)', type: 'income', accountType: 'personal' },
  { id: 'dividends', name: 'Dividendos', icon: '💹', color: 'hsl(262, 83%, 58%)', type: 'income', accountType: 'personal' },
  { id: 'refund', name: 'Reembolso', icon: '↩️', color: 'hsl(173, 58%, 39%)', type: 'income', accountType: 'personal' },
  { id: 'gift_income', name: 'Presente', icon: '🎀', color: 'hsl(340, 82%, 52%)', type: 'income', accountType: 'personal' },
  { id: 'cashback', name: 'Cashback', icon: '💸', color: 'hsl(24, 95%, 53%)', type: 'income', accountType: 'personal' },
  { id: 'other_income', name: 'Outras Receitas', icon: '📥', color: 'hsl(220, 14%, 46%)', type: 'income', accountType: 'personal' },
  // ========== PERSONAL EXPENSE ==========
  { id: 'food', name: 'Alimentação', icon: '🍔', color: 'hsl(24, 95%, 53%)', type: 'expense', accountType: 'personal' },
  { id: 'groceries', name: 'Mercado', icon: '🛒', color: 'hsl(152, 69%, 40%)', type: 'expense', accountType: 'personal' },
  { id: 'restaurant', name: 'Restaurante', icon: '🍽️', color: 'hsl(340, 82%, 52%)', type: 'expense', accountType: 'personal' },
  { id: 'coffee', name: 'Café', icon: '☕', color: 'hsl(30, 60%, 45%)', type: 'expense', accountType: 'personal' },
  { id: 'transport', name: 'Transporte', icon: '🚗', color: 'hsl(262, 83%, 58%)', type: 'expense', accountType: 'personal' },
  { id: 'fuel', name: 'Combustível', icon: '⛽', color: 'hsl(0, 84%, 60%)', type: 'expense', accountType: 'personal' },
  { id: 'uber', name: 'Uber/99', icon: '🚕', color: 'hsl(45, 100%, 50%)', type: 'expense', accountType: 'personal' },
  { id: 'parking', name: 'Estacionamento', icon: '🅿️', color: 'hsl(217, 91%, 60%)', type: 'expense', accountType: 'personal' },
  { id: 'entertainment', name: 'Lazer', icon: '🎮', color: 'hsl(340, 82%, 52%)', type: 'expense', accountType: 'personal' },
  { id: 'streaming', name: 'Streaming', icon: '📺', color: 'hsl(0, 79%, 63%)', type: 'expense', accountType: 'personal' },
  { id: 'music', name: 'Música', icon: '🎵', color: 'hsl(141, 71%, 48%)', type: 'expense', accountType: 'personal' },
  { id: 'games', name: 'Jogos', icon: '🎯', color: 'hsl(271, 91%, 65%)', type: 'expense', accountType: 'personal' },
  { id: 'health', name: 'Saúde', icon: '🏥', color: 'hsl(0, 84%, 60%)', type: 'expense', accountType: 'personal' },
  { id: 'pharmacy', name: 'Farmácia', icon: '💊', color: 'hsl(160, 84%, 39%)', type: 'expense', accountType: 'personal' },
  { id: 'gym', name: 'Academia', icon: '🏋️', color: 'hsl(24, 95%, 53%)', type: 'expense', accountType: 'personal' },
  { id: 'doctor', name: 'Médico', icon: '👨‍⚕️', color: 'hsl(199, 89%, 48%)', type: 'expense', accountType: 'personal' },
  { id: 'education', name: 'Educação', icon: '📚', color: 'hsl(199, 89%, 48%)', type: 'expense', accountType: 'personal' },
  { id: 'courses', name: 'Cursos', icon: '🎓', color: 'hsl(262, 83%, 58%)', type: 'expense', accountType: 'personal' },
  { id: 'books', name: 'Livros', icon: '📖', color: 'hsl(30, 60%, 45%)', type: 'expense', accountType: 'personal' },
  { id: 'shopping', name: 'Compras', icon: '🛍️', color: 'hsl(38, 92%, 50%)', type: 'expense', accountType: 'personal' },
  { id: 'clothing', name: 'Roupas', icon: '👕', color: 'hsl(217, 91%, 60%)', type: 'expense', accountType: 'personal' },
  { id: 'electronics', name: 'Eletrônicos', icon: '📱', color: 'hsl(220, 14%, 46%)', type: 'expense', accountType: 'personal' },
  { id: 'beauty', name: 'Beleza', icon: '💄', color: 'hsl(340, 82%, 52%)', type: 'expense', accountType: 'personal' },
  { id: 'home', name: 'Casa', icon: '🏠', color: 'hsl(173, 58%, 39%)', type: 'expense', accountType: 'personal' },
  { id: 'rent', name: 'Aluguel', icon: '🔑', color: 'hsl(24, 95%, 53%)', type: 'expense', accountType: 'personal' },
  { id: 'utilities', name: 'Contas de Casa', icon: '💡', color: 'hsl(45, 100%, 50%)', type: 'expense', accountType: 'personal' },
  { id: 'internet', name: 'Internet', icon: '🌐', color: 'hsl(217, 91%, 60%)', type: 'expense', accountType: 'personal' },
  { id: 'phone', name: 'Telefone', icon: '📞', color: 'hsl(152, 69%, 40%)', type: 'expense', accountType: 'personal' },
  { id: 'insurance', name: 'Seguro', icon: '🛡️', color: 'hsl(199, 89%, 48%)', type: 'expense', accountType: 'personal' },
  { id: 'pets', name: 'Pets', icon: '🐕', color: 'hsl(30, 60%, 45%)', type: 'expense', accountType: 'personal' },
  { id: 'travel', name: 'Viagem', icon: '✈️', color: 'hsl(199, 89%, 48%)', type: 'expense', accountType: 'personal' },
  { id: 'gifts', name: 'Presentes', icon: '🎁', color: 'hsl(340, 82%, 52%)', type: 'expense', accountType: 'personal' },
  { id: 'subscriptions', name: 'Assinaturas', icon: '📋', color: 'hsl(262, 83%, 58%)', type: 'expense', accountType: 'personal' },
  { id: 'maintenance', name: 'Manutenção', icon: '🔧', color: 'hsl(220, 14%, 46%)', type: 'expense', accountType: 'personal' },
  { id: 'taxes_personal', name: 'Impostos', icon: '📑', color: 'hsl(0, 84%, 60%)', type: 'expense', accountType: 'personal' },
  { id: 'donations', name: 'Doações', icon: '❤️', color: 'hsl(340, 82%, 52%)', type: 'expense', accountType: 'personal' },
  { id: 'kids', name: 'Filhos', icon: '👶', color: 'hsl(199, 89%, 48%)', type: 'expense', accountType: 'personal' },
  { id: 'other_expense', name: 'Outros', icon: '📤', color: 'hsl(220, 14%, 46%)', type: 'expense', accountType: 'personal' },
  // ========== BUSINESS INCOME ==========
  { id: 'sales', name: 'Vendas', icon: '💵', color: 'hsl(152, 69%, 40%)', type: 'income', accountType: 'business' },
  { id: 'services', name: 'Serviços Prestados', icon: '🔧', color: 'hsl(217, 91%, 60%)', type: 'income', accountType: 'business' },
  { id: 'consulting', name: 'Consultoria', icon: '💼', color: 'hsl(262, 83%, 58%)', type: 'income', accountType: 'business' },
  { id: 'contracts', name: 'Contratos', icon: '📝', color: 'hsl(160, 84%, 39%)', type: 'income', accountType: 'business' },
  { id: 'commissions', name: 'Comissões', icon: '🤝', color: 'hsl(38, 92%, 50%)', type: 'income', accountType: 'business' },
  { id: 'client_advance', name: 'Adiantamento Clientes', icon: '💳', color: 'hsl(199, 89%, 48%)', type: 'income', accountType: 'business' },
  { id: 'royalties', name: 'Royalties', icon: '👑', color: 'hsl(45, 100%, 50%)', type: 'income', accountType: 'business' },
  { id: 'investments_biz', name: 'Rendimentos Financeiros', icon: '📊', color: 'hsl(173, 58%, 39%)', type: 'income', accountType: 'business' },
  { id: 'tax_recovery', name: 'Recuperação de Impostos', icon: '🔄', color: 'hsl(141, 71%, 48%)', type: 'income', accountType: 'business' },
  { id: 'grants', name: 'Subsídios/Incentivos', icon: '🏛️', color: 'hsl(24, 95%, 53%)', type: 'income', accountType: 'business' },
  { id: 'licensing', name: 'Licenciamentos', icon: '📜', color: 'hsl(271, 91%, 65%)', type: 'income', accountType: 'business' },
  { id: 'refund_biz', name: 'Reembolsos', icon: '↩️', color: 'hsl(30, 60%, 45%)', type: 'income', accountType: 'business' },
  { id: 'other_income_biz', name: 'Outras Receitas', icon: '📥', color: 'hsl(220, 14%, 46%)', type: 'income', accountType: 'business' },
  // ========== BUSINESS EXPENSE - FOLHA DE PAGAMENTO ==========
  { id: 'salary_employees', name: 'Salários Funcionários', icon: '👤', color: 'hsl(217, 91%, 60%)', type: 'expense', accountType: 'business' },
  { id: 'prolabore', name: 'Pró-labore', icon: '👔', color: 'hsl(262, 83%, 58%)', type: 'expense', accountType: 'business' },
  { id: 'inss_patronal', name: 'INSS Patronal', icon: '🏥', color: 'hsl(0, 84%, 60%)', type: 'expense', accountType: 'business' },
  { id: 'fgts', name: 'FGTS', icon: '🏦', color: 'hsl(38, 92%, 50%)', type: 'expense', accountType: 'business' },
  { id: 'thirteenth_salary', name: '13º Salário', icon: '🎄', color: 'hsl(152, 69%, 40%)', type: 'expense', accountType: 'business' },
  { id: 'vacation_pay', name: 'Férias', icon: '🏖️', color: 'hsl(199, 89%, 48%)', type: 'expense', accountType: 'business' },
  { id: 'severance', name: 'Rescisões', icon: '📋', color: 'hsl(0, 72%, 51%)', type: 'expense', accountType: 'business' },
  // ========== BUSINESS EXPENSE - BENEFÍCIOS ==========
  { id: 'vale_transporte', name: 'Vale Transporte', icon: '🚌', color: 'hsl(173, 58%, 39%)', type: 'expense', accountType: 'business' },
  { id: 'vale_refeicao', name: 'Vale Refeição', icon: '🍽️', color: 'hsl(24, 95%, 53%)', type: 'expense', accountType: 'business' },
  { id: 'vale_alimentacao', name: 'Vale Alimentação', icon: '🛒', color: 'hsl(141, 71%, 48%)', type: 'expense', accountType: 'business' },
  { id: 'health_plan', name: 'Plano de Saúde', icon: '💊', color: 'hsl(340, 82%, 52%)', type: 'expense', accountType: 'business' },
  { id: 'dental_plan', name: 'Plano Odontológico', icon: '🦷', color: 'hsl(199, 89%, 48%)', type: 'expense', accountType: 'business' },
  { id: 'life_insurance', name: 'Seguro de Vida', icon: '🛡️', color: 'hsl(220, 14%, 46%)', type: 'expense', accountType: 'business' },
  // ========== BUSINESS EXPENSE - SERVIÇOS TERCEIRIZADOS ==========
  { id: 'outsourced_services', name: 'Serviços Terceirizados', icon: '🤝', color: 'hsl(262, 83%, 58%)', type: 'expense', accountType: 'business' },
  { id: 'freelancers_pj', name: 'Autônomos/PJ', icon: '💻', color: 'hsl(217, 91%, 60%)', type: 'expense', accountType: 'business' },
  { id: 'accounting', name: 'Contabilidade', icon: '🧮', color: 'hsl(160, 84%, 39%)', type: 'expense', accountType: 'business' },
  { id: 'legal', name: 'Jurídico/Advocacia', icon: '⚖️', color: 'hsl(220, 14%, 46%)', type: 'expense', accountType: 'business' },
  { id: 'consulting_expense', name: 'Consultoria Externa', icon: '📊', color: 'hsl(271, 91%, 65%)', type: 'expense', accountType: 'business' },
  { id: 'cleaning', name: 'Limpeza/Zeladoria', icon: '🧹', color: 'hsl(173, 58%, 39%)', type: 'expense', accountType: 'business' },
  { id: 'security', name: 'Segurança/Vigilância', icon: '🔒', color: 'hsl(0, 84%, 60%)', type: 'expense', accountType: 'business' },
  // ========== BUSINESS EXPENSE - IMPOSTOS ==========
  { id: 'simples_das', name: 'Simples Nacional (DAS)', icon: '📑', color: 'hsl(0, 84%, 60%)', type: 'expense', accountType: 'business' },
  { id: 'irpj', name: 'IRPJ', icon: '🏛️', color: 'hsl(38, 92%, 50%)', type: 'expense', accountType: 'business' },
  { id: 'csll', name: 'CSLL', icon: '📋', color: 'hsl(24, 95%, 53%)', type: 'expense', accountType: 'business' },
  { id: 'pis', name: 'PIS', icon: '📄', color: 'hsl(217, 91%, 60%)', type: 'expense', accountType: 'business' },
  { id: 'cofins', name: 'COFINS', icon: '📃', color: 'hsl(262, 83%, 58%)', type: 'expense', accountType: 'business' },
  { id: 'iss', name: 'ISS', icon: '🏙️', color: 'hsl(199, 89%, 48%)', type: 'expense', accountType: 'business' },
  { id: 'icms', name: 'ICMS', icon: '🚛', color: 'hsl(152, 69%, 40%)', type: 'expense', accountType: 'business' },
  { id: 'ipi', name: 'IPI', icon: '🏭', color: 'hsl(30, 60%, 45%)', type: 'expense', accountType: 'business' },
  // ========== BUSINESS EXPENSE - TAXAS ==========
  { id: 'bank_fees', name: 'Tarifas Bancárias', icon: '🏦', color: 'hsl(220, 14%, 46%)', type: 'expense', accountType: 'business' },
  { id: 'card_fees', name: 'Taxas de Cartão', icon: '💳', color: 'hsl(340, 82%, 52%)', type: 'expense', accountType: 'business' },
  { id: 'pix_fees', name: 'Taxas PIX/TED', icon: '📲', color: 'hsl(173, 58%, 39%)', type: 'expense', accountType: 'business' },
  { id: 'iof', name: 'IOF', icon: '📊', color: 'hsl(38, 92%, 50%)', type: 'expense', accountType: 'business' },
  { id: 'interest_fines', name: 'Juros e Multas', icon: '⚠️', color: 'hsl(0, 72%, 51%)', type: 'expense', accountType: 'business' },
  { id: 'loans', name: 'Empréstimos', icon: '💰', color: 'hsl(262, 83%, 58%)', type: 'expense', accountType: 'business' },
  { id: 'financing', name: 'Financiamentos', icon: '📈', color: 'hsl(217, 91%, 60%)', type: 'expense', accountType: 'business' },
  // ========== BUSINESS EXPENSE - OPERACIONAL ==========
  { id: 'supplies', name: 'Suprimentos/Insumos', icon: '📦', color: 'hsl(24, 95%, 53%)', type: 'expense', accountType: 'business' },
  { id: 'equipment', name: 'Equipamentos', icon: '🖥️', color: 'hsl(220, 14%, 46%)', type: 'expense', accountType: 'business' },
  { id: 'software', name: 'Software/Sistemas', icon: '💿', color: 'hsl(262, 83%, 58%)', type: 'expense', accountType: 'business' },
  { id: 'marketing', name: 'Marketing/Publicidade', icon: '📢', color: 'hsl(340, 82%, 52%)', type: 'expense', accountType: 'business' },
  { id: 'office', name: 'Material de Escritório', icon: '🏢', color: 'hsl(199, 89%, 48%)', type: 'expense', accountType: 'business' },
  { id: 'rent_biz', name: 'Aluguel Comercial', icon: '🔑', color: 'hsl(24, 95%, 53%)', type: 'expense', accountType: 'business' },
  { id: 'utilities_biz', name: 'Água/Luz/Internet', icon: '💡', color: 'hsl(45, 100%, 50%)', type: 'expense', accountType: 'business' },
  { id: 'shipping', name: 'Frete/Logística', icon: '🚚', color: 'hsl(173, 58%, 39%)', type: 'expense', accountType: 'business' },
  { id: 'maintenance_biz', name: 'Manutenção', icon: '🔧', color: 'hsl(30, 60%, 45%)', type: 'expense', accountType: 'business' },
  { id: 'travel_biz', name: 'Viagens Corporativas', icon: '✈️', color: 'hsl(199, 89%, 48%)', type: 'expense', accountType: 'business' },
  { id: 'training', name: 'Treinamento/Capacitação', icon: '📖', color: 'hsl(152, 69%, 40%)', type: 'expense', accountType: 'business' },
  { id: 'insurance_biz', name: 'Seguros Empresariais', icon: '🛡️', color: 'hsl(217, 91%, 60%)', type: 'expense', accountType: 'business' },
  { id: 'vehicle_fleet', name: 'Frota/Veículos', icon: '🚗', color: 'hsl(38, 92%, 50%)', type: 'expense', accountType: 'business' },
  { id: 'other_expense_biz', name: 'Outras Despesas', icon: '📤', color: 'hsl(220, 14%, 46%)', type: 'expense', accountType: 'business' },
];

const generateMockTransactions = (): Transaction[] => {
  const now = new Date();
  const transactions: Transaction[] = [];
  const personalIncomeCategories = ['salary', 'freelance', 'investments', 'bonus', 'cashback'];
  const personalExpenseCategories = ['food', 'groceries', 'transport', 'fuel', 'entertainment', 'streaming', 'health', 'pharmacy', 'education', 'shopping', 'clothing', 'home', 'utilities', 'internet', 'subscriptions'];
  const businessIncomeCategories = ['sales', 'services', 'consulting', 'contracts', 'commissions', 'client_advance', 'investments_biz', 'tax_recovery'];
  const businessExpenseCategories = ['salary_employees', 'prolabore', 'inss_patronal', 'fgts', 'vale_transporte', 'vale_refeicao', 'health_plan', 'outsourced_services', 'freelancers_pj', 'accounting', 'simples_das', 'irpj', 'iss', 'bank_fees', 'card_fees', 'supplies', 'equipment', 'software', 'marketing', 'rent_biz', 'utilities_biz', 'shipping'];
  const paymentMethods: PaymentMethod[] = ['pix', 'cash', 'credit_card', 'debit_card', 'ted', 'boleto'];
  const amounts: Record<string, [number, number]> = {
    salary: [3000, 12000], freelance: [500, 5000], investments: [100, 2000], bonus: [500, 3000], cashback: [10, 100],
    food: [15, 80], groceries: [100, 500], transport: [20, 150], fuel: [100, 300], entertainment: [30, 200],
    streaming: [20, 80], health: [50, 500], pharmacy: [20, 200], education: [100, 1000], shopping: [50, 500],
    clothing: [80, 400], home: [100, 800], utilities: [150, 400], internet: [80, 200], subscriptions: [20, 100],
    sales: [1000, 15000], services: [500, 8000], consulting: [1000, 10000], contracts: [2000, 20000],
    commissions: [200, 2000], client_advance: [500, 5000], investments_biz: [100, 3000], tax_recovery: [200, 5000],
    salary_employees: [2000, 8000], prolabore: [3000, 15000], inss_patronal: [500, 3000], fgts: [200, 1500],
    vale_transporte: [100, 500], vale_refeicao: [300, 1000], health_plan: [200, 2000],
    outsourced_services: [500, 5000], freelancers_pj: [1000, 8000], accounting: [500, 2000],
    simples_das: [500, 5000], irpj: [1000, 10000], iss: [100, 2000], bank_fees: [30, 200],
    card_fees: [50, 500], supplies: [100, 1000], equipment: [500, 5000], software: [50, 500],
    marketing: [200, 3000], rent_biz: [1000, 5000], utilities_biz: [200, 800], shipping: [50, 500],
  };
  const descriptions: Record<string, string[]> = {
    salary: ['Salário mensal', 'Adiantamento'], freelance: ['Projeto web', 'Consultoria'],
    investments: ['Dividendos', 'Rendimentos CDB'], bonus: ['Bônus trimestral', 'PLR'],
    cashback: ['Cashback cartão'], food: ['iFood', 'Rappi', 'Lanche'],
    groceries: ['Supermercado', 'Feira'], transport: ['Uber', '99', 'Metrô'],
    fuel: ['Posto Shell', 'Abastecimento'], entertainment: ['Cinema', 'Show'],
    streaming: ['Netflix', 'Disney+', 'Spotify'], health: ['Consulta médica', 'Exames'],
    pharmacy: ['Remédios', 'Vitaminas'], education: ['Curso Udemy', 'Mensalidade'],
    shopping: ['Amazon', 'Mercado Livre'], clothing: ['Zara', 'Renner'],
    home: ['Decoração', 'Móveis'], utilities: ['Conta de luz', 'Água'],
    internet: ['Vivo Fibra'], subscriptions: ['iCloud', 'Google One'],
    sales: ['Venda produto', 'Pedido'], services: ['Serviço prestado', 'Projeto entregue'],
    consulting: ['Projeto consultoria'], contracts: ['Contrato anual'],
    commissions: ['Comissão vendas'], client_advance: ['Adiantamento cliente'],
    salary_employees: ['Folha mensal'], prolabore: ['Pró-labore sócio'],
    inss_patronal: ['INSS funcionários'], fgts: ['FGTS mensal'],
    vale_transporte: ['VT funcionários'], vale_refeicao: ['VR funcionários'],
    health_plan: ['Unimed', 'Amil'], outsourced_services: ['Serviço limpeza'],
    freelancers_pj: ['Dev freelancer'], accounting: ['Honorários contador'],
    simples_das: ['DAS mensal'], irpj: ['IRPJ trimestral'], iss: ['ISS mensal'],
    bank_fees: ['Tarifa bancária'], card_fees: ['Taxa maquininha'],
    supplies: ['Material escritório'], equipment: ['Computador'],
    software: ['Adobe', 'Microsoft 365'], marketing: ['Google Ads', 'Facebook Ads'],
    rent_biz: ['Aluguel sala comercial'], utilities_biz: ['Energia', 'Internet'],
    shipping: ['Frete Correios'],
  };
  for (let i = 0; i < 60; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const numTransactions = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numTransactions; j++) {
      const isPersonal = Math.random() > 0.3;
      const acctType: AccountType = isPersonal ? 'personal' : 'business';
      const isIncome = Math.random() > 0.75;
      let categoryId: string;
      if (isPersonal) {
        categoryId = isIncome
          ? personalIncomeCategories[Math.floor(Math.random() * personalIncomeCategories.length)]
          : personalExpenseCategories[Math.floor(Math.random() * personalExpenseCategories.length)];
      } else {
        categoryId = isIncome
          ? businessIncomeCategories[Math.floor(Math.random() * businessIncomeCategories.length)]
          : businessExpenseCategories[Math.floor(Math.random() * businessExpenseCategories.length)];
      }
      const [min, max] = amounts[categoryId] || [50, 500];
      const amount = Math.floor(Math.random() * (max - min) + min);
      const descList = descriptions[categoryId] || ['Transação'];
      transactions.push({
        id: `${date.getTime()}-${j}`,
        description: descList[Math.floor(Math.random() * descList.length)],
        amount, type: isIncome ? 'income' : 'expense', categoryId, date, accountType: acctType,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      });
    }
  }
  return transactions;
};

const generateMockBills = (): Bill[] => {
  const now = new Date();
  return [
    { id: '1', description: 'Conta de Luz', amount: 280, dueDate: new Date(now.getFullYear(), now.getMonth(), 15), categoryId: 'utilities', status: 'pending', recurrence: 'monthly', accountType: 'personal' },
    { id: '2', description: 'Internet', amount: 150, dueDate: new Date(now.getFullYear(), now.getMonth(), 10), categoryId: 'internet', status: 'pending', recurrence: 'monthly', accountType: 'personal' },
    { id: '3', description: 'Aluguel', amount: 2500, dueDate: new Date(now.getFullYear(), now.getMonth(), 5), categoryId: 'rent', status: 'paid', recurrence: 'monthly', accountType: 'personal' },
    { id: '4', description: 'Academia', amount: 120, dueDate: new Date(now.getFullYear(), now.getMonth(), 8), categoryId: 'gym', status: 'pending', recurrence: 'monthly', accountType: 'personal' },
  ];
};

const generateMockReceivables = (): Receivable[] => {
  const now = new Date();
  return [
    { id: '1', description: 'Projeto Freelance', amount: 3500, expectedDate: new Date(now.getFullYear(), now.getMonth(), 20), categoryId: 'freelance', status: 'pending', payer: 'Cliente ABC', accountType: 'personal' },
    { id: '2', description: 'Comissão de Vendas', amount: 800, expectedDate: new Date(now.getFullYear(), now.getMonth(), 25), categoryId: 'commissions', status: 'pending', payer: 'Empresa XYZ', accountType: 'business' },
  ];
};

// Helper: API credit card -> frontend format
function apiCardToFrontend(c: any): CreditCard {
  return {
    id: c.id, name: c.name, lastDigits: c.last_digits, brand: c.brand as CreditCard['brand'],
    limit: Number(c.card_limit), usedLimit: Number(c.used_limit || 0),
    dueDay: c.due_day, closingDay: c.closing_day, color: c.color || '#10b981',
    accountType: (c.account_type || 'personal') as AccountType,
  };
}

// Helper: API bill -> frontend format
function apiBillToFrontend(b: any): Bill {
  return {
    id: b.id, description: b.description, amount: Number(b.amount),
    dueDate: new Date(b.due_date), categoryId: b.category_id,
    status: b.status as Bill['status'], recurrence: b.recurrence as Bill['recurrence'],
    accountType: (b.account_type || 'personal') as AccountType,
  };
}

// Helper: API receivable -> frontend format
function apiReceivableToFrontend(r: any): Receivable {
  return {
    id: r.id, description: r.description, amount: Number(r.amount),
    expectedDate: new Date(r.expected_date), categoryId: r.category_id,
    status: r.status as Receivable['status'], payer: r.payer || undefined,
    accountType: (r.account_type || 'personal') as AccountType,
  };
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { isDemoMode, user } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);

  // ====================== DATA LOADING ======================

  const loadTransactionsFromDB = useCallback(async () => {
    if (!user?.id || isDemoMode) return;
    try {
      const { data } = await transactionsApi.list();
      const items = Array.isArray(data) ? data : (data?.transactions || data?.data || []);
      setTransactions(items.map((t: any) => ({
        id: t.id, description: t.description || '', amount: Number(t.amount),
        date: new Date(t.date || t.created_at), type: t.type as TransactionType,
        categoryId: t.category_id || t.categoryId || 'other',
        accountType: (t.account_type || t.accountType || 'personal') as AccountType,
        paymentMethod: (t.payment_method || t.paymentMethod || 'pix') as PaymentMethod,
        cardId: t.card_id || t.cardId, installments: t.installments,
        currentInstallment: t.current_installment || t.currentInstallment,
        installmentGroupId: t.installment_group_id || t.installmentGroupId,
      })));
    } catch (err) { console.error('Erro ao carregar transacoes:', err); }
  }, [user?.id, isDemoMode]);

  const loadCreditCardsFromDB = useCallback(async () => {
    if (!user?.id || isDemoMode) return;
    try {
      const { data } = await creditCardsApi.list();
      setCreditCards((Array.isArray(data) ? data : []).map(apiCardToFrontend));
    } catch (err) { console.error('Erro ao carregar cartoes:', err); }
  }, [user?.id, isDemoMode]);

  const loadBillsFromDB = useCallback(async () => {
    if (!user?.id || isDemoMode) return;
    try {
      const { data } = await billsApi.list();
      setBills((Array.isArray(data) ? data : []).map(apiBillToFrontend));
    } catch (err) { console.error('Erro ao carregar contas:', err); }
  }, [user?.id, isDemoMode]);

  const loadReceivablesFromDB = useCallback(async () => {
    if (!user?.id || isDemoMode) return;
    try {
      const { data } = await receivablesApi.list();
      setReceivables((Array.isArray(data) ? data : []).map(apiReceivableToFrontend));
    } catch (err) { console.error('Erro ao carregar recebiveis:', err); }
  }, [user?.id, isDemoMode]);

  // Load demo data OR real data from API
  useEffect(() => {
    if (isDemoMode) {
      setTransactions(generateMockTransactions());
      setBills(generateMockBills());
      setReceivables(generateMockReceivables());
      setCreditCards([
        { id: 'demo-card-1', name: 'Nubank', lastDigits: '4532', brand: 'mastercard', limit: 5000, usedLimit: 1200, dueDay: 10, closingDay: 3, color: 'hsl(280, 100%, 50%)', accountType: 'personal' },
        { id: 'demo-card-2', name: 'Inter', lastDigits: '7890', brand: 'mastercard', limit: 8000, usedLimit: 3500, dueDay: 15, closingDay: 8, color: 'hsl(24, 95%, 53%)', accountType: 'personal' },
      ]);
    } else if (user?.id) {
      loadTransactionsFromDB();
      loadCreditCardsFromDB();
      loadBillsFromDB();
      loadReceivablesFromDB();
    } else {
      setTransactions([]); setBills([]); setReceivables([]); setCreditCards([]);
    }
  }, [isDemoMode, user?.id]);

  // Poll for updates every 30 seconds
  useEffect(() => {
    if (!user?.id || isDemoMode) return;
    const interval = setInterval(() => {
      loadTransactionsFromDB();
      loadCreditCardsFromDB();
      loadBillsFromDB();
      loadReceivablesFromDB();
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.id, isDemoMode, loadTransactionsFromDB, loadCreditCardsFromDB, loadBillsFromDB, loadReceivablesFromDB]);

  // ====================== TRANSACTIONS ======================

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (isDemoMode) {
      setTransactions(prev => [{ ...transaction, id: Date.now().toString() }, ...prev]);
      if (transaction.paymentMethod === 'credit_card' && transaction.cardId) {
        setCreditCards(prev => prev.map(card => card.id === transaction.cardId ? { ...card, usedLimit: card.usedLimit + transaction.amount } : card));
      }
      toast.success('Transacao adicionada!');
      return;
    }
    try {
      const { data } = await transactionsApi.create({
        description: transaction.description, amount: transaction.amount, type: transaction.type,
        category_id: transaction.categoryId,
        date: transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date as unknown as string,
        account_type: transaction.accountType, payment_method: transaction.paymentMethod,
        card_id: transaction.cardId, installments: transaction.installments,
        current_installment: transaction.currentInstallment, installment_group_id: transaction.installmentGroupId,
      });
      setTransactions(prev => [{ ...transaction, id: data.id || Date.now().toString() }, ...prev]);
      if (transaction.paymentMethod === 'credit_card' && transaction.cardId) {
        setCreditCards(prev => prev.map(card => card.id === transaction.cardId ? { ...card, usedLimit: card.usedLimit + transaction.amount } : card));
      }
      toast.success('Transacao adicionada!');
    } catch (err) { console.error('Error adding transaction:', err); toast.error('Erro ao adicionar transacao'); }
  };

  const updateTransaction = async (id: string, updates: Partial<Omit<Transaction, 'id'>>) => {
    if (isDemoMode) {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast.success('Transacao atualizada!');
      return;
    }
    try {
      const apiData: any = {};
      if (updates.description !== undefined) apiData.description = updates.description;
      if (updates.amount !== undefined) apiData.amount = updates.amount;
      if (updates.type !== undefined) apiData.type = updates.type;
      if (updates.categoryId !== undefined) apiData.category_id = updates.categoryId;
      if (updates.date !== undefined) apiData.date = updates.date instanceof Date ? updates.date.toISOString() : updates.date;
      if (updates.accountType !== undefined) apiData.account_type = updates.accountType;
      if (updates.paymentMethod !== undefined) apiData.payment_method = updates.paymentMethod;
      if (updates.cardId !== undefined) apiData.card_id = updates.cardId;
      await transactionsApi.update(id, apiData);
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast.success('Transacao atualizada!');
    } catch (err) { console.error('Error updating transaction:', err); toast.error('Erro ao atualizar transacao'); }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (!isDemoMode) { try { await transactionsApi.delete(id); } catch (err) { console.error(err); } }
    toast.success('Transacao removida!');
  };

  // ====================== CATEGORIES ======================

  const addCategory = (category: Omit<Category, 'id'>) => {
    const id = `custom-${Date.now()}`;
    setCategories(prev => [...prev, { ...category, id, isCustom: true }]);
    return id;
  };

  const deleteCategory = (id: string) => {
    if (categories.find(c => c.id === id)?.isCustom) setCategories(prev => prev.filter(c => c.id !== id));
  };

  const getCategoriesByType = (type: TransactionType, account: AccountType) =>
    categories.filter(c => c.type === type && (c.accountType === account || c.isCustom));

  // ====================== CREDIT CARDS ======================

  const addCreditCard = async (card: Omit<CreditCard, 'id'>) => {
    if (isDemoMode) { setCreditCards(prev => [...prev, { ...card, id: Date.now().toString() }]); toast.success('Cartao adicionado!'); return; }
    try {
      const { data } = await creditCardsApi.create({
        name: card.name, last_digits: card.lastDigits, brand: card.brand,
        card_limit: card.limit, due_day: card.dueDay, closing_day: card.closingDay,
        color: card.color, account_type: card.accountType,
      });
      setCreditCards(prev => [...prev, apiCardToFrontend(data)]);
      toast.success('Cartao adicionado!');
    } catch (err) { console.error('Error adding credit card:', err); toast.error('Erro ao adicionar cartao'); }
  };

  const updateCreditCard = async (id: string, updates: Partial<CreditCard>) => {
    if (isDemoMode) { setCreditCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c)); return; }
    try {
      const apiData: any = {};
      if (updates.name !== undefined) apiData.name = updates.name;
      if (updates.lastDigits !== undefined) apiData.last_digits = updates.lastDigits;
      if (updates.brand !== undefined) apiData.brand = updates.brand;
      if (updates.limit !== undefined) apiData.card_limit = updates.limit;
      if (updates.dueDay !== undefined) apiData.due_day = updates.dueDay;
      if (updates.closingDay !== undefined) apiData.closing_day = updates.closingDay;
      if (updates.color !== undefined) apiData.color = updates.color;
      await creditCardsApi.update(id, apiData);
      setCreditCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    } catch (err) { console.error('Error updating credit card:', err); toast.error('Erro ao atualizar cartao'); }
  };

  const deleteCreditCard = async (id: string) => {
    if (isDemoMode) { setCreditCards(prev => prev.filter(c => c.id !== id)); toast.success('Cartao removido!'); return; }
    try {
      await creditCardsApi.delete(id);
      setCreditCards(prev => prev.filter(c => c.id !== id));
      toast.success('Cartao removido!');
    } catch (err) { console.error('Error deleting credit card:', err); toast.error('Erro ao remover cartao'); }
  };

  const getCardInvoices = (cardId: string): CardInvoice[] => {
    const card = creditCards.find(c => c.id === cardId);
    if (!card) return [];
    const cardTransactions = transactions.filter(t => t.cardId === cardId && t.type === 'expense');
    const now = new Date();
    const invoices: CardInvoice[] = [];
    for (let i = 0; i < 3; i++) {
      const month = now.getMonth() - i;
      const year = now.getFullYear() + Math.floor(month / 12);
      const actualMonth = ((month % 12) + 12) % 12;
      const monthTxns = cardTransactions.filter(t => { const d = new Date(t.date); return d.getMonth() === actualMonth && d.getFullYear() === year; });
      invoices.push({
        id: `${cardId}-${actualMonth}-${year}`, cardId, month: actualMonth, year,
        total: monthTxns.reduce((s, t) => s + t.amount, 0),
        dueDate: new Date(year, actualMonth, card.dueDay),
        status: i === 0 ? 'open' : (i === 1 ? 'closed' : 'paid'),
        transactions: monthTxns.map(t => t.id),
      });
    }
    return invoices;
  };

  // ====================== BILLS ======================

  const addBill = async (bill: Omit<Bill, 'id'>) => {
    if (isDemoMode) { setBills(prev => [...prev, { ...bill, id: Date.now().toString() }]); toast.success('Conta adicionada!'); return; }
    try {
      const { data } = await billsApi.create({
        description: bill.description, amount: bill.amount,
        due_date: bill.dueDate instanceof Date ? bill.dueDate.toISOString() : String(bill.dueDate),
        category_id: bill.categoryId, recurrence: bill.recurrence, account_type: bill.accountType,
      });
      setBills(prev => [...prev, apiBillToFrontend(data)]);
      toast.success('Conta adicionada!');
    } catch (err) { console.error('Error adding bill:', err); toast.error('Erro ao adicionar conta'); }
  };

  const updateBill = async (id: string, updates: Partial<Bill>) => {
    if (isDemoMode) { setBills(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b)); return; }
    try {
      const apiData: any = {};
      if (updates.description !== undefined) apiData.description = updates.description;
      if (updates.amount !== undefined) apiData.amount = updates.amount;
      if (updates.dueDate !== undefined) apiData.due_date = updates.dueDate instanceof Date ? updates.dueDate.toISOString() : String(updates.dueDate);
      if (updates.categoryId !== undefined) apiData.category_id = updates.categoryId;
      if (updates.status !== undefined) apiData.status = updates.status;
      if (updates.recurrence !== undefined) apiData.recurrence = updates.recurrence;
      await billsApi.update(id, apiData);
      setBills(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    } catch (err) { console.error('Error updating bill:', err); toast.error('Erro ao atualizar conta'); }
  };

  const deleteBill = async (id: string) => {
    if (isDemoMode) { setBills(prev => prev.filter(b => b.id !== id)); toast.success('Conta removida!'); return; }
    try {
      await billsApi.delete(id);
      setBills(prev => prev.filter(b => b.id !== id));
      toast.success('Conta removida!');
    } catch (err) { console.error('Error deleting bill:', err); toast.error('Erro ao remover conta'); }
  };

  const markBillAsPaid = async (id: string) => {
    if (isDemoMode) {
      const bill = bills.find(b => b.id === id);
      if (bill) {
        setBills(prev => prev.map(b => b.id === id ? { ...b, status: 'paid' } : b));
        addTransaction({ description: bill.description, amount: bill.amount, type: 'expense', categoryId: bill.categoryId, date: new Date(), accountType: bill.accountType, paymentMethod: 'boleto' });
      }
      return;
    }
    try {
      const { data } = await billsApi.markAsPaid(id);
      setBills(prev => prev.map(b => b.id === id ? apiBillToFrontend(data) : b));
      loadTransactionsFromDB();
      toast.success('Conta marcada como paga!');
    } catch (err) { console.error('Error marking bill as paid:', err); toast.error('Erro ao marcar conta como paga'); }
  };

  // ====================== RECEIVABLES ======================

  const addReceivable = async (receivable: Omit<Receivable, 'id'>) => {
    if (isDemoMode) { setReceivables(prev => [...prev, { ...receivable, id: Date.now().toString() }]); toast.success('Recebivel adicionado!'); return; }
    try {
      const { data } = await receivablesApi.create({
        description: receivable.description, amount: receivable.amount,
        expected_date: receivable.expectedDate instanceof Date ? receivable.expectedDate.toISOString() : String(receivable.expectedDate),
        category_id: receivable.categoryId, payer: receivable.payer, account_type: receivable.accountType,
      });
      setReceivables(prev => [...prev, apiReceivableToFrontend(data)]);
      toast.success('Recebivel adicionado!');
    } catch (err) { console.error('Error adding receivable:', err); toast.error('Erro ao adicionar recebivel'); }
  };

  const updateReceivable = async (id: string, updates: Partial<Receivable>) => {
    if (isDemoMode) { setReceivables(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r)); return; }
    try {
      const apiData: any = {};
      if (updates.description !== undefined) apiData.description = updates.description;
      if (updates.amount !== undefined) apiData.amount = updates.amount;
      if (updates.expectedDate !== undefined) apiData.expected_date = updates.expectedDate instanceof Date ? updates.expectedDate.toISOString() : String(updates.expectedDate);
      if (updates.categoryId !== undefined) apiData.category_id = updates.categoryId;
      if (updates.payer !== undefined) apiData.payer = updates.payer;
      if (updates.status !== undefined) apiData.status = updates.status;
      await receivablesApi.update(id, apiData);
      setReceivables(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    } catch (err) { console.error('Error updating receivable:', err); toast.error('Erro ao atualizar recebivel'); }
  };

  const deleteReceivable = async (id: string) => {
    if (isDemoMode) { setReceivables(prev => prev.filter(r => r.id !== id)); toast.success('Recebivel removido!'); return; }
    try {
      await receivablesApi.delete(id);
      setReceivables(prev => prev.filter(r => r.id !== id));
      toast.success('Recebivel removido!');
    } catch (err) { console.error('Error deleting receivable:', err); toast.error('Erro ao remover recebivel'); }
  };

  const markAsReceived = async (id: string) => {
    if (isDemoMode) {
      const receivable = receivables.find(r => r.id === id);
      if (receivable) {
        setReceivables(prev => prev.map(r => r.id === id ? { ...r, status: 'received' } : r));
        addTransaction({ description: receivable.description, amount: receivable.amount, type: 'income', categoryId: receivable.categoryId, date: new Date(), accountType: receivable.accountType, paymentMethod: 'pix' });
      }
      return;
    }
    try {
      const { data } = await receivablesApi.markAsReceived(id);
      setReceivables(prev => prev.map(r => r.id === id ? apiReceivableToFrontend(data) : r));
      loadTransactionsFromDB();
      toast.success('Recebivel marcado como recebido!');
    } catch (err) { console.error('Error marking receivable:', err); toast.error('Erro ao marcar como recebido'); }
  };

  // ====================== FILTERS ======================

  const getFilteredTransactions = () => {
    const now = new Date();
    let startDate: Date;
    switch (periodFilter) {
      case 'week': startDate = new Date(now); startDate.setDate(startDate.getDate() - 7); break;
      case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
    }
    return transactions.filter(t => t.accountType === accountType && new Date(t.date) >= startDate);
  };

  const getTotalIncome = () => getFilteredTransactions().filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const getTotalExpense = () => getFilteredTransactions().filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const getBalance = () => getTotalIncome() - getTotalExpense();

  return (
    <FinanceContext.Provider value={{
      accountType, setAccountType, periodFilter, setPeriodFilter,
      transactions, addTransaction, updateTransaction, deleteTransaction,
      categories, addCategory, deleteCategory,
      getFilteredTransactions, getTotalIncome, getTotalExpense, getBalance, getCategoriesByType,
      creditCards, addCreditCard, updateCreditCard, deleteCreditCard, getCardInvoices,
      bills, addBill, updateBill, deleteBill, markBillAsPaid,
      receivables, addReceivable, updateReceivable, deleteReceivable, markAsReceived,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
}
