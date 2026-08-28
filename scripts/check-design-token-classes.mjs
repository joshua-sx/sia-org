import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const sourceRoot = path.resolve("src");
const excludedDirectories = [
  path.join(sourceRoot, "components", "ui"),
  path.join(sourceRoot, "components", "landing"),
];
const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
const forbiddenClassFragment = "[hsl(var(";

function isExcluded(filePath) {
  return excludedDirectories.some(
    (directory) => filePath === directory || filePath.startsWith(`${directory}${path.sep}`),
  );
}

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (isExcluded(entryPath)) continue;

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(entryPath)));
    } else if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

const violations = [];

for (const filePath of await collectSourceFiles(sourceRoot)) {
  const lines = (await readFile(filePath, "utf8")).split(/\r?\n/u);

  lines.forEach((line, index) => {
    if (line.includes(forbiddenClassFragment)) {
      violations.push(`${path.relative(process.cwd(), filePath)}:${index + 1}`);
    }
  });
}

if (violations.length > 0) {
  console.error(
    [
      "Use named design-token utilities instead of arbitrary [hsl(var(...))] classes:",
      ...violations.map((violation) => `  ${violation}`),
    ].join("\n"),
  );
  process.exitCode = 1;
}
