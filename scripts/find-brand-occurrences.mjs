import fs from "fs";
import path from "path";

const rootDir = path.resolve(".");
const ignoreDirs = new Set(["node_modules", ".next", ".git", "backups", "gen", "public"]);

function searchDir(dir, matches = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchDir(fullPath, matches);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if ([".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".css", ".html", ".env", ".example"].includes(ext) || entry.name.startsWith(".env")) {
        const content = fs.readFileSync(fullPath, "utf-8");
        if (/carbikekharido/i.test(content)) {
          matches.push({ file: path.relative(rootDir, fullPath) });
        }
      }
    }
  }
  return matches;
}

const results = searchDir(rootDir);
console.log(JSON.stringify(results, null, 2));
