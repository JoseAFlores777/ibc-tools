/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔹 Necesario para la imagen ligera "standalone" del Dockerfile recomendado
  output: 'standalone',

  // Opcional pero recomendado
  reactStrictMode: true,
  poweredByHeader: false,

  // 🔹 WASM support for Verovio (client-side MusicXML rendering)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
      };
    }
    return config;
  },

  // 🔹 Turbopack handles WASM natively — empty config silences the webpack warning
  turbopack: {},

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
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://analytics.joseiz.com https://atencion.ibchn.org",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https://admin.ibchn.org https://s3.joseiz.com",
            "connect-src 'self' https://admin.ibchn.org https://analytics.joseiz.com https://atencion.ibchn.org",
            "frame-src 'none'",
          ].join('; '),
        },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
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
        protocol: 'https',
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
