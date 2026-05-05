-- ============================================================
-- SEED: Master Data Wilayah & Kelompok GKJJ
-- Dibuat: 2026-05-04
-- Total: 3 Wilayah, 22 Kelompok
-- Catatan: penatua_id diisi NULL dulu, akan di-update setelah
--          data warga diimport dan di-link ke tabel warga.
-- ============================================================

TRUNCATE TABLE kelompok RESTART IDENTITY CASCADE;
TRUNCATE TABLE wilayah  RESTART IDENTITY CASCADE;

-- ============================================================
-- WILAYAH (3)
-- ============================================================
INSERT INTO wilayah (id, kode, nama, aktif) VALUES
  (1, 'A', 'Rawamangun A', true),
  (2, 'B', 'Rawamangun B', true),
  (3, 'C', 'Rawamangun C', true);

-- ============================================================
-- KELOMPOK — Rawamangun A (8 kelompok: A1–A8)
-- ============================================================
INSERT INTO kelompok (id, wilayah_id, kode, nama, penatua_nama_temp, penatua_id, aktif) VALUES
  ( 1, 1, 'A1', 'Cempaka Baru',         'Pramudya Hardjito',             NULL, true),
  ( 2, 1, 'A2', 'Utan Kayu',            'Louise Reyna E. Mauruh Maskat', NULL, true),
  ( 3, 1, 'A3', 'Kebon Kelapa',         'Dahlia C. Sinaga',              NULL, true),
  ( 4, 1, 'A4', 'Menteng',              'Tri Eka Wahyuni',               NULL, true),
  ( 5, 1, 'A5', 'Percetakan Negara',    'Ernanto Prabowo',               NULL, true),
  ( 6, 1, 'A6', 'Kemayoran I / Sunter', 'Jakub Handoko',                 NULL, true),
  ( 7, 1, 'A7', 'Ksatrian',             'Yashinta Triwati',              NULL, true),
  ( 8, 1, 'A8', 'Sari Cempaka',         'Teguh Tri Santoso',             NULL, true);

-- ============================================================
-- KELOMPOK — Rawamangun B (9 kelompok: B1–B9)
-- Wiradika dihapus karena belum ada penatua pengganti
-- ============================================================
INSERT INTO kelompok (id, wilayah_id, kode, nama, penatua_nama_temp, penatua_id, aktif) VALUES
  ( 9, 2, 'B1', 'Rawabadung',          'Suparyanto',           NULL, true),
  (10, 2, 'B2', 'Cipinang Baru',       'Lydia',                NULL, true),
  (11, 2, 'B3', 'Kelapa Gading',       'Firnaningati',         NULL, true),
  (12, 2, 'B4', 'Kampung Ambon',       'Aryo Aditomo',         NULL, true),
  (13, 2, 'B5', 'Penggilingan',        'Maryono',              NULL, true),
  (14, 2, 'B6', 'Rawamangun Timur',    'Martha Ken Larasati',  NULL, true),
  (15, 2, 'B7', 'Marenco',             'Dwiwanto Presantoro',  NULL, true),
  (16, 2, 'B8', 'Cipinang Kebembem',   'Efi Pujiastuti',       NULL, true),
  (17, 2, 'B9', 'Rawamangun Barat',    'Sanjung Purna',        NULL, true);

-- ============================================================
-- KELOMPOK — Rawamangun C (5 kelompok: C1–C5)
-- Cipinang Muara duplikat (tanpa PIC) dihapus
-- ============================================================
INSERT INTO kelompok (id, wilayah_id, kode, nama, penatua_nama_temp, penatua_id, aktif) VALUES
  (18, 3, 'C1', 'Cipinang Muara',              'Eko Sutrisno',         NULL, true),
  (19, 3, 'C2', 'Pondok Kopi',                 'Pratelaningsihmirmo',  NULL, true),
  (20, 3, 'C3', 'Duren Sawit - Pondok Kelapa', 'Wisnu Priambudi',      NULL, true),
  (21, 3, 'C4', 'Pondok Bambu I',              'Bambang Tugianto',     NULL, true),
  (22, 3, 'C5', 'Pondok Bambu II',             'Kurida B. Budiantoro', NULL, true);

-- ============================================================
-- Setelah import warga: link penatua_id ke tabel warga
-- ============================================================
-- UPDATE kelompok k
--   SET penatua_id = w.id
--   FROM warga w
--   WHERE w.nama_lengkap = k.penatua_nama_temp
--     AND k.penatua_id IS NULL;
