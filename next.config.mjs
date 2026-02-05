/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.inaturalist.org',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.net',
      },
    ],
  },
}

export default nextConfig
