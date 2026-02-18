import { openaiService } from '../services/openai';
import { supabaseService } from '../services/supabase';
import { uazapiService } from '../services/uazapi';
import { logger } from '../utils/logger';
import { ERROR_MESSAGES } from '../prompts/finance';
import { handleTextMessage } from './text';
import { downloadAndDecryptMedia } from '../utils/mediaDecrypt';
import axios from 'axios';

export async function handleAudioMessage(
  phone: string,
  audioUrl: string,
  mimeType: string,
  mediaKey: string,
  userId: string
): Promise<void> {
  try {
    logger.info(`Processando audio: ${mimeType}`);
    await uazapiService.sendText(phone, '🎤 Processando seu áudio...');

    let audioBuffer: Buffer | null = null;

    // Se temos mediaKey e URL do WhatsApp CDN, descriptografar
    if (mediaKey && audioUrl.includes('mmg.whatsapp.net')) {
      logger.info('Usando descriptografia WhatsApp com mediaKey');
      const mediaType = mimeType.includes('ptt') ? 'ptt' : 'audio';
      audioBuffer = await downloadAndDecryptMedia(audioUrl, mediaKey, mediaType);
    }

    // Fallback: tentar download direto
    if (!audioBuffer || audioBuffer.length === 0) {
      logger.info('Tentando download direto...');
      try {
        const response = await axios.get(audioUrl, {
          responseType: 'arraybuffer',
          timeout: 60000
        });
        audioBuffer = Buffer.from(response.data);
      } catch (err: any) {
        logger.error('Download direto falhou:', err.message);
      }
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      await uazapiService.sendText(phone, ERROR_MESSAGES.AUDIO_FAILED);
      return;
    }

    logger.info(`Audio baixado: ${audioBuffer.length} bytes`);

    const transcription = await openaiService.transcribeAudio(audioBuffer, mimeType);

    if (!transcription) {
      await uazapiService.sendText(
        phone,
        '❌ Não consegui entender o áudio. Tente falar mais claramente ou envie uma mensagem de texto.'
      );
      return;
    }

    // Log interno apenas - não mostrar ao cliente
    logger.info(`Transcricao: "${transcription}"`);

    await supabaseService.incrementUsage(userId, 'audio');
    
    // Processar a transcrição como texto financeiro diretamente
    await handleTextMessage(phone, transcription, userId);
  } catch (error: any) {
    logger.error('Erro ao processar audio', error);
    await uazapiService.sendText(phone, ERROR_MESSAGES.AUDIO_FAILED);
  }
}
