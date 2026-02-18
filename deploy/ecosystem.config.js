module.exports = {
  apps: [
    {
      name: 'pixzen-api',
      script: '/www/wwwroot/pixzen-api/dist/index.js',
      cwd: '/www/wwwroot/pixzen-api',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3334,
      },
      error_file: '/root/.pm2/logs/pixzen-api-error.log',
      out_file: '/root/.pm2/logs/pixzen-api-out.log',
      time: true,
      max_memory_restart: '512M',
      restart_delay: 3000,
    },
    {
      name: 'pixzen-whatsapp-ai',
      script: '/www/wwwroot/pixzen-whatsapp-ai/dist/index.js',
      cwd: '/www/wwwroot/pixzen-whatsapp-ai',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3333,
      },
      error_file: '/root/.pm2/logs/pixzen-whatsapp-error.log',
      out_file: '/root/.pm2/logs/pixzen-whatsapp-out.log',
      time: true,
      max_memory_restart: '512M',
      restart_delay: 3000,
    },
  ],
};
