#!/bin/bash
# =============================================================
# GKJJ — Render halaman "sedang disiapkan" untuk domain yang belum punya aplikasi
#
# Penggunaan (di VPS, sebagai root):
#   bash /var/www/gkjj/deploy/landing/render.sh
# Pratinjau lokal (tanpa menyentuh server):
#   LANDING_ROOT=/tmp/landing bash deploy/landing/render.sh
#
# Hasil: $LANDING_ROOT/<domain>/index.html  (default /var/www/gkjj-landing)
# Dijalankan ulang kapan saja (idempotent). Satu templat, teks per domain ada di bawah.
#
# Aturan isi: JANGAN pakai karakter & atau | di teks. Teks untuk domain internal
# (kegiatan, majelis) sengaja singkat: tidak menjelaskan isi aplikasi.
# Saat sebuah aplikasi resmi hidup, hapus domainnya dari daftar di bawah dan ganti
# blok Nginx-nya (lihat docs/PLATFORM.md, bagian "Mengganti landing dengan aplikasi").
# =============================================================

set -euo pipefail
shopt -u patsub_replacement 2>/dev/null || true

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$DIR/index.template.html"
ROOT="${LANDING_ROOT:-/var/www/gkjj-landing}"

[ -f "$TEMPLATE" ] || { echo "Templat tidak ditemukan: $TEMPLATE" >&2; exit 1; }

LOGIN_URL="https://jemaat.gkjjakarta.org/login"
SITUS_URL="https://www.gkjjakarta.org"

# render <domain> <nama> <deskripsi> <html-tombol>
render() {
  local domain="$1" nama="$2" deskripsi="$3" tombol="$4"
  local isi
  isi="$(cat "$TEMPLATE")"
  isi="${isi//'{{DOMAIN}}'/$domain}"
  isi="${isi//'{{NAMA}}'/$nama}"
  isi="${isi//'{{DESKRIPSI}}'/$deskripsi}"
  isi="${isi//'{{TOMBOL}}'/$tombol}"
  if [[ "$isi" == *'{{'* ]]; then
    echo "Placeholder tersisa pada $domain" >&2
    exit 1
  fi
  install -d -m 755 "$ROOT/$domain"
  printf '%s\n' "$isi" > "$ROOT/$domain/index.html"
  chmod 644 "$ROOT/$domain/index.html"
  echo "OK  $ROOT/$domain/index.html"
}

render "my.gkjjakarta.org" \
  "Portal Jemaat" \
  "Informasi ibadah, kegiatan, renungan, dan layanan GKJ Jakarta untuk seluruh jemaat sedang kami siapkan." \
  "<a class=\"tombol utama\" href=\"$SITUS_URL\">Kunjungi situs GKJ Jakarta</a><a class=\"tombol\" href=\"$LOGIN_URL\">Masuk Warga Jemaat</a>"

render "kegiatan.gkjjakarta.org" \
  "Sistem Kegiatan" \
  "Khusus pengurus unit pelayanan GKJ Jakarta. Akses akan dibuka setelah sistem siap." \
  ""

render "majelis.gkjjakarta.org" \
  "Area Majelis" \
  "Khusus Majelis GKJ Jakarta. Akses akan dibuka setelah sistem siap." \
  ""
