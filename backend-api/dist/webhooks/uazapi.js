"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const processor_1 = require("../services/processor");
const database_1 = require("../services/database");
const logger_1 = require("../utils/logger");
const uazapi_1 = require("../services/uazapi");
const fs = __importStar(require("fs"));
const router = (0, express_1.Router)();
// Webhook security: validate source
const ALLOWED_WEBHOOK_IPS = process.env.WEBHOOK_ALLOWED_IPS ? process.env.WEBHOOK_ALLOWED_IPS.split(',') : [];
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
router.post("/webhook", async (req, res) => {
    try {
        // IP whitelist check (if configured)
        if (ALLOWED_WEBHOOK_IPS.length > 0) {
            const clientIP = req.ip || req.connection?.remoteAddress || '';
            const realIP = req.get('x-real-ip') || req.get('x-forwarded-for')?.split(',')[0]?.trim() || clientIP;
            if (!ALLOWED_WEBHOOK_IPS.some(ip => realIP.includes(ip))) {
                logger_1.logger.warn("Webhook blocked from IP: " + realIP);
                return res.status(403).json({ error: "IP nao autorizado" });
            }
        }
        // Secret token check (if configured)
        if (WEBHOOK_SECRET && req.get('x-webhook-secret') !== WEBHOOK_SECRET) {
            const authHeader = req.get('authorization');
            if (!authHeader || authHeader !== 'Bearer ' + WEBHOOK_SECRET) {
                logger_1.logger.warn("Webhook blocked: invalid secret");
                return res.status(401).json({ error: "Token invalido" });
            }
        }
        const payload = req.body;
        try {
            fs.appendFileSync("/tmp/webhook-debug.log", "[" + new Date().toISOString() + "] " + JSON.stringify(payload) + "\n");
        }
        catch (e) { }
        logger_1.logger.info("Webhook: EventType=" + (payload.EventType || "unknown"));
        res.status(200).json({ received: true });
        if (shouldProcess(payload)) {
            const normalizedPayload = normalizePayload(payload);
            const phone = normalizedPayload.data.key.remoteJid.replace("@s.whatsapp.net", "");
            const msgText = normalizedPayload.data.message?.conversation || "[media]";
            logger_1.logger.info("Processando: " + phone + " -> " + msgText.substring(0, 50));
            setImmediate(async () => {
                try {
                    await processor_1.messageProcessor.process(normalizedPayload);
                }
                catch (error) {
                    logger_1.logger.error("Erro no processamento async", error);
                }
            });
        }
    }
    catch (error) {
        logger_1.logger.error("Erro no webhook", error);
        res.status(500).json({ error: "Erro interno" });
    }
});
router.post("/link", async (req, res) => {
    try {
        const { code, userId } = req.body;
        if (!code || !userId) {
            return res.status(400).json({ success: false, error: "Codigo e userId sao obrigatorios" });
        }
        const result = await database_1.supabaseService.linkWhatsAppAccount(code, userId);
        if (result.success) {
            logger_1.logger.success("WhatsApp vinculado: userId=" + userId + ", phone=" + result.phone);
            if (result.phone) {
                // Try to get template from database, fallback to hardcoded
                let welcomeMessage = await database_1.templateService.getTemplate("welcome_link");
                if (!welcomeMessage) {
                    welcomeMessage =
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
                }
                await uazapi_1.uazapiService.sendText(result.phone, welcomeMessage);
                logger_1.logger.info("Mensagem de boas-vindas enviada para " + result.phone);
            }
            return res.json({ success: true, phone: result.phone });
        }
        else {
            return res.status(400).json({ success: false, error: result.error });
        }
    }
    catch (error) {
        logger_1.logger.error("Erro ao vincular WhatsApp:", error.message);
        return res.status(500).json({ success: false, error: "Erro interno" });
    }
});
function shouldProcess(payload) {
    if (payload.EventType === "messages" && payload.message) {
        const msg = payload.message;
        if (msg.fromMe === true)
            return false;
        if (msg.isGroup === true)
            return false;
        return true;
    }
    if (payload.fromMe === true)
        return false;
    if (payload.isGroup === true)
        return false;
    return !!(payload.text || payload.messageType);
}
function normalizePayload(payload) {
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
        logger_1.logger.info("messageType detectado: " + msg.messageType);
        logger_1.logger.debug("Extraido: phone=" + phone + ", chatid=" + msg.chatid + ", sender=" + msg.sender);
        return {
            event: "messages.upsert",
            instance: payload.instanceName || "pixzen",
            data: {
                key: {
                    remoteJid: phone + "@s.whatsapp.net",
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
                remoteJid: phone + "@s.whatsapp.net",
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
exports.default = router;
//# sourceMappingURL=uazapi.js.map