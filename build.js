import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin para resolver aliases do TypeScript
const aliasPlugin = {
  name: "alias",
  setup(build) {
    // Resolver @shared/* para shared/*
    build.onResolve({ filter: /^@shared\// }, (args) => {
      const newPath = path.join(__dirname, args.path.replace("@shared", "shared"));
      return { path: newPath };
    });
  },
};

// Copiar pasta shared para dist antes do build
const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copiar shared/ para dist/shared/
const sharedSrc = path.join(__dirname, "shared");
const sharedDest = path.join(distDir, "shared");
if (fs.existsSync(sharedSrc)) {
  if (fs.existsSync(sharedDest)) {
    fs.rmSync(sharedDest, { recursive: true });
  }
  fs.cpSync(sharedSrc, sharedDest, { recursive: true });
}

esbuild
  .build({
    entryPoints: ["server/_core/index.ts"],
    bundle: true,
    platform: "node",
    packages: "external",
    format: "esm",
    outdir: "dist",
    plugins: [aliasPlugin],
    logLevel: "info",
  })
  .catch(() => process.exit(1));
