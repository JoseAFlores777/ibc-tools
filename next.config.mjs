/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: () => [
    {
      source: '/pdf-gen',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store',
        },
      ],
    },
  ],
};

export default nextConfig;
