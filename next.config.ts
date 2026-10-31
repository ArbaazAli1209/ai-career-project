import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These packages load native binaries / worker files from disk at runtime,
  // so they must not be bundled by Turbopack/webpack.
  serverExternalPackages: [
    "pdf-parse",
    "pdfjs-dist",
    "@napi-rs/canvas",
    "tesseract.js",
    "tesseract.js-core",
  ],
  // Make sure these files are shipped with the serverless function (Vercel).
  outputFileTracingIncludes: {
    "/api/resumes/uploads/[uploadId]/complete": [
      "./eng.traineddata",
      "./node_modules/pdfjs-dist/legacy/build/**",
      "./node_modules/pdfjs-dist/build/**",
      "./node_modules/tesseract.js-core/**",
      "./node_modules/tesseract.js/src/worker-script/**",
      "./node_modules/@napi-rs/canvas*/**",
    ],
  },
};

export default nextConfig;
