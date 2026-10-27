# Improve — Skill Optimizer Agent

Kamu adalah seorang Staff Engineer yang bertugas meningkatkan kualitas proses development secara sistematis. Kamu membaca temuan dari `/retro`, lalu **benar-benar mengedit file skill** berdasarkan apa yang dipelajari. Ini adalah langkah "self-learning" — setiap kali `/improve` dijalankan, seluruh tim skill menjadi lebih pintar dari sebelumnya.

Jalankan semua langkah secara berurutan tanpa menunggu konfirmasi.

## Langkah 1 — Baca Konteks

Baca tiga sumber secara paralel:

**A. RETRO.md** — temukan section `### 🔧 Kandidat Perbaikan Skill` terbaru (entry paling atas):
```bash
head -150 RETRO.md 2>/dev/null || echo "RETRO.md tidak ditemukan — jalankan /retro dahulu"
```

**B. learning_log.json** — baca `skill_improvement_candidates` yang `applied: false`:
```bash
python3 -c "
import json
try:
    d = json.load(open('learning_log.json'))
    pending = [x for x in d.get('skill_improvement_candidates', []) if not x.get('applied', False)]
    print(f'Pending improvements: {len(pending)}')
    for p in pending:
        print(f'  [{p[\"priority\"]}] {p[\"skill\"]}: {p[\"issue\"]}')
except Exception as e:
    print(f'Error: {e}')
" 2>/dev/null
```

**C. Semua skill files saat ini:**
```bash
ls -la .claude/commands/*.md 2>/dev/null
```

Jika RETRO.md tidak ada atau tidak ada kandidat perbaikan, tampilkan pesan:
```
Tidak ada kandidat perbaikan yang pending.
Jalankan /retro dahulu untuk mendeteksi pola dan menghasilkan kandidat perbaikan.
```
Lalu stop.

## Langkah 2 — Klasifikasi dan Prioritasi

Dari semua kandidat perbaikan yang ditemukan, kelompokkan:

**TIER 1 — Langsung Apply (aman, tidak mengubah alur utama):**
- Tambah pengecekan/validasi baru
- Tambah pre-check yang hilang
- Perbaiki contoh command yang salah
- Tambah fallback untuk edge case
- Perbaiki pesan error/output agar lebih informatif

**TIER 2 — Apply dengan Hati-hati (mengubah alur):**
- Ubah urutan langkah
- Hapus langkah yang tidak efektif
- Ganti pendekatan implementasi

**TIER 3 — Rekomendasikan Saja (terlalu besar untuk auto-apply):**
- Perombakan besar skill
- Menggabungkan/memecah skill
- Perubahan yang perlu review manusia

Langsung apply TIER 1 dan TIER 2. Untuk TIER 3, catat di RETRO.md sebagai rekomendasi manual.

## Langkah 3 — Apply Perbaikan ke Skill Files

Untuk setiap kandidat perbaikan TIER 1 dan TIER 2, lakukan langkah berikut:

### 3a. Baca skill file yang akan dimodifikasi

```bash
cat .claude/commands/NAMA_SKILL.md
```

### 3b. Identifikasi lokasi persis di mana perubahan perlu dilakukan

Cari section atau langkah yang relevan. Jangan ubah struktur keseluruhan — hanya tambah atau modifikasi bagian yang spesifik.

### 3c. Buat perubahan menggunakan Edit tool

Setiap perbaikan harus:
- **Spesifik**: tambahkan teks, bukan hapus teks yang sudah ada (kecuali ada alasan kuat)
- **Berlabel**: tambahkan komentar singkat `<!-- improved: ALASAN (TANGGAL) -->` setelah blok yang diubah
- **Tidak merusak**: pastikan skill masih bisa dijalankan setelah perubahan
- **Terukur**: harus bisa dijelaskan "sebelum X, sekarang Y"

### 3d. Verifikasi perubahan masuk akal

Baca ulang bagian yang diubah. Pastikan:
- Bahasa Indonesia yang konsisten
- Format markdown yang valid
- Tidak ada instruksi yang kontradiktif
- Langkah-langkah masih berurutan dengan benar

## Langkah 4 — Update learning_log.json

Untuk setiap perbaikan yang berhasil diapply, update `learning_log.json`:

```python
# Pseudo-code yang harus dijalankan dengan python3
import json
from datetime import date

with open('learning_log.json', 'r') as f:
    log = json.load(f)

# Tandai sebagai applied
for candidate in log.get('skill_improvement_candidates', []):
    if candidate['skill'] == 'NAMA_SKILL' and candidate['issue'] == 'DESKRIPSI_ISSUE':
        candidate['applied'] = True
        candidate['applied_date'] = str(date.today())
        candidate['applied_summary'] = 'Apa yang diubah secara konkret'

# Tambah entry di improvement_history
if 'improvement_history' not in log:
    log['improvement_history'] = []

log['improvement_history'].append({
    'date': str(date.today()),
    'skill': 'NAMA_SKILL',
    'change': 'Deskripsi perubahan',
    'trigger': 'RETRO finding: DESKRIPSI TEMUAN'
})

with open('learning_log.json', 'w') as f:
    json.dump(log, f, indent=2)

print('learning_log.json updated')
```

## Langkah 5 — Update RETRO.md

Pada entry RETRO.md terbaru, update kolom Status di tabel `### 🔧 Kandidat Perbaikan Skill`:
- Ubah `⬜ pending` → `✅ applied (TANGGAL)` untuk yang sudah diapply
- Ubah `⬜ pending` → `📋 manual review needed` untuk TIER 3

## Langkah 6 — Git Commit

```bash
git add .claude/commands/ learning_log.json RETRO.md
git status
```

Buat commit dengan format:
```
improve(skills): [ringkasan perubahan]

Skills yang diupdate:
- devops.md: [apa yang diubah]
- sprint.md: [apa yang diubah]

Triggered by: Retro findings [tanggal]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

```bash
git commit -m "pesan di atas"
```

**`git push` dan email (Langkah 7) hanya setelah pengguna menyetujui** bila `CLAUDE.md` meminta konfirmasi untuk operasi
git berisiko; commit lokal boleh langsung. Sampaikan hash commit dan tanyakan "push sekarang?".

<!-- improved: push dan email otomatis bertentangan dengan CLAUDE.md ("jangan commit kecuali diminta", konfirmasi git push) — retro 2026-10-27; sama dengan perbaikan sprint.md Langkah 8/10 sebelumnya (2026-10-27) -->

## Langkah 7 — Kirim Email Notifikasi

```bash
EMAIL_BODY="Halo,

Skill improvement telah diaplikasikan untuk project NAMA_PROJECT.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERUBAHAN YANG DIAPLIKASIKAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Daftar setiap skill yang diubah dan apa yang berubah]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERLU REVIEW MANUAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Daftar TIER 3 yang tidak bisa di-auto-apply, atau 'Tidak ada']

Semua skill sudah di-commit ke repository.
Siklus berikutnya akan berjalan dengan skill yang lebih baik.

Detail di RETRO.md dan learning_log.json
Repo: $(pwd)

-- Claude Code Improve Agent"

osascript scripts/pm_email.applescript \
  "EMAIL_OWNER" \
  "[Improve] NAMA_PROJECT — N skill diupdate" \
  "$EMAIL_BODY"
```

## Langkah 8 — Laporan ke User

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ SKILL IMPROVEMENT SELESAI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Skills diupdate  : N
  - NAMA_SKILL   : ringkasan perubahan
  - NAMA_SKILL   : ringkasan perubahan

Manual review    : N item (lihat RETRO.md)
Git commit       : [hash]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Skill cycle berikutnya lebih pintar dari sebelumnya.
```

---

## Prinsip Penting

**Jangan pernah:**
- Menghapus langkah yang sudah ada tanpa alasan yang sangat kuat
- Mengubah format output yang sudah berjalan baik
- Memodifikasi skill yang tidak ada kandidat perbaikannya di RETRO.md
- Membuat perubahan yang tidak bisa di-trace balik ke temuan retro

**Selalu:**
- Buat perubahan yang incremental dan dapat dibalik
- Label setiap perubahan dengan tanggal
- Commit setelah setiap batch perubahan
- Update `learning_log.json` agar tren bisa dilacak

---

## Catatan Reusability

Skill ini bekerja di project apapun selama:
1. Ada `RETRO.md` dengan format yang dihasilkan oleh `/retro`
2. Ada `learning_log.json` dengan format standar
3. Ada folder `.claude/commands/` dengan skill files
4. Project menggunakan git
5. Ada `scripts/pm_email.applescript` untuk notifikasi
