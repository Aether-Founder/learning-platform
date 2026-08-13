/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'learning-platform-beige-pi.vercel.app',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/locales/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/csv',
          },
        ],
      },
    ];
  },
  // Exclude UI-REFERENCE and magister-extension-project folders from build
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.tsx?$/,
      exclude: [/UI-REFERENCE/, /magister-extension-project/],
    });
    
    // Optimize for faster builds
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
            },
          },
        },
      };
    }
    
    return config;
  },
  // Optimize production builds
  swcMinify: true,
  compress: true,
  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
