import axios from 'axios';
import * as crypto from 'crypto';
import { logger } from './logger';

// WhatsApp media decryption implementation
const HKDF_INFO: Record<string, Buffer> = {
  'audio': Buffer.from('WhatsApp Audio Keys'),
  'image': Buffer.from('WhatsApp Image Keys'),
  'video': Buffer.from('WhatsApp Video Keys'),
  'document': Buffer.from('WhatsApp Document Keys'),
  'ptt': Buffer.from('WhatsApp Audio Keys'),
};

function hkdfExpand(key: Buffer, info: Buffer, length: number): Buffer {
  const hashLen = 32;
  const n = Math.ceil(length / hashLen);
  let okm = Buffer.alloc(0);
  let prev = Buffer.alloc(0);
  
  for (let i = 1; i <= n; i++) {
    const data = Buffer.concat([prev, info, Buffer.from([i])]);
    prev = crypto.createHmac('sha256', key).update(data).digest();
    okm = Buffer.concat([okm, prev]);
  }
  
  return okm.slice(0, length);
}

function hkdf(ikm: Buffer, salt: Buffer | null, info: Buffer, length: number): Buffer {
  const actualSalt = salt || Buffer.alloc(32, 0);
  const prk = crypto.createHmac('sha256', actualSalt).update(ikm).digest();
  return hkdfExpand(prk, info, length);
}

export async function downloadAndDecryptMedia(
  url: string,
  mediaKey: string,
  mediaType: 'audio' | 'image' | 'video' | 'document' | 'ptt'
): Promise<Buffer | null> {
  try {
    logger.info('Downloading encrypted media from WhatsApp CDN...');
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: {
        'User-Agent': 'WhatsApp/2.23.25.87 A'
      }
    });
    
    const encryptedData = Buffer.from(response.data);
    logger.info('Downloaded ' + encryptedData.length + ' bytes of encrypted data');
    
    const mediaKeyBuffer = Buffer.from(mediaKey, 'base64');
    const info = HKDF_INFO[mediaType] || HKDF_INFO['audio'];
    
    const expandedKey = hkdf(mediaKeyBuffer, null, info, 112);
    const iv = expandedKey.slice(0, 16);
    const cipherKey = expandedKey.slice(16, 48);
    
    const encryptedContent = encryptedData.slice(0, -10);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', cipherKey, iv);
    const decrypted = Buffer.concat([
      decipher.update(encryptedContent),
      decipher.final()
    ]);
    
    logger.info('Decrypted ' + decrypted.length + ' bytes of media');
    return decrypted;
    
  } catch (error: any) {
    logger.error('Failed to download/decrypt media:', error.message);
    return null;
  }
}
