/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    typedRoutes: true,
    scrollRestoration: true,
  },
  pageExtensions: ['page.tsx', 'page.ts', 'app.tsx', 'app.ts', 'api.ts'],
}

export default nextConfig
