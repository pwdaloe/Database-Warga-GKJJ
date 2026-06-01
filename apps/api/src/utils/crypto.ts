import { createCipheriv, createDecipheriv, createHmac } from 'crypto'

const ALGO    = 'aes-256-ecb'
const PREFIX  = 'enc:'

/** Derive 32-byte key dari ENCRYPTION_KEY env var */
function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) throw new Error('ENCRYPTION_KEY tidak dikonfigurasi di .env')
  return createHmac('sha256', 'gkjj-field-encryption-v1').update(raw).digest()
}

/**
 * Enkripsi satu field teks secara deterministik (input sama → output sama).
 * Aman untuk kolom yang punya UNIQUE constraint di database.
 * Mengembalikan null jika value null/undefined/kosong.
 */
export function encryptField(value: string | null | undefined): string | null {
  if (!value) return value ?? null
  if (value.startsWith(PREFIX)) return value           // sudah terenkripsi
  const key    = getKey()
  const cipher = createCipheriv(ALGO, key, null)       // ECB: tidak butuh IV
  const buf    = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return PREFIX + buf.toString('base64')
}

/**
 * Dekripsi field yang sudah dienkripsi dengan encryptField.
 * Data lama (plaintext tanpa prefix) dikembalikan apa adanya agar backward-compatible.
 */
export function decryptField(value: string | null | undefined): string | null {
  if (!value) return value ?? null
  if (!value.startsWith(PREFIX)) return value          // data lama / belum terenkripsi
  const key      = getKey()
  const decipher = createDecipheriv(ALGO, key, null)
  const buf      = Buffer.from(value.slice(PREFIX.length), 'base64')
  return Buffer.concat([decipher.update(buf), decipher.final()]).toString('utf8')
}
