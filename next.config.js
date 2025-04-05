/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  serverExternalPackages: ["mongoose"],
  webpack: (config) => {
    return config;
  },
  images: {
    domains: [
      'via.placeholder.com',
      'placehold.co',
      'placekitten.com',
      'picsum.photos',
      'images.unsplash.com',
      'localhost'
    ],
  },
};

module.exports = nextConfig; 