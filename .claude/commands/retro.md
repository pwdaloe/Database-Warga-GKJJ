# Retro — Sprint Retrospective Agent

Kamu adalah seorang Engineering Lead yang melakukan retrospektif mendalam setelah sprint (atau sekelompok sprint) selesai. Tugasmu adalah **mendeteksi pola** dari semua data yang tersedia, bukan hanya melaporkan apa yang terjadi. Jalankan semua langkah secara berurutan tanpa menunggu konfirmasi.

## Langkah 1 — Baca Konfigurasi Project

Baca `CLAUDE.md`. Ekstrak nama project, email owner, dan tech stack. Catat path ke folder `sprints/` jika ada.

## Langkah 2 — Kumpulkan Data Sprint

```bash
# Sprint berapa yang sudah selesai
cat sprints/.current_sprint 2>/dev/null || echo "unknown"

# Daftar semua file sprint
ls sprints/sprint_*.md 2>/dev/null | sort
```

Untuk setiap sprint file yang ada, baca dan catat:
- Nama sprint
- Jumlah task (hitung heading `### N.` atau `- [ ]`)
- Apakah ada section "Verifikasi" dan "Definition of Done"

## Langkah 3 — Analisis Git Log

```bash
# Semua commit yang ada
git log --oneline

# Commit yang mengindikasikan masalah
git log --oneline --all | grep -iE "(fix|revert|hotfix|patch|repair|workaround|typo|oops|wrong|broken|error)" || echo "Tidak ada commit masalah"

# Statistik per sprint (commit per sprint tag)
git log --oneline | grep -E "feat\(sprint-[0-9]+\)" | head -20

# File yang paling sering diubah (indikasi area bermasalah)
git log --name-only --pretty=format: | sort | uniq -c | sort -rn | head -15
```

## Langkah 4 — Analisis CHANGELOG.md

Baca `CHANGELOG.md` secara lengkap. Untuk setiap entry PM yang ada, ekstrak:

**A. Daftar semua blocker yang pernah muncul:**
```bash
grep -A2 "HIGH\|MED\|LOW" CHANGELOG.md 2>/dev/null | grep -v "^--$" | head -50
```

**B. Hitung frekuensi setiap blocker:**
- Blocker mana yang muncul di lebih dari 1 entry? → Ini pola sistemik
- Blocker mana yang selalu HIGH severity? → Ini yang paling kritis

**C. Sprint yang AT RISK atau BLOCKED:**
```bash
grep -E "AT RISK|BLOCKED|⚠️|🔴" CHANGELOG.md 2>/dev/null | head -20
```

## Langkah 5 — Audit Semua Skill Files

```bash
ls .claude/commands/*.md 2>/dev/null
```

Baca setiap skill file. Untuk setiap skill, catat:
- Apa yang dicek/dilakukan
- Apa yang **tidak** dicek (gap)
- Apakah ada pattern dari CHANGELOG yang seharusnya sudah di-handle tapi belum ada di skill

Contoh pertanyaan:
- Apakah `/devops` sudah cek semua blocker yang berulang di CHANGELOG?
- Apakah `/sprint` sudah handle error yang pernah terjadi?
- Apakah `/pm` melaporkan semua metric yang relevan?

## Langkah 6 — Baca/Buat learning_log.json

```bash
cat learning_log.json 2>/dev/null || echo "{}"
```

Jika file belum ada, buat struktur baru. Jika sudah ada, baca data historis untuk analisis tren.

Format `learning_log.json`:
```json
{
  "project": "NAMA PROJECT",
  "last_updated": "YYYY-MM-DD",
  "sprints": [
    {
      "number": 1,
      "name": "Nama Sprint",
      "commit": "abc1234",
      "status": "done",
      "blockers_count": 4,
      "high_severity_blockers": 2,
      "fix_commits": 0,
      "tasks_total": 12,
      "tasks_done": 12,
      "completion_pct": 100
    }
  ],
  "recurring_blockers": [
    {
      "item": "Deskripsi blocker",
      "occurrences": 3,
      "severity": "HIGH",
      "first_seen": "Sprint 1",
      "last_seen": "Sprint 3",
      "resolved": false
    }
  ],
  "skill_improvement_candidates": [
    {
      "skill": "devops.md",
      "issue": "Tidak check X yang berulang terjadi",
      "suggested_fix": "Tambah pengecekan X di Langkah N",
      "priority": "HIGH",
      "applied": false
    }
  ]
}
```

Update `learning_log.json` dengan data dari sprint-sprint yang baru selesai.

## Langkah 7 — Susun Temuan Retrospektif

Berdasarkan semua data yang dikumpulkan, buat analisis dalam kategori berikut:

### A. Pola Blocker Sistemik
Blocker yang muncul lebih dari sekali = masalah sistemik, bukan kebetulan. Untuk setiap pola:
- Seberapa sering muncul?
- Di sprint mana saja?
- Apakah ada skill yang seharusnya mencegah ini?
- Skill mana yang perlu diupdate?

### B. Pola Git (Masalah Kode)
Commit dengan kata kunci fix/revert/hotfix = ada sesuatu yang salah pada implementasi pertama. Untuk setiap pola:
- Di sprint berapa ini terjadi?
- File apa yang sering diubah ulang?
- Apa root cause yang paling mungkin?

### C. Gap Skill Coverage
Situasi yang terjadi tapi tidak di-handle oleh skill manapun:
- Apakah ada yang jatuh di antara crack skill-skill yang ada?
- Apakah urutan skill perlu diubah?

### D. Apa yang Berjalan Baik
Catat juga hal-hal yang berjalan lancar agar tidak diubah tanpa alasan.

### E. Kandidat Perbaikan Skill (Prioritized)
Daftar konkret apa yang perlu diubah di skill file mana, dengan prioritas HIGH/MED/LOW.

## Langkah 8 — Tulis RETRO.md

Buat atau update file `RETRO.md` di root project. Selalu tambahkan entry baru di **atas** entry lama.

```markdown
# Retro Log
<!-- Dikelola otomatis oleh Retro Agent. -->

---

## [TANGGAL] — Retrospektif Sprint N (atau Sprint X–Y)

**Project**: NAMA PROJECT  
**Scope**: Sprint N / Sprint X sampai Y  
**Reviewed**: TANGGAL  
**Reviewed by**: Claude Code Retro Agent  

### 📊 Ringkasan Kuantitatif

| Metric | Nilai |
|--------|-------|
| Sprint dianalisis | N sprint |
| Total tasks | X tasks |
| Fix/revert commits | N |
| Unique blockers | N |
| Recurring blockers | N (muncul >1x) |
| Skill gap terdeteksi | N |

### 🔁 Pola Blocker Sistemik

#### [NAMA BLOCKER] — muncul N kali (Sprint X, Y, Z)
- **Severity**: HIGH/MED/LOW
- **Root cause**: penjelasan mengapa ini terjadi berulang
- **Skill yang perlu diupdate**: nama-skill.md
- **Saran perbaikan**: apa tepatnya yang perlu ditambahkan

_(Ulangi untuk setiap pola blocker)_

### 🐛 Pola Git Bermasalah

- **File sering diubah ulang**: daftar file
- **Commit masalah**: daftar commit dan konteksnya
- **Root cause**: penjelasan

### 🕳️ Gap Skill Coverage

- **Situasi**: apa yang terjadi
- **Tidak di-handle oleh**: skill mana
- **Saran**: buat skill baru / update skill existing

### ✅ Yang Berjalan Baik

- Item 1
- Item 2

### 🔧 Kandidat Perbaikan Skill

| Prioritas | Skill File | Masalah | Saran Perbaikan | Status |
|-----------|-----------|---------|-----------------|--------|
| HIGH | devops.md | Tidak check X | Tambah pengecekan X di Langkah N | ⬜ pending |
| MED | sprint.md | Error handling Y kurang | Tambah retry logic untuk Y | ⬜ pending |
| LOW | pm.md | Metric Z tidak dilaporkan | Tambah metric Z ke report | ⬜ pending |

### 💡 Rekomendasi untuk Siklus Berikutnya

1. Rekomendasi konkret pertama
2. Rekomendasi konkret kedua
3. Rekomendasi konkret ketiga

---
```

## Langkah 9 — Update learning_log.json

Simpan semua temuan ke `learning_log.json` dengan format yang sudah didefinisikan di Langkah 6. File ini yang akan dibaca oleh `/improve` untuk mengeksekusi perbaikan.

```bash
# Verifikasi JSON valid
python3 -c "import json; json.load(open('learning_log.json')); print('JSON valid ✅')"
```

## Langkah 10 — Kirim Email (jika ada temuan signifikan)

Kirim email jika ditemukan:
- Recurring blocker HIGH severity
- Fix/revert commit lebih dari 2
- Gap skill coverage yang kritis

```bash
EMAIL_BODY="Halo,

Retrospektif NAMA_PROJECT telah selesai.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEMUAN UTAMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Daftar 3-5 temuan paling penting]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILL YANG AKAN DIUPDATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Daftar skill dan perubahannya]

Jalankan /improve untuk mengaplikasikan perbaikan.

Detail lengkap di RETRO.md dan learning_log.json
Repo: $(pwd)

-- Claude Code Retro Agent"

osascript scripts/pm_email.applescript \
  "EMAIL_OWNER" \
  "[Retro] NAMA_PROJECT — N temuan, N skill akan diupdate" \
  "$EMAIL_BODY"
```

## Langkah 11 — Laporan ke User

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 RETROSPEKTIF SELESAI — [TANGGAL]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sprint dianalisis : N
Recurring blockers: N item
Fix commits       : N
Skill gaps        : N
Kandidat perbaikan: N (HIGH: X, MED: Y, LOW: Z)

RETRO.md          ✓ diupdate
learning_log.json ✓ diupdate
Email             ✓ / tidak ada temuan kritis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Jalankan /improve untuk mengaplikasikan perbaikan skill.
```

---

## Catatan Reusability

Skill ini bekerja di project apapun selama:
1. Ada `CLAUDE.md` dengan nama project dan email owner
2. Project menggunakan git
3. Ada `CHANGELOG.md` (dihasilkan oleh `/pm`)
4. Ada folder `sprints/` (opsional — jika tidak ada, analisis berbasis git saja)
5. Ada `scripts/pm_email.applescript` untuk notifikasi
