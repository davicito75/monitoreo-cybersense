module.exports = {
  apps: [
    {
      name: 'monitoreo-server',
      script: './dist/app.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        HOST: '172.16.2.3',
        PORT: 3008,
        DATABASE_URL: 'file:./prisma/dev.db',
        JWT_SECRET: 'monitoreo_secret_please_change',
        PUSHBULLET_ENABLED: 'true',
        PUSHBULLET_TOKEN: 'o.P8lspM3JdkZjc2jvzbfOHNHPUJQDPrBi',
      }
    }
  ]
};
