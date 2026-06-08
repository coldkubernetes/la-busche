/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/la-busche',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/la-busche',
  },
  experimental: {
    serverComponentsExternalPackages: ['adm-zip', 'papaparse'],
  },
};

export default nextConfig;
