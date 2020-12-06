import fs from "fs-extra";
import webpack from "webpack";
import { Options } from "..";
import appPaths, { resolveApp } from "../../config/paths";
import { createLogger } from "../utils";

const log = createLogger("compiler");

function getEntryPointTemplates(options: Options) {
  return ["index"]
    .concat(Object.keys(options?.config?.renderer?.entries ?? {}))
    .map((value) => resolveApp(`src/static/${value}.html`));
}

export default function compile(_options: Options): Promise<webpack.Stats> {
  return new Promise((resolve, reject) => {
    log("compiling...");
    log("removing old build...");
    fs.removeSync(appPaths.outputPath);
    log("starting webpack build...");
    const config = require(`../../config/webpack.${
      _options.production ? "production" : "development"
    }.js`)(_options);

    webpack(config, (err, stats) => {
      if (err) {
        reject(err);
        return;
      }

      log("copying static files...");
      const templates = getEntryPointTemplates(_options);
      fs.copySync(appPaths.appStatic, appPaths.outputPath, {
        dereference: true,
        filter: (file) => !templates.includes(file),
      });

      resolve(stats!);
      setTimeout(() => {
        log("done");
      }, 0);
    });
  });
}
