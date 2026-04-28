import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
        pathname: '/i/teamlogos/**',
      },
      {
        protocol: 'https',
        hostname: 'www.mlbstatic.com',
        pathname: '/team-logos/**',
      },
      {
        protocol: 'https',
        hostname: 'img.mlbstatic.com',
        pathname: '/mlb-photos/**',
      },
    ],
  },
};

export default nextConfig;
