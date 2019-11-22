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
      name: 'sensorr:clean',
      cron: '3 16 * * *',
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
    {
      name: 'sensorr:record',
      cron: '0 17 * * *',
      exec_mode: 'fork',
      autorestart: false,
      script: './bin/exec',
      args: ['./bin/sensorr', 'record'],
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
    },
    {
      name: 'sensorr:schedule',
      cron: '3 1 * * *',
      exec_mode: 'fork',
      autorestart: false,
      script: './bin/exec',
      args: ['./bin/sensorr', 'schedule'],
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
    },
    {
      name: 'sensorr:pairwise',
      cron: '3 3 * * *',
      exec_mode: 'fork',
      autorestart: false,
      script: './bin/exec',
      args: ['./bin/sensorr', 'pairwise'],
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
    },
    {
      name: 'sensorr:hydrate',
      cron: '3 5 * * *',
      exec_mode: 'fork',
      autorestart: false,
      script: './bin/exec',
      args: ['./bin/sensorr', 'hydrate'],
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
    },
  ],
};
