/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ["mongoose", "mongodb"]
  },
  webpack: (config, { isServer }) => {
    // Add rule for .node files
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
      type: 'javascript/auto',
    });

    if (!isServer) {
      // Don't attempt to import these server-side modules on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        child_process: false,
        os: false,
        path: false,
        stream: require.resolve('stream-browserify'),
        crypto: require.resolve('crypto-browserify'),
        buffer: require.resolve('buffer/'),
      };

      // Add polyfill plugins
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        }),
      );
    }

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