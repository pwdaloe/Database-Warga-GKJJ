import { prisma } from '../utils/prisma.js'

export const PORTAL_URL_DEFAULT = 'https://jemaat.gkjjakarta.org'

export const PLACEHOLDERS = ['nama', 'username', 'password', 'url_portal', 'role', 'kelompok'] as const
export type Placeholder = (typeof PLACEHOLDERS)[number]

export const TEMPLATE_KODE = ['AKUN_BARU', 'RESET_PASSWORD'] as const
export type TemplateKode = (typeof TEMPLATE_KODE)[number]

export const TEMPLATE_DEFAULT: Record<TemplateKode, { nama: string; isi: string }> = {
  AKUN_BARU: {
    nama: 'Akun Baru',
    isi: `Shalom {{nama}},

Akun Anda untuk Database Warga GKJ Jakarta sudah dibuat.
Portal : {{url_portal}}
Username : {{username}}
Password : {{password}}

Anda akan diminta mengganti password saat login pertama.
Mohon jangan bagikan password ini kepada siapa pun.
Tuhan memberkati.`,
  },
  RESET_PASSWORD: {
    nama: 'Reset Password',
    isi: `Shalom {{nama}},

Password akun Anda di Database Warga GKJ Jakarta telah direset.
Portal : {{url_portal}}
Username : {{username}}
Password baru : {{password}}

Anda akan diminta mengganti password saat login berikutnya.
Mohon jangan bagikan password ini kepada siapa pun.`,
  },
}

export function portalUrl(): string {
  return process.env.PORTAL_URL || PORTAL_URL_DEFAULT
}

/** Placeholder `{{x}}` di luar daftar yang dikenal (untuk validasi saat menyimpan template). */
export function unknownPlaceholders(isi: string): string[] {
  const found = [...isi.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/gi)].map((m) => m[1]!.toLowerCase())
  return [...new Set(found.filter((p) => !(PLACEHOLDERS as readonly string[]).includes(p)))]
}

export function renderTemplate(isi: string, data: Partial<Record<Placeholder, string>>): string {
  return isi.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (whole, key: string) => {
    const k = key.toLowerCase() as Placeholder
    return k in data ? (data[k] ?? '') : whole
  })
}

export async function getTemplate(kode: TemplateKode) {
  const existing = await prisma.templatePesan.findUnique({ where: { kode } })
  if (existing) return existing
  const def = TEMPLATE_DEFAULT[kode]
  return prisma.templatePesan.create({ data: { kode, nama: def.nama, isi: def.isi } })
}
