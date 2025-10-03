/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['api.medical-force.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig