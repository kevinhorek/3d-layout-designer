/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces `.next/standalone` for Docker / Cloud Run; Vercel ignores this output and deploys as usual.
  output: 'standalone',
  async redirects() {
    return [{ source: '/favicon.ico', destination: '/icons/icon.svg', permanent: true }]
  },
}

module.exports = nextConfig
