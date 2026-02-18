// Tipos do UazAPI v2
export interface UazAPIWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      imageMessage?: {
        url: string;
        mimetype: string;
        caption?: string;
        mediaKey?: string;
        fileEncSha256?: string;
        fileSha256?: string;
        fileLength?: string;
      };
      audioMessage?: {
        url: string;
        mimetype: string;
        seconds?: number;
        ptt?: boolean;
        mediaKey?: string;
        fileEncSha256?: string;
        fileSha256?: string;
        fileLength?: string;
      };
      documentMessage?: {
        url: string;
        mimetype: string;
        title: string;
        fileLength: string;
        mediaKey?: string;
      };
    };
    messageTimestamp: number;
    status?: string;
  };
}

// Tipos de transacao
export interface TransactionData {
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  confidence: number;
}

// Tipos de usuario WhatsApp
export interface WhatsAppUser {
  id: string;
  phone: string;
  user_id: string | null;
  name: string;
  is_linked: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos de uso
export interface UsageRecord {
  id: string;
  user_id: string;
  month: string;
  messages_count: number;
  audio_count: number;
  image_count: number;
  transactions_count: number;
  created_at: string;
  updated_at: string;
}

// Tipos de mensagem processada
export interface ProcessedMessage {
  type: "text" | "audio" | "image" | "document";
  content: string;
  mediaUrl?: string;
  mediaBuffer?: Buffer;
  mimeType?: string;
}

// Tipos de resposta
export interface BotResponse {
  success: boolean;
  message: string;
  transaction?: TransactionData;
  error?: string;
}

// Planos de assinatura
export interface SubscriptionLimits {
  starter: {
    messages_per_month: number;
    audio_enabled: boolean;
    image_enabled: boolean;
    whatsapp_enabled: boolean;
  };
  premium: {
    messages_per_month: number;
    audio_enabled: boolean;
    image_enabled: boolean;
    whatsapp_enabled: boolean;
  };
}

export const SUBSCRIPTION_LIMITS: SubscriptionLimits = {
  starter: {
    messages_per_month: 0,
    audio_enabled: false,
    image_enabled: false,
    whatsapp_enabled: false,
  },
  premium: {
    messages_per_month: -1,
    audio_enabled: true,
    image_enabled: true,
    whatsapp_enabled: true,
  },
};
