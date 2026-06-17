import { rmSync } from "node:fs";
import { join } from "node:path";

const devCache = join(process.cwd(), ".next", "dev");

try {
  rmSync(devCache, { recursive: true, force: true });
  console.log("Removed .next/dev");
} catch (error) {
  console.warn("Could not remove .next/dev:", error);
}
