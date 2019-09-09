module.exports = {
  // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
  apps : [
    {
      name: 'sensorr:web',
      script: './server/index.js',
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
      name: 'sensorr:refresh',
      cron: '3 1 * * *',
      exec_mode: 'fork',
      autorestart: false,
      script: './bin/exec',
      args: ['./bin/sensorr', 'refresh'],
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
    },
    {
      name: 'sensorr:stalk',
      cron: '3 2 * * *',
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
      cron: '3 3 * * *',
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
    {
      name: 'sensorr:clean',
      cron: '3 4 * * *',
      exec_mode: 'fork',
      autorestart: false,
      script: './bin/exec',
      args: ['./bin/sensorr', 'clean'],
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
    },
  ],
};
