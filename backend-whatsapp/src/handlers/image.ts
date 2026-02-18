import { openaiService } from "../services/openai";
import { supabaseService } from "../services/supabase";
import { uazapiService } from "../services/uazapi";
import { logger } from "../utils/logger";
import { ERROR_MESSAGES } from "../prompts/finance";
import { downloadAndDecryptMedia } from "../utils/mediaDecrypt";
import axios from "axios";

export async function handleImageMessage(
  phone: string,
  imageUrl: string,
  caption: string | undefined,
  mediaKey: string,
  userId: string
): Promise<void> {
  try {
    logger.info(`Processando imagem com caption: "${caption || "sem legenda"}"`);
    await uazapiService.sendText(phone, "📸 Analisando sua imagem...");

    let imageBuffer: Buffer | null = null;

    // Tenta descriptografar se tiver mediaKey (imagem do WhatsApp)
    if (mediaKey && imageUrl.includes("mmg.whatsapp.net")) {
      logger.info("Usando descriptografia WhatsApp para imagem");
      imageBuffer = await downloadAndDecryptMedia(imageUrl, mediaKey, "image");
    }

    // Fallback: download direto
    if (!imageBuffer || imageBuffer.length === 0) {
      logger.info("Tentando download direto da imagem...");
      try {
        const response = await axios.get(imageUrl, {
          responseType: "arraybuffer",
          timeout: 60000,
        });
        imageBuffer = Buffer.from(response.data);
      } catch (err: any) {
        logger.error("Download direto falhou:", err.message);
      }
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      await uazapiService.sendText(phone, ERROR_MESSAGES.IMAGE_FAILED);
      return;
    }

    logger.info(`Imagem baixada: ${imageBuffer.length} bytes`);

    // Detecta formato da imagem pelo magic number
    const format = detectImageFormat(imageBuffer);
    logger.info(`Formato da imagem detectado: ${format}`);

    if (!format) {
      logger.error("Formato de imagem nao reconhecido");
      await uazapiService.sendText(phone, "❌ Formato de imagem não suportado. Envie como JPEG ou PNG.");
      return;
    }

    const transactionData = await openaiService.analyzeImage(imageBuffer, caption, format, userId);

    if (!transactionData) {
      await uazapiService.sendText(
        phone,
        "🤔 Não consegui identificar uma transação nessa imagem.\n\n" +
        "Para melhores resultados, envie:\n" +
        "• Cupons fiscais\n" +
        "• Comprovantes de pagamento\n" +
        "• Notas fiscais\n" +
        "• Extratos bancários\n\n" +
        "A imagem deve estar nítida e legível."
      );
      return;
    }

    const accountType = "personal"; // Empresarial em desenvolvimento

    const saved = await supabaseService.saveTransaction(
      userId,
      transactionData,
      "whatsapp_image",
      accountType
    );

    if (!saved) {
      await uazapiService.sendText(phone, ERROR_MESSAGES.SAVE_FAILED);
      return;
    }

    await supabaseService.incrementUsage(userId, "images");

    const emoji = transactionData.type === "income" ? "💰" : "💸";
    const typeText = transactionData.type === "income" ? "Receita" : "Despesa";
    const accountText = "Pessoal"; // Empresarial em desenvolvimento

    const confirmationMessage =
      `${emoji} *${typeText} registrada!*\n\n` +
      `💵 Valor: R$ ${transactionData.amount.toFixed(2)}\n` +
      `📁 Categoria: ${transactionData.category}\n` +
      `📝 Descricao: ${transactionData.description}\n` +
      `📅 Data: ${formatDate(transactionData.date)}\n` +
      `🏦 Conta: ${accountText}`;

    await uazapiService.sendText(phone, confirmationMessage);

  } catch (error: any) {
    logger.error("Erro ao processar imagem", error);
    await uazapiService.sendText(phone, ERROR_MESSAGES.IMAGE_FAILED);
  }
}

function detectImageFormat(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;
  
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return "image/jpeg";
  }
  
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return "image/png";
  }
  
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return "image/gif";
  }
  
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    if (buffer.length > 11 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return "image/webp";
    }
  }
  
  // Se nao reconheceu, tenta como JPEG (mais comum no WhatsApp)
  return "image/jpeg";
}

function detectAccountTypeFromImage(
  caption: string | undefined,
  description: string
): "personal" | "business" {
  const businessKeywords = [
    "empresa", "empresarial", "negócio", "negocio", "comercial",
    "loja", "cliente", "fornecedor", "nota fiscal", "nf",
    "cnpj", "pj", "mei", "atacado", "revenda"
  ];

  const textToCheck = `${caption || ""} ${description}`.toLowerCase();

  for (const keyword of businessKeywords) {
    if (textToCheck.includes(keyword)) {
      return "business";
    }
  }

  return "personal";
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR");
}
