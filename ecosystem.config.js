module.exports = {
  apps: [
    {
      name: 'web-server',
      script: 'web-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        PORT: process.env.PORT || 3000
      }
    },
    {
      name: 'IAMLEGEND',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      // Tuma logs zote kwenye stdout (zitaonekana kwenye Render logs)
      out_file: '/dev/stdout',
      error_file: '/dev/stderr',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};