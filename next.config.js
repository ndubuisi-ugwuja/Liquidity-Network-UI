/** @type {import('next').NextConfig} */
const nextConfig = {
    // Explicitly disable turbopack
    experimental: {
        turbo: undefined,
    },
};

module.exports = nextConfig;
