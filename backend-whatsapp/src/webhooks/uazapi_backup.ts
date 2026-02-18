import { Router, Request, Response } from "express";
import { UazAPIWebhookPayload } from "../types";
import { messageProcessor } from "../services/processor";
import { supabaseService } from "../services/supabase";
import { logger } from "../utils/logger";
import { uazapiService } from "../services/uazapi";
import * as fs from "fs";

const router = Router();

router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    // Salva payload completo para debug
    try {
      fs.appendFileSync("/tmp/webhook-debug.log", `[${new Date().toISOString()}] ${JSON.stringify(payload)}\n`);
    } catch (e) {}

    logger.info(`Webhook: EventType=${payload.EventType || "unknown"}`);
    res.status(200).json({ received: true });

    if (shouldProcess(payload)) {
      const normalizedPayload = normalizePayload(payload);
      const phone = normalizedPayload.data.key.remoteJid.replace("@s.whatsapp.net", "");
      const msgText = normalizedPayload.data.message?.conversation || "[media]";
      logger.info(`Processando: ${phone} -> ${msgText.substring(0, 50)}`);

      setImmediate(async () => {
        try {
          await messageProcessor.process(normalizedPayload);
        } catch (error) {
          logger.error("Erro no processamento async", error);
        }
      });
    }
  } catch (error) {
    logger.error("Erro no webhook", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Endpoint para vincular WhatsApp - chamado pelo app
router.post("/link", async (req: Request, res: Response) => {
  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ success: false, error: "Codigo e userId sao obrigatorios" });
    }

    const result = await supabaseService.linkWhatsAppAccount(code, userId);

    if (result.success) {
      logger.success(`WhatsApp vinculado: userId=${userId}, phone=${result.phone}`);

      // Enviar mensagem de boas-vindas apos vinculacao
      if (result.phone) {
        const welcomeMessage =
          "*Conta vinculada com sucesso!*\n\n" +
          "Agora voce pode registrar suas transacoes diretamente pelo WhatsApp.\n\n" +
          "*Como usar:*\n\n" +
          "*Texto:* Escreva naturalmente\n" +
          "   Ex: \"Gastei 50 no mercado\"\n" +
          "   Ex: \"Recebi 1500 de salario\"\n\n" +
          "*Audio:* Grave um audio descrevendo\n" +
          "   Ex: \"Paguei 89 reais de internet\"\n\n" +
          "*Foto:* Envie foto de cupons e recibos\n" +
          "   A IA extrai os dados automaticamente\n\n" +
          "*Comandos uteis:*\n" +
          "   /saldo - Ver resumo do mes\n" +
          "   /ajuda - Ver todos os comandos\n\n" +
          "Acesse o app para ver seus graficos e relatorios:\nhttps://app.pixzen.site";

        await uazapiService.sendText(result.phone, welcomeMessage);
        logger.info(`Mensagem de boas-vindas enviada para ${result.phone}`);
      }

      return res.json({ success: true, phone: result.phone });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    logger.error("Erro ao vincular WhatsApp:", error.message);
    return res.status(500).json({ success: false, error: "Erro interno" });
  }
});

function shouldProcess(payload: any): boolean {
  if (payload.EventType === "messages" && payload.message) {
    const msg = payload.message;
    if (msg.fromMe === true) return false;
    if (msg.isGroup === true) return false;
    return true;
  }
  if (payload.fromMe === true) return false;
  if (payload.isGroup === true) return false;
  return !!(payload.text || payload.messageType);
}

function normalizePayload(payload: any): UazAPIWebhookPayload {
  if (payload.EventType === "messages" && payload.message) {
    const msg = payload.message;

    let phone = msg.chatid?.replace("@s.whatsapp.net", "") ||
                msg.sender?.replace("@s.whatsapp.net", "").replace("@lid", "") || "";

    if (phone.includes("@") || phone.length > 15) {
      phone = payload.chat?.jid?.replace("@s.whatsapp.net", "") ||
              msg.owner?.replace("@s.whatsapp.net", "") ||
              phone.replace(/@.*/, "");
    }

    const isAudio = msg.messageType?.toLowerCase().includes("audio");
    const isImage = msg.messageType?.toLowerCase().includes("image");
    const isDocument = msg.messageType?.toLowerCase().includes("document");

    logger.info(`messageType detectado: ${msg.messageType}`);
    logger.debug(`Extraido: phone=${phone}, chatid=${msg.chatid}, sender=${msg.sender}`);

    return {
      event: "messages.upsert",
      instance: payload.instanceName || "pixzen",
      data: {
        key: {
          remoteJid: `${phone}@s.whatsapp.net`,
          fromMe: msg.fromMe || false,
          id: msg.messageid || msg.id || ""
        },
        pushName: msg.senderName || payload.chat?.lead_name || "",
        message: {
          conversation: (!isAudio && !isImage && !isDocument) ? (msg.text || msg.content?.text || "") : undefined,
          imageMessage: isImage ? {
            url: msg.content?.URL || msg.media?.url || "",
            mimetype: msg.media?.mimetype || "image/jpeg",
            caption: msg.caption || "",
            mediaKey: msg.content?.mediaKey || ""
          } : undefined,
          audioMessage: isAudio ? {
            url: msg.content?.URL || msg.media?.url || "",
            mimetype: msg.content?.mimetype || msg.media?.mimetype || "audio/ogg; codecs=opus",
            seconds: msg.media?.seconds || 0,
            ptt: true,
            mediaKey: msg.content?.mediaKey || ""
          } : undefined,
          documentMessage: isDocument ? {
            url: msg.content?.URL || msg.media?.url || "",
            mimetype: msg.content?.mimetype || msg.media?.mimetype || "application/pdf",
            title: msg.content?.filename || msg.media?.filename || "document.pdf",
            fileLength: msg.content?.fileLength || "0",
            mediaKey: msg.content?.mediaKey || ""
          } : undefined
        },
        messageTimestamp: msg.messageTimestamp || Date.now()
      }
    };
  }

  // Fallback para outros formatos de payload
  const phone = payload.chatid?.replace("@s.whatsapp.net", "") ||
                payload.sender?.replace("@s.whatsapp.net", "") || "";
  const isAudio = payload.messageType?.toLowerCase()?.includes("audio");
  const isImage = payload.messageType?.toLowerCase()?.includes("image");
  const isDocument = payload.messageType?.toLowerCase()?.includes("document");

  return {
    event: "messages.upsert",
    instance: "pixzen",
    data: {
      key: {
        remoteJid: `${phone}@s.whatsapp.net`,
        fromMe: payload.fromMe || false,
        id: payload.messageid || ""
      },
      pushName: payload.senderName || "",
      message: {
        conversation: (!isAudio && !isImage && !isDocument) ? (payload.text || "") : undefined,
        imageMessage: isImage ? { url: payload.media?.url || "", mimetype: "image/jpeg" } : undefined,
        audioMessage: isAudio ? { url: payload.media?.url || "", mimetype: "audio/ogg", ptt: true } : undefined,
        documentMessage: isDocument ? {
          url: payload.media?.url || "",
          mimetype: "application/pdf",
          title: "document.pdf",
          fileLength: "0"
        } : undefined
      },
      messageTimestamp: payload.messageTimestamp || Date.now()
    }
  };
}

export default router;
