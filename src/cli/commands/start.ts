import path from "path";
import express from "express";
import webpack from "webpack";
import devMiddleware from "webpack-dev-middleware";
import hotMiddleware from "webpack-hot-middleware";
import execa from "execa";
import { Options } from "..";
import compile from "./compile";
import appPaths, { resolveApp } from "../../config/paths";
import { createLogger } from "../utils";
import removeJunk from "../utils/removeElectronJunk";

const log = createLogger(`dev-server`);

const getPortOrDefault = () => {
  const port = process.env.PORT;
  if (port) {
    const result = parseInt(port);
    if (isNaN(result)) {
      throw new Error(`Unable to parse '${port}' into valid number`);
    }

    return result;
  }

  return 3000;
};

export default async function run(options: Options) {
  const userPackageJson = require(appPaths.appPackageJson);

  if (
    path.resolve(appPaths.appPath, userPackageJson.main) !==
    path.join(appPaths.outputPath, `main.js`)
  ) {
    log(`Please set 'main' to 'out/main.js' in your 'package.json'.`);
    process.exit(1);
    return;
  }

  log(`starting run...`);
  await compile(options);
  const [, , rendererConfig] = require(`../../config/webpack.development`);

  log(`starting dev server...`);
  const server = express();
  const compiler = webpack(rendererConfig);
  const port = getPortOrDefault();

  server.use(
    devMiddleware(compiler, {
      publicPath: rendererConfig.output?.publicPath!,
      logLevel: `error`,
    })
  );

  server.use(
    hotMiddleware(compiler, {
      dynamicPublicPath: rendererConfig.output.publicPath,
    })
  );

  server.listen(port, `localhost`, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
      return;
    }

    log(`listening on port: ${port}`);

    const app = execa.command(
      `${resolveApp(`node_modules/.bin/electron`)} ${appPaths.appPath}`
    );
    app.stdout?.pipe(removeJunk()).pipe(process.stdout);
    app.stderr?.pipe(removeJunk()).pipe(process.stderr);
  });
}
