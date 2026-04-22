import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

fs.cpSync(path.join(root, "week5", "integrated"), dist, { recursive: true });
fs.cpSync(path.join(root, "mock"), path.join(dist, "mock"), { recursive: true });
fs.copyFileSync(
  path.join(root, "AI判定基準_仮.md"),
  path.join(dist, "AI判定基準_仮.md")
);
