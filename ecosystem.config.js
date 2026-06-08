module.exports = {
  apps: [{
    name: 'la-busche',
    script: 'npm',
    args: 'start',
    cwd: '/home/ubuntu/la-busche',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      NEXT_PUBLIC_BASE_PATH: '/la-busche',
    },
  }],
};
