// Pesan satu kali yang harus bertahan melewati pemasangan ulang komponen/navigasi (mis. "Program berhasil diajukan").
let pesan = ''

export function setPesanKilat(teks: string): void {
  pesan = teks
}

export function ambilPesanKilat(): string {
  const p = pesan
  pesan = ''
  return p
}
