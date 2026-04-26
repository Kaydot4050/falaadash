import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const barrelPath = resolve(__dirname, "../api-zod/src/index.ts");

let content = readFileSync(barrelPath, "utf8");

// Keep only the main Zod schemas export — types and api.schemas are redundant
// since Zod schemas already provide full TypeScript type inference
content = content
  .replace(/\nexport (?:type )?\* from ['"]\.\/generated\/types['"]/g, "")
  .replace(/\nexport (?:type )?\* from ['"]\.\/generated\/api\.schemas['"]/g, "")
  .trimEnd() + "\n";

writeFileSync(barrelPath, content, "utf8");
console.log("Patched api-zod barrel: kept only ./generated/api");
