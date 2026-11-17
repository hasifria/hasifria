import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp loads its native addon and the libvips shared library at runtime, and file
  // tracing does not always follow that link. Without these files the function fails
  // on Vercel with ERR_DLOPEN_FAILED (libvips-cpp.so not found).
  outputFileTracingIncludes: {
    "/api/books/identify": [
      "node_modules/sharp/**/*",
      "node_modules/@img/sharp-linux-x64/**/*",
      "node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },
};

export default nextConfig;
