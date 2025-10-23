/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'obscloud.ulearning.cn',
        port: '',
        pathname: '/resources/web/**',
      },
    ],
    // 启用图片缓存
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30天缓存
    // 图片格式优化
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
