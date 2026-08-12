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
  webpack: (config) => {
    config.module.rules.push({
      test: /\.tsx?$/,
      exclude: [/UI-REFERENCE/, /magister-extension-project/],
    });
    return config;
  },
};

module.exports = nextConfig;
