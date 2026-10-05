/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/referees": ["./src/data/*.csv"],
  },
};

export default nextConfig;
