import fs from "fs";
import path from "path";

const rootDir = path.resolve(".");
const ignoreDirs = new Set(["node_modules", ".next", ".git", "backups", "gen", ".system_generated"]);

const replacements = [
  { pattern: /CarBikeDekho\.com/g, replacement: "CarBikeKharido.com" },
  { pattern: /CarBikeDekho\.Com/g, replacement: "CarBikeKharido.Com" },
  { pattern: /CarBikeDekho/g, replacement: "CarBikeKharido" },
  { pattern: /carbikedekho\.com/g, replacement: "carbikekharido.com" },
  { pattern: /carbikedekho/g, replacement: "carbikekharido" },
  { pattern: /CARBIKEDEKHO\.COM/g, replacement: "CARBIKEKHARIDO.COM" },
  { pattern: /CARBIKEDEKHO/g, replacement: "CARBIKEKHARIDO" },
  { pattern: /कारबाइक देखो/g, replacement: "कारबाइक ख़रीदो" },
];

let modifiedCount = 0;

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (
        [".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".css", ".html", ".env", ".example", ".mjs"].includes(ext) ||
        entry.name.startsWith(".env")
      ) {
        if (entry.name === "replace-brand-globally.mjs") continue;
        let content = fs.readFileSync(fullPath, "utf-8");
        let hasChange = false;
        for (const { pattern, replacement } of replacements) {
          if (pattern.test(content)) {
            content = content.replace(pattern, replacement);
            hasChange = true;
          }
        }
        if (hasChange) {
          fs.writeFileSync(fullPath, content, "utf-8");
          console.log(`Updated brand in: ${path.relative(rootDir, fullPath)}`);
          modifiedCount++;
        }
      }
    }
  }
}

processDir(rootDir);
console.log(`Global brand replacement complete! Modified ${modifiedCount} files.`);
