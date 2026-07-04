import { describe, it, expect, beforeAll } from 'vitest'
import { encryptField, decryptField } from '../../src/utils/crypto.js'

beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'test-encryption-key-untuk-vitest-32-karakter-min'
})

describe('encryptField / decryptField', () => {
  it('roundtrip: hasil enkripsi bisa didekripsi kembali ke nilai asli', () => {
    const original = '3171234567890001'
    const encrypted = encryptField(original)
    expect(encrypted).not.toBe(original)
    expect(decryptField(encrypted)).toBe(original)
  })

  it('deterministik: input sama menghasilkan output sama (aman untuk kolom UNIQUE)', () => {
    const a = encryptField('nilai-sama')
    const b = encryptField('nilai-sama')
    expect(a).toBe(b)
  })

  it('mengembalikan null untuk input null/undefined, dan string kosong apa adanya', () => {
    expect(encryptField(null)).toBeNull()
    expect(encryptField(undefined)).toBeNull()
    expect(encryptField('')).toBe('')
    expect(decryptField(null)).toBeNull()
    expect(decryptField(undefined)).toBeNull()
  })

  it('tidak mengenkripsi ulang nilai yang sudah terenkripsi (prefix enc:)', () => {
    const encrypted = encryptField('data-asli')
    expect(encryptField(encrypted!)).toBe(encrypted)
  })

  it('backward-compatible: nilai lama tanpa prefix dikembalikan apa adanya saat didekripsi', () => {
    const plaintext = 'data-lama-belum-terenkripsi'
    expect(decryptField(plaintext)).toBe(plaintext)
  })

  it('melempar error jika ENCRYPTION_KEY tidak dikonfigurasi', () => {
    const prev = process.env.ENCRYPTION_KEY
    delete process.env.ENCRYPTION_KEY
    expect(() => encryptField('apa saja')).toThrow('ENCRYPTION_KEY tidak dikonfigurasi')
    process.env.ENCRYPTION_KEY = prev
  })
})
