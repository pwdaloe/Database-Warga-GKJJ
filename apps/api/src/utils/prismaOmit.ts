// Kolom yang TIDAK pernah ikut dibaca kecuali diminta eksplisit per query (`omit: { qrToken: false }` atau `select`).
// Token QR adalah kunci akses ke halaman publik anggota; dengan default dihilangkan, respons baru yang
// mengembalikan data warga tidak bisa membocorkannya secara tidak sengaja. Dipisah dari prisma.ts agar bisa dites
// tanpa membuat koneksi database.
export const PRISMA_OMIT = { warga: { qrToken: true } } as const
