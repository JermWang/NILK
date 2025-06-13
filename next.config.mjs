/** @type {import('next').NextConfig} */

// Validate environment variables at build time
if (!process.env.NEXT_PUBLIC_PROJECT_ID) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_PROJECT_ID");
}

const nextConfig = {}

export default nextConfig
