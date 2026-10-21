// Test-only module hooks for `node --test`. The package source is consumed untranspiled
// by bundlers (Next, Vite), so it imports JSON without import attributes and local
// modules without extensions. Node's ESM loader needs both; these hooks bridge that for
// the tests only. Nothing here ships to consumers.
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";

const RELATIVE = /^\.{1,2}\//;
const HAS_EXTENSION = /\.(?:[cm]?[jt]s|json)$/;

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (error?.code === "ERR_MODULE_NOT_FOUND" && RELATIVE.test(specifier) && !HAS_EXTENSION.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && url.endsWith(".json")) {
      const source = readFileSync(new URL(url), "utf8");
      return { format: "module", source: `export default ${source};`, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
