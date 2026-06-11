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
      // The parsed Sofia GTFS dataset sits at ~341MB steady-state, but parsing
      // it (raw CSV text + PapaParse intermediates + temporary Sets) peaks at
      // ~510MB. Node's default heap on this ~960MB box auto-sizes to ~360MB, so
      // even a single load OOM-killed the process. 768MB clears the parse peak
      // with margin; steady-state RSS stays ~420MB, well inside RAM (+2GB swap).
      NODE_OPTIONS: '--max-old-space-size=768',
    },
  }],
};
