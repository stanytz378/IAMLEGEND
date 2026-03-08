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
      watch: false
    }
  ]
};