/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Strip console.* in production to reduce payload and noise
  compiler: {
    ...(process.env.NODE_ENV === "production" && { removeConsole: true }),
  },
  // Optional: use for Docker/standalone deploy (uncomment if needed)
  // output: "standalone",
}

module.exports = nextConfig
