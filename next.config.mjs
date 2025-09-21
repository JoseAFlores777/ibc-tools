/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔹 Necesario para la imagen ligera "standalone" del Dockerfile recomendado
  output: 'standalone',

  // Opcional pero recomendado
  reactStrictMode: true,
  poweredByHeader: false,

  // 🔹 Asegura que /pdf-gen no se cachee (debe ser async)
  headers: async () => [
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
        protocol: 'http',
        hostname: 'ibc-directus-917c1c-31-97-132-201.traefik.me'
      },
      {
        protocol: 'https',
        hostname: 'admin.ibchn.org'
      },
      {
       protocol: 'https',
       hostname: 'ibchn.org'
      }
      // Si usas HTTPS o otro dominio, agrégalo aquí.
    ],
  },

  // (Opcional) Si quieres “hornear” valores en build desde variables de entorno,
  // puedes mapearlas aquí. OJO: siguen siendo de build-time.
  // env: {
  //   NEXT_PUBLIC_DIRECTUS_URL: process.env.NEXT_PUBLIC_DIRECTUS_URL,
  // },

  // (Opcional) Si usas rutas tipadas / mejoras de DX
  // experimental: { typedRoutes: true },
};

export default nextConfig;