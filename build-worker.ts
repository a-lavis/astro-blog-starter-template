import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

// Get the git commit hash
const buildId = execSync("git rev-parse --short HEAD").toString().trim();

// Read the worker.ts file
const workerContent = readFileSync("./worker.ts", "utf-8");

// Replace the placeholder with the actual build ID
const modifiedContent = workerContent.replace(
  '"__BUILD_ID_PLACEHOLDER__"',
  `"${buildId}"`
);

// Write to a temporary file
writeFileSync("./worker.build.ts", modifiedContent);

console.log(`✓ Generated worker.build.ts with BUILD_ID: ${buildId}`);
