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
      script: './bin/exec',
      args: ['./bin/sensorr', 'record', '-a'],
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
    },
    {
      name: 'sensorr:stalk',
      cron: '0 0 * * *',
      exec_mode: 'fork',
      autorestart: false,
      script: './bin/exec',
      args: ['./bin/sensorr', 'stalk'],
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
    },
    {
      name: 'sensorr:sync',
      cron: '0 1 * * *',
      exec_mode: 'fork',
      autorestart: false,
      script: './bin/exec',
      args: ['./bin/sensorr', 'sync'],
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
    },
  ],
};
