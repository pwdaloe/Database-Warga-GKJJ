// PM2 Ecosystem Config — GKJJ Production
// Jalankan: pm2 start deploy/ecosystem.config.cjs

module.exports = {
  apps: [
    // ── Backend API ─────────────────────────────────────────
    {
      name       : 'gkjj-api',
      cwd        : '/var/www/gkjj/apps/api',
      script     : 'dist/index.js',
      interpreter: 'node',
      instances  : 1,
      autorestart: true,
      watch      : false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT    : 4000,
      },
      error_file: '/var/log/pm2/gkjj-api-error.log',
      out_file  : '/var/log/pm2/gkjj-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── Frontend Web ─────────────────────────────────────────
    {
      name       : 'gkjj-web',
      cwd        : '/var/www/gkjj/apps/web',
      script     : 'node_modules/.bin/next',
      args       : 'start -p 3000',
      interpreter: 'none',
      instances  : 1,
      autorestart: true,
      watch      : false,
      max_memory_restart: '700M',
      env: {
        NODE_ENV : 'production',
        PORT     : 3000,
        HOSTNAME : '127.0.0.1',
      },
      error_file: '/var/log/pm2/gkjj-web-error.log',
      out_file  : '/var/log/pm2/gkjj-web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
