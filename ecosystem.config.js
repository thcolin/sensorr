module.exports = {
  // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
  apps : [
    {
      name: 'sensorr:web',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
    },
    {
      name: 'sensorr:record',
      cron: '0 17 * * *',
      exec_mode: 'fork',
      autorestart: false,
      wait_ready: true,
      listen_timeout: 3000,
      script: './bin/exec',
      args: ['./bin/sensorr', 'record', '-a'],
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
    }
  ],
};
