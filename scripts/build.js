// This script improves build performance by managing memory more efficiently
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require("child_process");

// Configure memory settings based on available system memory
const memoryLimit = 4096; // MB - adjust based on your system

try {
  console.log("🚀 Starting optimized Next.js build process");

  // Clean cache if needed
  console.log("🧹 Cleaning Next.js cache");
  execSync("rm -rf .next", { stdio: "inherit" });

  // Run the build with increased memory limit
  console.log(`💾 Building with ${memoryLimit}MB memory limit`);
  execSync(`NODE_OPTIONS="--max-old-space-size=${memoryLimit}" next build`, {
    stdio: "inherit",
    env: { ...process.env },
  });

  console.log("✅ Build completed successfully");
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}
