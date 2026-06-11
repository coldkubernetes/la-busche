/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  experimental: {
    serverComponentsExternalPackages: ['adm-zip', 'papaparse'],
    instrumentationHook: true,
  },
};

export default nextConfig;
