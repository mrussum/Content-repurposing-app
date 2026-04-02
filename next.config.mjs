/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence Anthropic SDK + Supabase edge warnings
  experimental: { serverComponentsExternalPackages: ['@anthropic-ai/sdk'] },
}

export default nextConfig
