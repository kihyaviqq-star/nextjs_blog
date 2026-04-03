import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

function getAllowedImageHosts(): string[] {
  const defaultHosts = ["image.pollinations.ai", "openrouter.ai"];
  const fromEnv = (process.env.ALLOWED_IMAGE_HOSTS || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set([...defaultHosts, ...fromEnv]));
}

const allowedImageHosts = getAllowedImageHosts();

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  // Увеличиваем таймаут для длительных операций (AI парсинг может занимать до 90 секунд)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Увеличенный лимит для body
    },
  },
  images: {
    remotePatterns: [
      ...allowedImageHosts.map((hostname) => ({
        protocol: "https" as const,
        hostname,
      })),
      ...(isDev
        ? [
            {
              protocol: "http" as const,
              hostname: "localhost",
            },
          ]
        : []),
    ],
    // В продакшене можно отключить оптимизацию для локальных файлов
    unoptimized: false,
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Разрешить загрузку изображений из /uploads
    domains: [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'self';"
          }
        ]
      }
    ]
  }
};

export default nextConfig;
