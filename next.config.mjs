/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔹 Necesario para la imagen ligera "standalone" del Dockerfile recomendado
  output: 'standalone',

  // Opcional pero recomendado
  reactStrictMode: true,
  poweredByHeader: false,

  // 🔹 Security headers + cache control
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
      ],
    },
    {
      source: '/pdf-gen',
      headers: [
        { key: 'Cache-Control', value: 'no-store' },
      ],
    },
  ],

  // 🔸 Si sirves imágenes/archivos desde tu instancia de Directus, habilita el host:
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'admin.ibchn.org'
      },
      {
        protocol: 'http',
        hostname: 'fonts.gstatic.com'
      },
      {
        protocol: 'https',
        hostname: 's3.joseiz.com'
      },
    ],
  },
};

export default nextConfig;
