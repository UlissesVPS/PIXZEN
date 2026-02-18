import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { TransactionData, WhatsAppUser } from '../types';

const CATEGORY_MAP: Record<string, string> = {
  'alimentacao': 'food',
  'mercado': 'groceries',
  'transporte': 'transport',
  'combustivel': 'fuel',
  'saude': 'health',
  'educacao': 'education',
  'lazer': 'entertainment',
  'moradia': 'rent',
  'contas': 'utilities',
  'roupas': 'clothing',
  'beleza': 'beauty',
  'pets': 'pets',
  'viagem': 'travel',
  'assinaturas': 'subscriptions',
  'outros_despesa': 'other_expense',
  'salario': 'salary',
  'freelance': 'freelance',
  'investimentos': 'investments',
  'vendas': 'sales',
  'presente': 'gift_income',
  'reembolso': 'refund',
  'aluguel': 'rental',
  'outros_receita': 'other_income'
};

class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.database.url,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected pool error:', err.message);
    });
  }

  async getUserByPhone(phone: string): Promise<WhatsAppUser | null> {
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const result = await this.pool.query(
        'SELECT * FROM whatsapp_users WHERE phone = $1 LIMIT 1',
        [cleanPhone]
      );
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('Error getting user by phone:', error.message);
      return null;
    }
  }

  async createWhatsAppUser(phone: string, name: string): Promise<WhatsAppUser | null> {
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const id = uuidv4();
      const now = new Date().toISOString();
      const result = await this.pool.query(
        `INSERT INTO whatsapp_users (id, phone, name, user_id, is_linked, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [id, cleanPhone, name, null, false, now, now]
      );
      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('Error creating WhatsApp user:', error.message);
      return null;
    }
  }

  async generateLinkCode(whatsappUserId: string): Promise<string> {
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const id = uuidv4();
      await this.pool.query(
        `INSERT INTO whatsapp_link_codes (id, whatsapp_user_id, code, expires_at, used)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, whatsappUserId, code, expiresAt, false]
      );
      return code;
    } catch (error: any) {
      logger.error('Error generating link code:', error.message);
      return 'ERRO';
    }
  }

  async linkWhatsAppAccount(code: string, userId: string): Promise<{ success: boolean; error?: string; phone?: string }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const linkResult = await client.query(
        `SELECT lc.*, wu.phone FROM whatsapp_link_codes lc
         JOIN whatsapp_users wu ON wu.id = lc.whatsapp_user_id
         WHERE lc.code = $1 AND lc.used = false AND lc.expires_at > NOW()
         LIMIT 1`,
        [code.toUpperCase()]
      );

      if (linkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, error: 'Codigo invalido, expirado ou ja utilizado' };
      }

      const linkData = linkResult.rows[0];

      await client.query(
        `UPDATE whatsapp_users SET user_id = $1, is_linked = true, updated_at = NOW()
         WHERE id = $2`,
        [userId, linkData.whatsapp_user_id]
      );

      await client.query(
        `UPDATE whatsapp_link_codes SET used = true WHERE id = $1`,
        [linkData.id]
      );

      // Create/update assinante record for trial
      await client.query(
        `INSERT INTO assinantes (id, user_id, status, plano, criado_em, atualizado_em)
         VALUES ($1, $2, 'trial', 'trial', NOW(), NOW())
         ON CONFLICT (user_id) DO UPDATE SET atualizado_em = NOW()`,
        [uuidv4(), userId]
      );

      await client.query('COMMIT');

      const phone = linkData.phone || '';
      logger.success('WhatsApp account linked: ' + phone);
      return { success: true, phone };
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Error linking WhatsApp account:', error.message);
      return { success: false, error: 'Erro interno' };
    } finally {
      client.release();
    }
  }

  async getUserSubscription(userId: string): Promise<{ plano: string } | null> {
    try {
      const result = await this.pool.query(
        'SELECT plano FROM assinantes WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      return result.rows[0] || { plano: 'free' };
    } catch (error: any) {
      return { plano: 'free' };
    }
  }

  async checkUsageLimit(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const result = await this.pool.query(
        'SELECT messages_count, audio_count, image_count FROM whatsapp_usage WHERE user_id = $1 AND month = $2 LIMIT 1',
        [userId, currentMonth]
      );
      const usage = result.rows[0];
      const subscription = await this.getUserSubscription(userId);
      const plan = subscription?.plano || 'free';
      const limits: Record<string, number> = { 'free': 30, 'basic': 200, 'premium': -1, 'trial': 50 };
      const limit = limits[plan] || 30;
      const used = (usage?.messages_count || 0) + (usage?.audio_count || 0) + (usage?.image_count || 0);
      return { allowed: limit === -1 || used < limit, used, limit: limit === -1 ? 999999 : limit };
    } catch (error: any) {
      return { allowed: true, used: 0, limit: 30 };
    }
  }

  async incrementUsage(userId: string, type: 'messages' | 'audio' | 'images'): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const fieldMap: Record<string, string> = { 'messages': 'messages_count', 'audio': 'audio_count', 'images': 'image_count' };
      const field = fieldMap[type];

      const existing = await this.pool.query(
        'SELECT * FROM whatsapp_usage WHERE user_id = $1 AND month = $2 LIMIT 1',
        [userId, currentMonth]
      );

      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        await this.pool.query(
          `UPDATE whatsapp_usage SET ${field} = $1 WHERE id = $2`,
          [(row[field] || 0) + 1, row.id]
        );
      } else {
        await this.pool.query(
          `INSERT INTO whatsapp_usage (id, user_id, month, messages_count, audio_count, image_count, transactions_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [uuidv4(), userId, currentMonth,
           type === 'messages' ? 1 : 0,
           type === 'audio' ? 1 : 0,
           type === 'images' ? 1 : 0,
           0]
        );
      }
    } catch (error: any) {
      logger.error('Error incrementing usage:', error.message);
    }
  }

  async saveTransaction(userId: string, data: TransactionData, source: string, accountType: 'personal' | 'business' = 'personal'): Promise<boolean> {
    try {
      const categoryId = CATEGORY_MAP[data.category] || (data.type === 'income' ? 'other_income' : 'other_expense');
      const id = uuidv4();
      const now = new Date().toISOString();

      await this.pool.query(
        `INSERT INTO transactions (id, user_id, description, amount, type, category_id, date, account_type, source, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [id, userId, data.description, data.amount, data.type, categoryId,
         data.date || now, accountType, source, now, now]
      );

      logger.success('Transaction saved: ' + data.description);
      return true;
    } catch (error: any) {
      logger.error('Error saving transaction:', error.message);
      return false;
    }
  }

  async getMonthSummary(userId: string, accountType: 'personal' | 'business' = 'personal'): Promise<{
    income: number; expense: number; balance: number; transactionCount: number;
  }> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const result = await this.pool.query(
        `SELECT amount, type FROM transactions
         WHERE user_id = $1 AND account_type = $2 AND date >= $3`,
        [userId, accountType, startOfMonth.toISOString()]
      );

      const transactions = result.rows;
      if (!transactions || transactions.length === 0) {
        return { income: 0, expense: 0, balance: 0, transactionCount: 0 };
      }
      const income = transactions.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
      const expense = transactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
      return { income, expense, balance: income - expense, transactionCount: transactions.length };
    } catch (error: any) {
      return { income: 0, expense: 0, balance: 0, transactionCount: 0 };
    }
  }

  async getAIConfig(): Promise<Record<string, string>> {
    try {
      const result = await this.pool.query(
        'SELECT config_key, config_value FROM ai_config'
      );
      const cfg: Record<string, string> = {};
      if (result.rows) {
        result.rows.forEach((row: any) => {
          cfg[row.config_key] = row.config_value;
        });
      }
      return cfg;
    } catch (error: any) {
      logger.error('Error fetching AI config:', error.message);
      return {};
    }
  }

  async logAIUsage(data: {
    user_id?: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
    request_type: string;
  }): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO ai_usage_logs (id, user_id, model, input_tokens, output_tokens, cost_usd, request_type, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [uuidv4(), data.user_id || null, data.model, data.input_tokens, data.output_tokens,
         data.cost_usd, data.request_type, new Date().toISOString()]
      );
    } catch (error: any) {
      logger.error('Error logging AI usage:', error.message);
    }
  }

  async checkTrialStatus(userId: string): Promise<{ isExpired: boolean; isActive: boolean; daysRemaining: number }> {
    try {
      const TRIAL_DAYS = 7;

      const result = await this.pool.query(
        'SELECT status, criado_em FROM assinantes WHERE user_id = $1 LIMIT 1',
        [userId]
      );

      const assinante = result.rows[0];

      if (assinante?.status === 'ativo') {
        return { isExpired: false, isActive: true, daysRemaining: 0 };
      }

      let trialStartDate: Date | null = null;

      if (assinante?.criado_em) {
        trialStartDate = new Date(assinante.criado_em);
      } else {
        const wuResult = await this.pool.query(
          'SELECT created_at, updated_at FROM whatsapp_users WHERE user_id = $1 LIMIT 1',
          [userId]
        );
        const whatsappUser = wuResult.rows[0];
        if (whatsappUser) {
          trialStartDate = new Date(whatsappUser.updated_at || whatsappUser.created_at);
          await this.pool.query(
            `INSERT INTO assinantes (id, user_id, status, plano, criado_em, atualizado_em)
             VALUES ($1, $2, 'trial', 'trial', $3, NOW())
             ON CONFLICT (user_id) DO UPDATE SET atualizado_em = NOW()`,
            [uuidv4(), userId, trialStartDate.toISOString()]
          );
        }
      }

      if (!trialStartDate) {
        return { isExpired: true, isActive: false, daysRemaining: 0 };
      }

      const now = new Date();
      const diffDays = Math.floor((now.getTime() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, TRIAL_DAYS - diffDays);
      const isExpired = diffDays >= TRIAL_DAYS;

      return { isExpired, isActive: false, daysRemaining };
    } catch (error: any) {
      logger.error('Error checking trial status:', error.message);
      return { isExpired: true, isActive: false, daysRemaining: 0 };
    }
  }
}

// Export com mesmo nome para manter compatibilidade
export const supabaseService = new DatabaseService();

// Template service usando pg direto
class TemplateService {
  private pool: Pool;
  private cache: Map<string, { content: string; variables: string[]; expires: number }> = new Map();
  private CACHE_TTL = 5 * 60 * 1000;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getTemplate(key: string, variables?: Record<string, string>): Promise<string> {
    try {
      const cached = this.cache.get(key);
      if (cached && cached.expires > Date.now()) {
        return this.replaceVariables(cached.content, variables);
      }

      const result = await this.pool.query(
        'SELECT template_content, variables FROM message_templates WHERE template_key = $1 AND is_active = true LIMIT 1',
        [key]
      );

      if (result.rows.length === 0) {
        logger.warn('Template not found: ' + key);
        return '';
      }

      const data = result.rows[0];
      this.cache.set(key, {
        content: data.template_content,
        variables: data.variables || [],
        expires: Date.now() + this.CACHE_TTL
      });

      return this.replaceVariables(data.template_content, variables);
    } catch (error: any) {
      logger.error('Error fetching template:', error.message);
      return '';
    }
  }

  private replaceVariables(content: string, variables?: Record<string, string>): string {
    if (!variables) return content;
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

const templatePool = new Pool({
  connectionString: config.database.url,
  max: 3,
  idleTimeoutMillis: 30000,
});

export const templateService = new TemplateService(templatePool);
