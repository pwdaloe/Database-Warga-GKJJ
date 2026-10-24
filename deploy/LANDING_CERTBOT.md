# Landing "sedang disiapkan" + SSL — my / kegiatan / majelis

Pasang halaman statis untuk tiga domain baru supaya tidak lagi menampilkan "Welcome to nginx". Tidak menyentuh aplikasi yang sedang berjalan (`jemaat`, `api`) dan tidak memakai memori tambahan (tanpa PM2).

Berkas yang dipakai (semua di folder `deploy/`):

| Berkas | Fungsi |
|---|---|
| `landing/index.template.html` | Satu templat HTML (CSS inline, tanpa skrip, tanpa permintaan luar, mode gelap otomatis) |
| `landing/render.sh` | Membuat `index.html` per domain dari templat; teks per domain ada di skrip |
| `nginx-landing.prod.conf` | Tiga blok `server` (port 80); certbot menambah HTTPS |
| `nginx-snippet-landing-headers.conf` | Header keamanan bersama, `noindex`, CSP ketat |
| `nginx-default.prod.conf` | Opsional: penangkap host tidak dikenal (menutup halaman default Nginx) |

> Semua langkah di bawah dijalankan di VPS sebagai `root`, **sesudah** kode ini di-`git pull` ke `/var/www/gkjj`. Perubahan Nginx tidak menghentikan aplikasi, tetapi ikuti urutan dan jangan lewati `nginx -t`.

## 0. Pratinjau lokal (opsional, tanpa server)

```bash
LANDING_ROOT=/tmp/landing bash deploy/landing/render.sh
open /tmp/landing/my.gkjjakarta.org/index.html
```

## 1. Pastikan DNS sudah mengarah ke VPS

```bash
for d in my kegiatan majelis; do echo "== $d"; dig +short A $d.gkjjakarta.org; dig +short AAAA $d.gkjjakarta.org; done
curl -4s ifconfig.me   # IP VPS ini
```

- Setiap record **A** harus sama dengan IP VPS.
- Bila ada record **AAAA** (IPv6), pastikan itu IPv6 VPS ini. AAAA yang salah membuat certbot gagal meski A benar. Jika tidak yakin, hapus AAAA-nya.
- Tunggu propagasi sebelum lanjut (5–30 menit).

## 2. Pasang halaman dan Nginx

```bash
cd /var/www/gkjj && sudo -u gkjj git pull origin main

# halaman statis
bash deploy/landing/render.sh
chown -R root:root /var/www/gkjj-landing

# header bersama + blok server
install -d /etc/nginx/snippets
cp deploy/nginx-snippet-landing-headers.conf /etc/nginx/snippets/gkjj-landing-headers.conf
cp deploy/nginx-landing.prod.conf /etc/nginx/sites-available/landing.gkjjakarta.org
ln -sf /etc/nginx/sites-available/landing.gkjjakarta.org /etc/nginx/sites-enabled/

nginx -t && systemctl reload nginx
```

Cek (HTTP dulu, belum HTTPS):

```bash
for d in my kegiatan majelis; do curl -sI http://$d.gkjjakarta.org | head -n 1; done   # HTTP/1.1 200 OK
curl -s http://majelis.gkjjakarta.org/robots.txt                                       # Disallow: /
curl -sI http://my.gkjjakarta.org/apa-saja | head -n 1                                 # 404
```

## 3. SSL (certbot), satu sertifikat per domain

Satu sertifikat per domain supaya pembaruan atau pencabutan satu domain tidak memengaruhi yang lain, dan tiap domain bisa dipindah ke berkas Nginx sendiri nanti.

```bash
certbot --nginx -d my.gkjjakarta.org       --redirect --agree-tos -m <email-admin> --no-eff-email
certbot --nginx -d kegiatan.gkjjakarta.org --redirect --agree-tos -m <email-admin> --no-eff-email
certbot --nginx -d majelis.gkjjakarta.org  --redirect --agree-tos -m <email-admin> --no-eff-email

nginx -t && systemctl reload nginx
certbot certificates                 # tiga sertifikat baru + yang lama
certbot renew --dry-run              # pembaruan otomatis harus lolos
```

Cek HTTPS dan pengalihan:

```bash
for d in my kegiatan majelis; do
  curl -sI https://$d.gkjjakarta.org | grep -iE "^HTTP|x-robots-tag|content-security-policy"
  curl -sI http://$d.gkjjakarta.org  | grep -iE "^HTTP|^location"   # 301 ke https
done
```

> Nama domain tercatat di log Certificate Transparency yang publik begitu sertifikat terbit. Nama `kegiatan` dan `majelis` jadi bisa ditemukan siapa pun, jadi jangan mengandalkan "tidak ada yang tahu alamatnya": keamanannya ada pada login, bukan pada nama domain. Karena itu teks landing untuk dua domain itu sengaja minim.

## 4. Penangkap host tidak dikenal (opsional, disarankan)

Menutup halaman "Welcome to nginx" dan menolak permintaan yang datang lewat IP server atau domain asing. **Periksa dulu**, karena salah langkah bisa membuat situs lain ikut tertolak:

```bash
nginx -v                                   # catat versinya
grep -rn default_server /etc/nginx/        # harus kosong, kecuali sites-enabled/default (akan dinonaktifkan)
nginx -T 2>/dev/null | grep -E "^\s*server_name"   # semua host yang dilayani VPS ini harus tercantum jelas
```

Jika `www.gkjjakarta.org` (WordPress) ternyata berjalan di VPS ini, pastikan ia punya `server_name` eksplisit dan **bukan** `default_server`. Bila ragu, lewati langkah ini.

```bash
# Nginx >= 1.19.4 (cek: nginx -v). Pada Nginx 1.18 (Ubuntu 22.04) ganti blok 443 di berkas ini dengan
# ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem; ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key; return 444;
# (apt-get install -y ssl-cert)
rm -f /etc/nginx/sites-enabled/default     # tautan saja; berkas asli di sites-available tetap ada
cp deploy/nginx-default.prod.conf /etc/nginx/sites-available/000-default-catchall
ln -sf /etc/nginx/sites-available/000-default-catchall /etc/nginx/sites-enabled/

nginx -t && systemctl reload nginx
```

Uji: `curl -sI http://<IP-VPS>` harus gagal/kosong (444), sedangkan `https://jemaat.gkjjakarta.org` dan `https://api.gkjjakarta.org` tetap normal. **Buka aplikasi jemaat dan login sekali** untuk memastikan.

## Rollback

```bash
rm -f /etc/nginx/sites-enabled/landing.gkjjakarta.org /etc/nginx/sites-enabled/000-default-catchall
ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default   # hanya bila sebelumnya ada
nginx -t && systemctl reload nginx
```

Sertifikat boleh dibiarkan; hapus bila perlu dengan `certbot delete --cert-name <domain>`.

## Memasang aplikasi sungguhan nanti

Lihat `docs/PLATFORM.md`, bagian "Mengganti landing dengan aplikasi".
