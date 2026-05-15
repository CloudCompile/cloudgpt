import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-cbc';

function deriveKey(encryptionKey: string): Buffer {
  return createHash('sha256').update(encryptionKey).digest();
}

export function encryptKey(rawKey: string, encryptionKey: string): string {
  const key = deriveKey(encryptionKey);
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(rawKey, 'utf-8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptKey(encryptedStr: string, encryptionKey: string): string {
  const key = deriveKey(encryptionKey);
  const colonIdx = encryptedStr.indexOf(':');
  if (colonIdx === -1) throw new Error('Invalid encrypted key format');
  const ivHex = encryptedStr.slice(0, colonIdx);
  const encHex = encryptedStr.slice(colonIdx + 1);
  const iv = Buffer.from(ivHex, 'hex');
  const enc = Buffer.from(encHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf-8');
}
