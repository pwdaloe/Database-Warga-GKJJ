import { randomInt } from 'node:crypto'

// Tanpa karakter yang mudah tertukar (0/O, 1/l/I) karena password dibaca dari pesan WhatsApp.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

export function generatePassword(length = 10): string {
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)]
  return out
}
