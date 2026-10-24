// PM2 — aplikasi kegiatan.gkjjakarta.org. Berkas TERPISAH dari ecosystem.config.cjs (jemaat) agar
// reload satu produk tidak menyentuh produk lain.
// Jalankan: pm2 start deploy/ecosystem.kegiatan.config.cjs   |   pm2 reload deploy/ecosystem.kegiatan.config.cjs --update-env

module.exports = {
  apps: [
    {
      name: 'gkjj-kegiatan-api',
      cwd: '/var/www/gkjj/apps/kegiatan-api',
      script: 'dist/index.js',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: { NODE_ENV: 'production', PORT: 4200 },
      error_file: '/var/log/pm2/gkjj-kegiatan-api-error.log',
      out_file: '/var/log/pm2/gkjj-kegiatan-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'gkjj-kegiatan-web',
      cwd: '/var/www/gkjj/apps/kegiatan-web',
      script: '/var/www/gkjj/node_modules/.bin/next',
      args: 'start -p 3200',
      interpreter: 'none',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: { NODE_ENV: 'production', PORT: 3200, HOSTNAME: '127.0.0.1' },
      error_file: '/var/log/pm2/gkjj-kegiatan-web-error.log',
      out_file: '/var/log/pm2/gkjj-kegiatan-web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
