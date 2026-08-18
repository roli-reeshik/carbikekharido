import fs from "fs";
import path from "path";

const rootDir = path.resolve(".");
const ignoreDirs = new Set(["node_modules", ".next", ".git", "backups", "gen", ".system_generated", "scripts"]);

function checkRemaining(dir, found = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      checkRemaining(fullPath, found);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if ([".ts", ".tsx", ".json", ".md", ".html"].includes(ext)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        // Check for CarBikeDekho specifically
        const matches = content.match(/carbikedekho/gi);
        if (matches) {
          found.push({ file: path.relative(rootDir, fullPath), count: matches.length });
        }
      }
    }
  }
  return found;
}

console.log("Remaining carbikedekho occurrences in project:", checkRemaining(rootDir));
