module.exports = {
  apps: [
    {
      name: 'caninap',
      script: 'npm',
      args: 'start',
      cwd: __dirname,
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
      },
      max_memory_restart: '512M',
    },
    {
      name: 'caninap-poller',
      script: 'npx',
      args: 'tsx scripts/poll-live.ts',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '256M',
    },
    {
      name: 'caninap-cron',
      script: 'npx',
      args: 'tsx scripts/cron-fetch.ts',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '256M',
    },
  ],
};
