module.exports = {
  // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
  apps : [
    {
      name: 'Sensorr (web server)',
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
      name: 'Sensorr (cron record)',
      cron: '0 17 * * *',
      exec_mode: 'fork',
      script: './bin/job',
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
