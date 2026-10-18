import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const root = process.cwd();
const staging = await mkdtemp(join(tmpdir(), "write-once-markdown-pack-"));

try {
  const manifestValue: unknown = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  if (!isRecord(manifestValue)) throw new Error("The package manifest must be a JSON object.");

  const manifest = manifestValue;
  const files = manifest["files"];
  if (!Array.isArray(files) || !files.every((file) => typeof file === "string")) {
    throw new Error('The package manifest must declare its publishable "files".');
  }

  await Promise.all(
    files.map((file: string) => cp(join(root, file), join(staging, file), { recursive: true })),
  );

  // Releases derive their version from Git tags, so provide a temporary version for npm's pack validation.
  await writeFile(
    join(staging, "package.json"),
    `${JSON.stringify({ ...manifest, version: "0.0.0-pack-check" }, null, 2)}\n`,
  );

  const result = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: staging,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "npm pack validation failed.");
  }

  const packedValue: unknown = JSON.parse(result.stdout);
  if (!Array.isArray(packedValue) || !isRecord(packedValue[0])) {
    throw new Error("npm pack returned an unexpected result.");
  }

  const packedFiles = packedValue[0]["files"];
  if (!Array.isArray(packedFiles) || !packedFiles.every(isRecord)) {
    throw new Error("npm pack did not report its file list.");
  }

  const packedPaths = new Set(
    packedFiles.flatMap((file) => (typeof file["path"] === "string" ? [file["path"]] : [])),
  );
  const required = ["package.json", "README.md", "dist/index.mjs", "dist/index.d.mts"];
  const missing = required.filter((file) => !packedPaths.has(file));

  if (missing.length > 0) {
    throw new Error(`Package is missing required files: ${missing.join(", ")}`);
  }

  process.stdout.write(`Package contents validated (${packedPaths.size} files).\n`);
} finally {
  await rm(staging, { recursive: true, force: true });
}
