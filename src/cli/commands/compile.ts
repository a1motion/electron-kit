import fs from "fs-extra";
import webpack from "webpack";
import { Options } from "..";
import appPaths from "../../config/paths";
import { createLogger } from "../utils";

const log = createLogger(`compiler`);

export default function compile(_options: Options): Promise<webpack.Stats> {
  return new Promise((resolve, reject) => {
    log(`compiling...`);
    log(`removing old build...`);
    fs.removeSync(appPaths.outputPath);
    log(`starting webpack build...`);
    const config = require(`../../config/webpack.${
      _options.production ? `production` : `development`
    }.js`);

    webpack(config, (err, stats) => {
      if (err) {
        reject(err);
        return;
      }

      log(`copying static files...`);
      fs.copySync(appPaths.appStatic, appPaths.outputPath, {
        dereference: true,
        filter: (file) => file !== appPaths.appHtml,
      });

      resolve(stats);
      setTimeout(() => {
        log(`done`);
      }, 0);
    });
  });
}
