-- ============================================================
-- DDL: Create Tables — Database Warga GKJJ
-- Dibuat: 2026-05-04
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- MASTER: WILAYAH
-- ============================================================
CREATE TABLE IF NOT EXISTS wilayah (
  id          SERIAL PRIMARY KEY,
  kode        VARCHAR(5)   NOT NULL UNIQUE,  -- A, B, C
  nama        VARCHAR(100) NOT NULL,
  keterangan  TEXT,
  aktif       BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MASTER: KELOMPOK
-- ============================================================
CREATE TABLE IF NOT EXISTS kelompok (
  id                  SERIAL PRIMARY KEY,
  wilayah_id          INTEGER      NOT NULL REFERENCES wilayah(id),
  kode                VARCHAR(5)   NOT NULL UNIQUE,  -- A1, B3, C6, dst
  nama                VARCHAR(100) NOT NULL,
  penatua_id          INTEGER,                       -- FK ke warga, diisi setelah import
  penatua_nama_temp   VARCHAR(150),                  -- nama sementara sebelum warga diimport
  aktif               BOOLEAN      NOT NULL DEFAULT true,
  keterangan          TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- KELUARGA
-- ============================================================
CREATE TABLE IF NOT EXISTS keluarga (
  id              SERIAL PRIMARY KEY,
  nomor_keluarga  VARCHAR(20)  UNIQUE,              -- bisa diisi manual atau auto-generate
  kelompok_id     INTEGER      REFERENCES kelompok(id),
  -- Alamat
  alamat          TEXT,
  rt              VARCHAR(5),
  rw              VARCHAR(5),
  kelurahan       VARCHAR(100),
  kecamatan       VARCHAR(100),
  kota            VARCHAR(100),
  kode_pos        VARCHAR(10),
  telepon_rumah   VARCHAR(20),
  -- Status
  status          VARCHAR(20)  NOT NULL DEFAULT 'aktif'
                  CHECK (status IN ('aktif','non-aktif')),
  data_status     VARCHAR(20)  NOT NULL DEFAULT 'draft'
                  CHECK (data_status IN ('draft','pending','approved','validated')),
  catatan         TEXT,
  -- Audit
  created_by      INTEGER,
  updated_by      INTEGER,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WARGA
-- ============================================================
CREATE TABLE IF NOT EXISTS warga (
  id                    SERIAL PRIMARY KEY,
  keluarga_id           INTEGER      REFERENCES keluarga(id),
  nomor_anggota         VARCHAR(20)  UNIQUE,         -- nomor unik per warga

  -- Identitas Pribadi
  nama_lengkap          VARCHAR(150) NOT NULL,
  nama_panggilan        VARCHAR(50),
  jenis_kelamin         CHAR(1)      NOT NULL CHECK (jenis_kelamin IN ('L','P')),
  tempat_lahir          VARCHAR(100),
  tanggal_lahir         DATE,
  nik                   VARCHAR(20)  UNIQUE,
  golongan_darah        VARCHAR(5)   CHECK (golongan_darah IN ('A','B','AB','O',NULL)),
  foto_url              TEXT,

  -- Status dalam Keluarga
  status_keluarga       VARCHAR(20)  NOT NULL DEFAULT 'lainnya'
                        CHECK (status_keluarga IN ('kepala','istri','anak','menantu','cucu','lainnya')),

  -- Status Keanggotaan Gereja
  status_keanggotaan    VARCHAR(20)  NOT NULL DEFAULT 'aktif'
                        CHECK (status_keanggotaan IN ('aktif','non-aktif','katekumen','pindah_keluar','meninggal')),

  -- Sakramen
  sudah_baptis          BOOLEAN      DEFAULT false,
  tanggal_baptis        DATE,
  tempat_baptis         VARCHAR(150),
  sudah_sidi            BOOLEAN      DEFAULT false,
  nomor_sidi            VARCHAR(30),
  tanggal_sidi          DATE,

  -- Kontak
  telepon               VARCHAR(20),
  whatsapp              VARCHAR(20),
  email                 VARCHAR(100),

  -- Lainnya
  pendidikan_terakhir   VARCHAR(50),
  pekerjaan             VARCHAR(100),

  -- Workflow Status
  data_status           VARCHAR(20)  NOT NULL DEFAULT 'draft'
                        CHECK (data_status IN ('draft','pending','approved','validated')),
  catatan               TEXT,

  -- Audit
  created_by            INTEGER,
  updated_by            INTEGER,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- FK balik: penatua_id di kelompok menunjuk ke warga
ALTER TABLE kelompok
  ADD CONSTRAINT fk_kelompok_penatua
  FOREIGN KEY (penatua_id) REFERENCES warga(id);

-- ============================================================
-- PERPINDAHAN (historis surat masuk/keluar/meninggal)
-- ============================================================
CREATE TABLE IF NOT EXISTS perpindahan (
  id                    SERIAL PRIMARY KEY,
  warga_id              INTEGER      NOT NULL REFERENCES warga(id),
  jenis                 VARCHAR(20)  NOT NULL CHECK (jenis IN ('masuk','keluar','meninggal')),
  gereja_asal_tujuan    VARCHAR(200),
  tanggal_perpindahan   DATE,
  nomor_surat           VARCHAR(50),
  approved_by           INTEGER      REFERENCES warga(id),
  validated_by          INTEGER      REFERENCES warga(id),
  keterangan            TEXT,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS (akun login)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  warga_id        INTEGER      REFERENCES warga(id),  -- nullable: akun sistem tanpa data warga
  nama            VARCHAR(150) NOT NULL,
  username        VARCHAR(50)  NOT NULL UNIQUE,
  email           VARCHAR(100) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(30)  NOT NULL
                  CHECK (role IN ('superadmin','kepala_kantor','majelis','staf_admin','penatua_kelompok','viewer')),
  kelompok_id     INTEGER      REFERENCES kelompok(id), -- scope untuk penatua_kelompok
  aktif           BOOLEAN      NOT NULL DEFAULT true,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- FK audit ke users
ALTER TABLE keluarga ADD CONSTRAINT fk_keluarga_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE keluarga ADD CONSTRAINT fk_keluarga_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
ALTER TABLE warga    ADD CONSTRAINT fk_warga_created_by    FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE warga    ADD CONSTRAINT fk_warga_updated_by    FOREIGN KEY (updated_by) REFERENCES users(id);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL    PRIMARY KEY,
  user_id     INTEGER      REFERENCES users(id),
  action      VARCHAR(20)  NOT NULL CHECK (action IN ('CREATE','UPDATE','DELETE','APPROVE','VALIDATE','IMPORT')),
  tabel       VARCHAR(50)  NOT NULL,
  record_id   INTEGER      NOT NULL,
  data_lama   JSONB,
  data_baru   JSONB,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- IMPORT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS import_log (
  id              SERIAL       PRIMARY KEY,
  user_id         INTEGER      REFERENCES users(id),
  filename        VARCHAR(255) NOT NULL,
  total_rows      INTEGER,
  success_count   INTEGER      DEFAULT 0,
  error_count     INTEGER      DEFAULT 0,
  error_detail    JSONB,
  status          VARCHAR(20)  NOT NULL DEFAULT 'processing'
                  CHECK (status IN ('processing','completed','failed')),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES untuk performa query umum
-- ============================================================
CREATE INDEX idx_warga_keluarga_id        ON warga(keluarga_id);
CREATE INDEX idx_warga_nama_lengkap       ON warga(nama_lengkap);
CREATE INDEX idx_warga_status_keanggotaan ON warga(status_keanggotaan);
CREATE INDEX idx_warga_data_status        ON warga(data_status);
CREATE INDEX idx_keluarga_kelompok_id     ON keluarga(kelompok_id);
CREATE INDEX idx_kelompok_wilayah_id      ON kelompok(wilayah_id);
CREATE INDEX idx_audit_log_tabel_record   ON audit_log(tabel, record_id);
CREATE INDEX idx_audit_log_user_id        ON audit_log(user_id);

-- ============================================================
-- Trigger: auto update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_wilayah  BEFORE UPDATE ON wilayah  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_kelompok BEFORE UPDATE ON kelompok FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_keluarga BEFORE UPDATE ON keluarga FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_warga    BEFORE UPDATE ON warga    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_users    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
