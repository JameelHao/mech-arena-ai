/**
 * Custom Node.js loader that stubs non-JS asset imports (e.g. .png)
 * so tests can import modules that reference asset files.
 */
const ASSET_EXTS = /\.(png|jpg|jpeg|gif|svg|webp|ico)$/;

export function resolve(specifier, context, nextResolve) {
  if (ASSET_EXTS.test(specifier)) {
    return { shortCircuit: true, url: new URL(specifier, context.parentURL).href };
  }
  return nextResolve(specifier, context);
}

export function load(url, context, nextLoad) {
  if (ASSET_EXTS.test(url)) {
    // Return the file path as the default export (mimics Vite behavior)
    const path = new URL(url).pathname;
    return {
      shortCircuit: true,
      format: "module",
      source: `export default ${JSON.stringify(path)};`,
    };
  }
  return nextLoad(url, context);
}
