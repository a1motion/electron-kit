import path from "path";
import fs from "fs";

const appDirectory = fs.realpathSync(process.cwd());

export const extensions = [`.ts`, `.tsx`, `.js`, `.jsx`, `.json`];
export const resolveApp = (relativePath: string) =>
  path.resolve(appDirectory, relativePath);
export const resolveModule = (
  resolveFn: (resolvePath: string) => string,
  filePath: string
) => {
  const extension = extensions.find((extension) =>
    fs.existsSync(resolveFn(`${filePath}${extension}`))
  );

  if (extension) {
    return resolveFn(`${filePath}${extension}`);
  }

  return resolveFn(`${filePath}.js`);
};

const appPaths = {
  outputPath: resolveApp(`out`),
  appPath: resolveApp(`.`),
  appPackageJson: resolveApp(`package.json`),
  appNodeModules: resolveApp(`node_modules`),
  appSrc: resolveApp(`src`),
  appMainJs: resolveModule(resolveApp, `src/main/index`),
  appRendererJs: resolveModule(resolveApp, `src/renderer/index`),
  appPreloadJs: resolveModule(resolveApp, `src/renderer/preload`),
  appHtml: resolveApp(`src/static/index.html`),
  appStatic: resolveApp(`src/static`),
  distPath: resolveApp(`dist`),
  distStatic: resolveApp(`dist/static`),
};

export default appPaths;
