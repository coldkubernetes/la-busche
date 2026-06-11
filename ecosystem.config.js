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
      // The parsed Sofia GTFS dataset sits at ~341MB in memory. Node's default
      // heap ceiling on this ~960MB box auto-sizes to ~360MB, leaving almost no
      // room — any request that allocates a little more OOM-kills the process.
      // 512MB clears the dataset with headroom while keeping RSS inside RAM.
      NODE_OPTIONS: '--max-old-space-size=512',
    },
  }],
};
