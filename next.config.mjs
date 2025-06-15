/** @type {import('next').NextConfig} */

// Validate environment variables at build time
if (!process.env.NEXT_PUBLIC_PROJECT_ID) {
  console.warn("Warning: NEXT_PUBLIC_PROJECT_ID environment variable is not set");
}

const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
}

export default nextConfig
