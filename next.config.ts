// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  //output: "export", // ❌ Server Actions are not supported with static export. Disable this to allow builds with actions.
  images: {
    unoptimized: true, // Required for some hosting providers
  },
  sassOptions: {
    additionalData: `$var: red;`,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
