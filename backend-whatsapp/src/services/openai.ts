import OpenAI from 'openai';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { TransactionData } from '../types';
import { FINANCE_EXTRACTION_PROMPT, IMAGE_ANALYSIS_PROMPT } from '../prompts/finance';
import { supabaseService } from './supabase';

// Cache de configuracao com TTL de 5 minutos
interface AIConfigCache {
  data: Record<string, string>;
  timestamp: number;
}

let configCache: AIConfigCache | null = null;
const CACHE_TTL = 5 * 60 * 1000;

function getBrazilDate(): string {
  const now = new Date();
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  return brazilTime.toISOString();
}

function getBrazilDateFormatted(): string {
  const now = new Date();
  return now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + ' ' +
         now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

// Mapeia mimeType do WhatsApp para extensao aceita pelo Whisper
function getAudioExtension(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'audio/ogg': 'ogg',
    'audio/ogg; codecs=opus': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/mp4': 'mp4',
    'audio/m4a': 'm4a',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'audio/x-wav': 'wav',
    'audio/flac': 'flac',
    'audio/x-m4a': 'm4a',
  };

  // Procura correspondencia parcial (ex: "audio/ogg; codecs=opus" bate com "audio/ogg")
  for (const [mime, ext] of Object.entries(mimeMap)) {
    if (mimeType.includes(mime.split(';')[0])) {
      return ext;
    }
  }

  // WhatsApp PTT (push-to-talk) geralmente e OGG
  if (mimeType.includes('ptt') || mimeType.includes('opus')) {
    return 'ogg';
  }

  // Default: ogg (formato mais comum do WhatsApp)
  return 'ogg';
}

// Mapeia mimeType de imagem para formato aceito pela OpenAI Vision
function getImageMimeType(detectedFormat: string): string {
  const supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (supportedFormats.includes(detectedFormat)) {
    return detectedFormat;
  }
  // Fallback para jpeg (mais comum no WhatsApp)
  return 'image/jpeg';
}

class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey
    });
  }

  private async getAIConfig(): Promise<Record<string, string>> {
    if (configCache && (Date.now() - configCache.timestamp) < CACHE_TTL) {
      return configCache.data;
    }

    try {
      const aiConfig = await supabaseService.getAIConfig();
      configCache = {
        data: aiConfig,
        timestamp: Date.now()
      };
      logger.debug('AI config loaded from database');
      return aiConfig;
    } catch (error) {
      logger.error('Failed to load AI config, using defaults');
      return {
        text_model: 'gpt-4o-mini',
        image_model: 'gpt-4o',
        audio_model: 'whisper-1',
        text_temperature: '0.1',
        text_max_tokens: '300',
        image_max_tokens: '500',
        finance_prompt: FINANCE_EXTRACTION_PROMPT
      };
    }
  }

  private async logUsage(model: string, inputTokens: number, outputTokens: number, requestType: string, userId?: string): Promise<void> {
    try {
      const pricing: Record<string, { input: number; output: number }> = {
        'gpt-4o-mini': { input: 0.15 / 1000000, output: 0.60 / 1000000 },
        'gpt-4o': { input: 2.50 / 1000000, output: 10.00 / 1000000 },
        'gpt-4-turbo': { input: 10.00 / 1000000, output: 30.00 / 1000000 },
        'gpt-3.5-turbo': { input: 0.50 / 1000000, output: 1.50 / 1000000 },
        'whisper-1': { input: 0.006 / 60, output: 0 }
      };

      const modelPricing = pricing[model] || { input: 0, output: 0 };
      const costUsd = (inputTokens * modelPricing.input) + (outputTokens * modelPricing.output);

      await supabaseService.logAIUsage({
        user_id: userId,
        model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: costUsd,
        request_type: requestType
      });
    } catch (error) {
      logger.error('Failed to log AI usage:', error);
    }
  }

  async analyzeText(text: string, userId?: string): Promise<TransactionData | null> {
    try {
      logger.debug('Analyzing text: ' + text);

      const aiConfig = await this.getAIConfig();
      const model = aiConfig.text_model || 'gpt-4o-mini';
      const temperature = parseFloat(aiConfig.text_temperature || '0.1');
      const maxTokens = parseInt(aiConfig.text_max_tokens || '300');
      const basePrompt = aiConfig.finance_prompt || FINANCE_EXTRACTION_PROMPT;

      const currentDate = getBrazilDateFormatted();
      const promptWithDate = basePrompt + '\n\nDATA E HORA ATUAL (Brasil): ' + currentDate + '\nUse esta data se o usuario nao especificar outra.';

      const response = await this.client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: promptWithDate },
          { role: 'user', content: text }
        ],
        response_format: { type: 'json_object' },
        temperature: temperature,
        max_tokens: maxTokens
      });

      const usage = response.usage;
      if (usage) {
        await this.logUsage(model, usage.prompt_tokens, usage.completion_tokens, 'text', userId);
      }

      const content = response.choices[0].message.content;
      if (!content) return null;

      const result = JSON.parse(content);

      if (!result.amount || result.amount <= 0) {
        return null;
      }

      let transactionDate = result.date;
      if (!transactionDate || transactionDate === '' || transactionDate === 'null') {
        transactionDate = getBrazilDate();
      }

      return {
        type: result.type || 'expense',
        amount: result.amount,
        description: result.description || text.substring(0, 100),
        category: result.category || 'outros_despesa',
        date: transactionDate,
        confidence: result.confidence || 0.8
      };
    } catch (error: any) {
      logger.error('Error analyzing text:', error.message);
      return null;
    }
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string, userId?: string): Promise<string | null> {
    try {
      logger.debug('Transcribing audio: ' + mimeType);

      const aiConfig = await this.getAIConfig();
      const model = aiConfig.audio_model || 'whisper-1';

      // Determina extensao correta baseado no mimeType
      const ext = getAudioExtension(mimeType);
      const fileName = `audio.${ext}`;

      // Determina o mimeType correto para o File
      const cleanMimeType = mimeType.includes('ptt')
        ? 'audio/ogg'
        : mimeType.split(';')[0].trim();

      logger.info(`Audio: mimeType=${mimeType}, ext=${ext}, cleanMime=${cleanMimeType}`);

      const file = new File([audioBuffer], fileName, { type: cleanMimeType });

      const response = await this.client.audio.transcriptions.create({
        file: file,
        model: model,
        language: 'pt',
        prompt: 'Transcricao de mensagem sobre financas pessoais em portugues brasileiro. Pode conter valores em reais, nomes de estabelecimentos, categorias como alimentacao, transporte, mercado, salario, etc.'
      });

      const estimatedSeconds = audioBuffer.length / 16000;
      await this.logUsage(model, Math.round(estimatedSeconds), 0, 'audio', userId);

      return response.text || null;
    } catch (error: any) {
      logger.error('Error transcribing audio:', error.message);
      return null;
    }
  }

  async analyzeImage(imageBuffer: Buffer, caption?: string, mimeType?: string, userId?: string): Promise<TransactionData | null> {
    try {
      logger.debug('Analyzing image with Vision');

      const aiConfig = await this.getAIConfig();
      const model = aiConfig.image_model || 'gpt-4o';
      const maxTokens = parseInt(aiConfig.image_max_tokens || '500');

      const base64Image = imageBuffer.toString('base64');
      // Garante que o mimeType e suportado pela OpenAI Vision
      const imageType = getImageMimeType(mimeType || 'image/jpeg');

      const currentDate = getBrazilDateFormatted();
      const userMessage = (caption
        ? IMAGE_ANALYSIS_PROMPT + '\n\nLegenda do usuario: ' + caption
        : IMAGE_ANALYSIS_PROMPT) + '\n\nDATA E HORA ATUAL (Brasil): ' + currentDate;

      const response = await this.client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: userMessage },
              { type: 'image_url', image_url: { url: `data:${imageType};base64,${base64Image}` } }
            ]
          }
        ],
        max_tokens: maxTokens
      });

      const usage = response.usage;
      if (usage) {
        await this.logUsage(model, usage.prompt_tokens, usage.completion_tokens, 'image', userId);
      }

      const content = response.choices[0].message.content;
      if (!content) return null;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const result = JSON.parse(jsonMatch[0]);

      if (!result.amount || result.amount <= 0) {
        return null;
      }

      let transactionDate = result.date;
      if (!transactionDate || transactionDate === '' || transactionDate === 'null') {
        transactionDate = getBrazilDate();
      }

      return {
        type: result.type || 'expense',
        amount: result.amount,
        description: result.description || 'Transacao via imagem',
        category: result.category || 'outros_despesa',
        date: transactionDate,
        confidence: result.confidence || 0.7
      };
    } catch (error: any) {
      logger.error('Error analyzing image:', error.message);
      return null;
    }
  }
}

export const openaiService = new OpenAIService();
