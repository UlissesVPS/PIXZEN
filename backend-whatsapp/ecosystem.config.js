module.exports = {
  apps: [{
    name: 'pixzen-whatsapp-ai',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3333
    },
    error_file: '/var/log/pixzen-whatsapp-ai/error.log',
    out_file: '/var/log/pixzen-whatsapp-ai/out.log',
    log_file: '/var/log/pixzen-whatsapp-ai/combined.log',
    time: true
  }]
};
