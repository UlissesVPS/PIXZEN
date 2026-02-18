import { supabaseService } from "../services/supabase";
import { uazapiService } from "../services/uazapi";
import { logger } from "../utils/logger";
import { ERROR_MESSAGES } from "../prompts/finance";
import { handleTextMessage } from "./text";
import { downloadAndDecryptMedia } from "../utils/mediaDecrypt";
import axios from "axios";

// Import pdf-parse corretamente (CommonJS module)
import pdfParse from "pdf-parse";

export async function handleDocumentMessage(
  phone: string,
  docUrl: string,
  mimeType: string,
  mediaKey: string,
  fileName: string,
  userId: string
): Promise<void> {
  try {
    // Verifica se e PDF
    const isPdf = mimeType.includes("pdf") || fileName?.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      await uazapiService.sendText(phone, "Por enquanto, aceito apenas documentos PDF (comprovantes, extratos, etc).");
      return;
    }

    logger.info(`Processando documento PDF: ${fileName}`);
    await uazapiService.sendText(phone, "Analisando seu documento...");

    let docBuffer: Buffer | null = null;

    // Tenta baixar com descriptografia se tiver mediaKey
    if (mediaKey && docUrl.includes("mmg.whatsapp.net")) {
      logger.info("Usando descriptografia WhatsApp para documento");
      docBuffer = await downloadAndDecryptMedia(docUrl, mediaKey, "document");
    }

    // Fallback: download direto
    if (!docBuffer || docBuffer.length === 0) {
      logger.info("Tentando download direto do documento...");
      try {
        const response = await axios.get(docUrl, {
          responseType: "arraybuffer",
          timeout: 60000,
        });
        docBuffer = Buffer.from(response.data);
      } catch (err: any) {
        logger.error("Download direto falhou:", err.message);
      }
    }

    if (!docBuffer || docBuffer.length === 0) {
      await uazapiService.sendText(phone, "Nao consegui baixar o documento. Tente enviar como imagem.");
      return;
    }

    logger.info(`Documento baixado: ${docBuffer.length} bytes`);

    // Extrai texto do PDF
    let extractedText = "";
    try {
      const pdfData = await pdfParse(docBuffer);
      extractedText = pdfData.text;
      logger.info(`Texto extraido do PDF: ${extractedText.length} caracteres`);
    } catch (pdfError: any) {
      logger.error("Erro ao extrair texto do PDF:", pdfError.message);
      await uazapiService.sendText(phone, "Nao consegui ler o PDF. Tente enviar como imagem/foto do comprovante.");
      return;
    }

    if (!extractedText || extractedText.trim().length < 10) {
      // PDF pode ser escaneado/imagem
      await uazapiService.sendText(phone, "Este PDF parece ser uma imagem escaneada. Tente enviar o comprovante como foto.");
      return;
    }

    // Log do texto para debug
    logger.info(`Texto do PDF (primeiros 500 chars): ${extractedText.substring(0, 500)}`);

    // Processa o texto extraido como se fosse uma mensagem
    await supabaseService.incrementUsage(userId, "messages");
    await handleTextMessage(phone, `[PDF] ${extractedText}`, userId);

  } catch (error: any) {
    logger.error("Erro ao processar documento", error);
    await uazapiService.sendText(phone, ERROR_MESSAGES.GENERAL);
  }
}
