import { UazAPIWebhookPayload, WhatsAppUser } from "../types";
import { supabaseService, templateService } from "./supabase";
import { uazapiService } from "./uazapi";
import { handleTextMessage, handleAudioMessage, handleImageMessage } from "../handlers";
import { handleDocumentMessage } from "../handlers/document";
import { logger } from "../utils/logger";
import { WELCOME_MESSAGE } from "../prompts/finance";
import { SUBSCRIPTION_LIMITS } from "../types";

const TRIAL_DAYS = 7;

export class MessageProcessor {
  async process(payload: UazAPIWebhookPayload): Promise<void> {
    try {
      if (payload.event !== "messages.upsert") {
        logger.debug(`Evento ignorado: ${payload.event}`);
        return;
      }

      const { data } = payload;

      if (data.key.fromMe) {
        return;
      }

      const phone = this.extractPhone(data.key.remoteJid);
      const pushName = data.pushName || "Usuario";

      logger.whatsapp(phone, "in", this.getMessageType(data.message));

      let user = await supabaseService.getUserByPhone(phone);

      if (!user) {
        user = await this.handleNewUser(phone, pushName);
        if (!user) return;
      }

      if (!user.is_linked || !user.user_id) {
        await this.handleUnlinkedUser(phone, user);
        return;
      }

      // Check trial/subscription status
      const trialStatus = await supabaseService.checkTrialStatus(user.user_id);

      if (trialStatus.isExpired && !trialStatus.isActive) {
        // Trial expired and no active subscription
        const expiredMessage = await templateService.getTemplate("trial_expired") ||
          "*Seu período de teste expirou!*\n\n" +
          "Para continuar usando o PixZen e manter todo seu histórico financeiro, escolha um de nossos planos:\n\n" +
          "🚀 *Planos disponíveis:*\n" +
          "• Starter: R$ 9,90/mês\n" +
          "• Premium: R$ 19,90/mês\n\n" +
          "👉 Acesse: https://app.pixzen.site/#pricing\n\n" +
          "_Seus dados estão salvos e serão mantidos ao assinar!_";

        await uazapiService.sendText(phone, expiredMessage);
        return;
      }

      // During trial, allow all features
      const subscription = await supabaseService.getUserSubscription(user.user_id);
      const isInTrial = trialStatus.daysRemaining > 0 && !trialStatus.isActive;
      const plan = trialStatus.isActive ? (subscription?.plano || "premium") : (isInTrial ? "premium" : "starter");
      const limits = SUBSCRIPTION_LIMITS[plan as keyof typeof SUBSCRIPTION_LIMITS] || SUBSCRIPTION_LIMITS.starter;

      // If in trial, enable all features
      const effectiveLimits = isInTrial ? {
        ...limits,
        audio_enabled: true,
        image_enabled: true,
        monthly_messages: 999
      } : limits;

      const usageCheck = await supabaseService.checkUsageLimit(user.user_id);

      if (!usageCheck.allowed && !isInTrial) {
        let limitMessage = await templateService.getTemplate("error_limit_reached", {
          used: String(usageCheck.used),
          limit: String(usageCheck.limit)
        });
        if (!limitMessage) {
          limitMessage = `⚠️ *Limite mensal atingido!*\n\nVocê usou ${usageCheck.used} de ${usageCheck.limit} mensagens este mês.\n\n🚀 Faça upgrade do seu plano em:\nhttps://app.pixzen.site/settings`;
        }
        await uazapiService.sendText(phone, limitMessage);
        return;
      }

      await this.routeMessage(phone, data.message, user, effectiveLimits, isInTrial);

    } catch (error) {
      logger.error("Erro ao processar mensagem", error);
    }
  }

  private async handleNewUser(phone: string, name: string): Promise<WhatsAppUser | null> {
    const user = await supabaseService.createWhatsAppUser(phone, name);

    if (!user) {
      logger.error(`Falha ao criar usuario WhatsApp: ${phone}`);
      return null;
    }

    await uazapiService.sendText(phone, WELCOME_MESSAGE);
    return user;
  }

  private async handleUnlinkedUser(phone: string, user: WhatsAppUser): Promise<void> {
    const linkCode = await supabaseService.generateLinkCode(user.id);

    let linkMessage = await templateService.getTemplate("link_code", { code: linkCode });
    if (!linkMessage) {
      linkMessage = `🔗 *Vincule sua conta PixZen!*\n\nPara usar o assistente financeiro, vincule seu WhatsApp à sua conta PixZen.\n\n1️⃣ Acesse: https://app.pixzen.site/whatsapp\n2️⃣ Use o código: *${linkCode}*\n\nO código expira em 10 minutos.`;
    }

    await uazapiService.sendText(phone, linkMessage);
  }

  private async routeMessage(
    phone: string,
    message: UazAPIWebhookPayload["data"]["message"],
    user: WhatsAppUser,
    limits: typeof SUBSCRIPTION_LIMITS.starter,
    isInTrial: boolean = false
  ): Promise<void> {
    if (!message || !user.user_id) return;

    // Texto
    if (message.conversation || message.extendedTextMessage) {
      const text = message.conversation || message.extendedTextMessage?.text || "";
      await handleTextMessage(phone, text, user.user_id);
      return;
    }

    // Audio
    if (message.audioMessage) {
      if (!limits.audio_enabled && !isInTrial) {
        await uazapiService.sendText(
          phone,
          "🔒 *Recurso Premium*\n\nO processamento de áudio está disponível apenas no plano Premium.\n\n🚀 Faça upgrade em: https://app.pixzen.site/settings"
        );
        return;
      }
      await handleAudioMessage(
        phone,
        message.audioMessage.url,
        message.audioMessage.mimetype,
        message.audioMessage.mediaKey || "",
        user.user_id
      );
      return;
    }

    // Imagem
    if (message.imageMessage) {
      if (!limits.image_enabled && !isInTrial) {
        await uazapiService.sendText(
          phone,
          "🔒 *Recurso Premium*\n\nO processamento de imagens está disponível apenas no plano Premium.\n\n🚀 Faça upgrade em: https://app.pixzen.site/settings"
        );
        return;
      }
      await handleImageMessage(
        phone,
        message.imageMessage.url,
        message.imageMessage.caption,
        message.imageMessage.mediaKey || "",
        user.user_id
      );
      return;
    }

    // Documento (PDF)
    if (message.documentMessage) {
      if (!limits.image_enabled && !isInTrial) {
        await uazapiService.sendText(
          phone,
          "🔒 *Recurso Premium*\n\nO processamento de documentos PDF está disponível apenas no plano Premium.\n\n🚀 Faça upgrade em: https://app.pixzen.site/settings"
        );
        return;
      }
      await handleDocumentMessage(
        phone,
        message.documentMessage.url,
        message.documentMessage.mimetype,
        message.documentMessage.mediaKey || "",
        message.documentMessage.title,
        user.user_id
      );
      return;
    }

    // Tipo nao suportado
    await uazapiService.sendText(
      phone,
      "📝 Por enquanto, aceito apenas:\n• Mensagens de texto\n• Áudios\n• Imagens de comprovantes\n• Documentos PDF\n\nDigite /ajuda para ver os comandos disponíveis."
    );
  }

  private extractPhone(remoteJid: string): string {
    return remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
  }

  private getMessageType(message: any): string {
    if (!message) return "unknown";
    if (message.conversation || message.extendedTextMessage) return "text";
    if (message.audioMessage) return "audio";
    if (message.imageMessage) return "image";
    if (message.documentMessage) return "document";
    return "other";
  }
}

export const messageProcessor = new MessageProcessor();
