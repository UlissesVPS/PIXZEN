import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import { logger } from '../utils/logger';

// Validacao de telefone brasileiro
function isValidBrazilianPhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, '');
  // Formato: 55 + DDD(2) + numero(8-9) = 12-13 digitos
  if (clean.length < 12 || clean.length > 13) return false;
  if (!clean.startsWith('55')) return false;
  const ddd = parseInt(clean.substring(2, 4));
  if (ddd < 11 || ddd > 99) return false;
  return true;
}

// Helper para delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class UazAPIService {
  private api: AxiosInstance;
  private maxRetries = 2;
  private retryDelay = 2000; // 2 segundos entre retries

  constructor() {
    this.api = axios.create({
      baseURL: config.uazapi.url,
      headers: {
        'Content-Type': 'application/json',
        'token': config.uazapi.token
      },
      timeout: 30000
    });
  }

  private formatPhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  validatePhone(phone: string): { valid: boolean; formatted: string; error?: string } {
    const formatted = this.formatPhone(phone);
    if (!formatted) {
      return { valid: false, formatted, error: 'Numero de telefone vazio' };
    }
    if (!isValidBrazilianPhone(formatted)) {
      return { valid: false, formatted, error: 'Numero de telefone brasileiro invalido. Formato esperado: 55XXXXXXXXXXX' };
    }
    return { valid: true, formatted };
  }

  async sendText(phone: string, message: string): Promise<boolean> {
    const formattedPhone = this.formatPhone(phone);

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          logger.info(`Retry ${attempt}/${this.maxRetries} para envio de mensagem para ${phone}`);
          await sleep(this.retryDelay * attempt);
        }

        await this.api.post('/send/text', {
          number: formattedPhone,
          text: message
        });

        logger.whatsapp(phone, 'out', message.substring(0, 80) + (message.length > 80 ? '...' : ''));
        return true;
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
        const statusCode = error.response?.status;

        // Nao fazer retry para erros que nao vao mudar
        if (statusCode === 400 || statusCode === 422) {
          logger.error(`Erro permanente ao enviar para ${phone}: ${errorMsg}`);
          return false;
        }

        // Se WhatsApp desconectado, nao adianta retry
        if (errorMsg.includes('disconnected') || errorMsg.includes('logged out')) {
          logger.error(`WhatsApp desconectado. Mensagem nao enviada para ${phone}`);
          return false;
        }

        if (attempt === this.maxRetries) {
          logger.error(`Falha ao enviar mensagem para ${phone} apos ${this.maxRetries + 1} tentativas: ${errorMsg}`);
          return false;
        }

        logger.warn(`Tentativa ${attempt + 1} falhou para ${phone}: ${errorMsg}. Tentando novamente...`);
      }
    }

    return false;
  }

  async sendImage(phone: string, imageUrl: string, caption?: string): Promise<boolean> {
    const formattedPhone = this.formatPhone(phone);

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await sleep(this.retryDelay * attempt);
        }

        await this.api.post('/send/image', {
          number: formattedPhone,
          image: imageUrl,
          caption: caption || ''
        });

        logger.whatsapp(phone, 'out', `[IMAGE] ${caption || 'No caption'}`);
        return true;
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message;
        const statusCode = error.response?.status;

        if (statusCode === 400 || statusCode === 422 || (errorMsg && errorMsg.includes('disconnected'))) {
          logger.error(`Erro ao enviar imagem para ${phone}: ${errorMsg}`);
          return false;
        }

        if (attempt === this.maxRetries) {
          logger.error(`Falha ao enviar imagem para ${phone} apos ${this.maxRetries + 1} tentativas: ${errorMsg}`);
          return false;
        }
      }
    }

    return false;
  }

  async downloadMedia(mediaUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        timeout: 60000
      });
      return Buffer.from(response.data);
    } catch (error: any) {
      logger.error('Failed to download media:', error.message);
      throw error;
    }
  }

  async getInstanceStatus(): Promise<any> {
    try {
      const response = await this.api.get('/instance/status');
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get instance status:', error.message);
      return null;
    }
  }
}

export const uazapiService = new UazAPIService();
