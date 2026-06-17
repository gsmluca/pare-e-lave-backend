import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin para resolver aliases do TypeScript
const aliasPlugin = {
  name: "alias",
  setup(build) {
    build.onResolve({ filter: /^@shared\// }, (args) => {
      const newPath = path.join(__dirname, args.path.replace("@shared", "shared"));
      return { path: newPath };
    });
  },
};

esbuild
  .build({
    entryPoints: ["server/_core/index.ts"],
    bundle: true,
    platform: "node",
    packages: "external",
    format: "esm",
    outdir: "dist",
    plugins: [aliasPlugin],
  })
  .catch(() => process.exit(1));
