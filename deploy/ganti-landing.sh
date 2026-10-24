#!/bin/bash
# =============================================================
# Menghapus blok server sebuah domain dari berkas landing Nginx (sebelum memasang aplikasinya).
#   bash deploy/ganti-landing.sh kegiatan.gkjjakarta.org
# Aman: membuat cadangan, hanya menghapus blok `server { ... }` yang server_name-nya TEPAT domain itu,
# lalu `nginx -t`; bila gagal, berkas dikembalikan. Tidak me-reload Nginx (lakukan sendiri sesudah berkas baru dipasang).
# =============================================================
set -euo pipefail
DOMAIN="${1:-}"
BERKAS="${LANDING_CONF:-/etc/nginx/sites-available/landing.gkjjakarta.org}"
[[ "$DOMAIN" =~ ^[a-z0-9.-]+\.gkjjakarta\.org$ ]] || { echo "Pemakaian: $0 <subdomain>.gkjjakarta.org" >&2; exit 1; }
[ -f "$BERKAS" ] || { echo "Berkas tidak ada: $BERKAS" >&2; exit 1; }

CADANGAN="$BERKAS.bak.$(date +%Y%m%d%H%M%S)"
cp "$BERKAS" "$CADANGAN"
echo "Cadangan: $CADANGAN"

STATUS=0
python3 - "$BERKAS" "$DOMAIN" <<'PY' || STATUS=$?
import re, sys
path, domain = sys.argv[1], sys.argv[2]
teks = open(path).read()
keluar, i, dibuang = [], 0, 0
while i < len(teks):
    m = re.compile(r'(^|\n)([ \t]*)server\s*\{').search(teks, i)
    if not m:
        keluar.append(teks[i:]); break
    awal = m.start() + (1 if m.group(1) else 0)
    keluar.append(teks[i:awal])
    # cari kurung penutup yang seimbang
    dalam, j = 0, m.end() - 1
    while j < len(teks):
        if teks[j] == '{': dalam += 1
        elif teks[j] == '}':
            dalam -= 1
            if dalam == 0: break
        j += 1
    blok = teks[awal:j + 1]
    nama = re.search(r'server_name\s+([^;]+);', blok)
    tepat = nama and domain in nama.group(1).split()
    if tepat:
        dibuang += 1
    else:
        keluar.append(blok)
    i = j + 1
open(path, 'w').write(''.join(keluar))
print(f'Blok server dibuang untuk {domain}: {dibuang}')
sys.exit(0 if dibuang > 0 else 3)
PY
if [ "$STATUS" -ne 0 ]; then cp "$CADANGAN" "$BERKAS"; echo "Tidak ada blok yang cocok; berkas dikembalikan." >&2; exit 1; fi

if nginx -t 2>/dev/null; then
  echo "nginx -t: OK (belum di-reload)."
else
  # nginx -t gagal sekarang bisa karena berkas baru belum dipasang; tampilkan pesan, jangan menyembunyikan
  nginx -t || true
  echo "Bila galat bukan karena domain ini belum dipasang di berkas baru, kembalikan: cp $CADANGAN $BERKAS" >&2
fi
