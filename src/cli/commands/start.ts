import path from "path";
import express from "express";
import webpack from "webpack";
import devMiddleware from "webpack-dev-middleware";
import hotMiddleware from "webpack-hot-middleware";
import execa from "execa";
import { Options } from "..";
import appPaths, { resolveApp } from "../../config/paths";
import { createLogger } from "../utils";
import removeJunk from "../utils/removeElectronJunk";

const log = createLogger("dev-server");

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
    path.join(appPaths.outputPath, "main.js")
  ) {
    log("Please set 'main' to 'out/main.js' in your 'package.json'.");
    process.exit(1);
    return;
  }

  // log("starting run...");
  // await compile(options);
  const [
    mainConfig,
    preloadConfig,
    rendererConfig,
  ] = require("../../config/webpack.development")(options);

  log("starting dev server...");
  const server = express();
  const mainCompiler = webpack(mainConfig);
  const preloadCompiler = webpack(preloadConfig);
  const rendererCompiler = webpack(rendererConfig);
  const port = getPortOrDefault();

  server.use(
    devMiddleware(rendererCompiler, {
      publicPath: rendererConfig.output?.publicPath!,
      logLevel: "error",
    })
  );

  server.use(
    hotMiddleware(rendererCompiler, {
      //@ts-ignore
      dynamicPublicPath: rendererConfig.output.publicPath,
    })
  );

  server.use(express.static(appPaths.appStatic));

  let electronProcess: execa.ExecaChildProcess<string>;
  let loaded = 0;

  function reloadOrStartElectronProcess() {
    if (loaded !== 7) {
      return;
    }

    if (electronProcess) {
      log("killing existing electron process");
      electronProcess.kill("SIGTERM");
    }

    log("starting electron process");

    electronProcess = execa.command(
      `${resolveApp("node_modules/.bin/electron")} ${appPaths.appPath}`
    );
    electronProcess.stdout?.pipe(removeJunk()).pipe(process.stdout);
    electronProcess.stderr?.pipe(removeJunk()).pipe(process.stderr);
  }

  mainCompiler.watch({}, (err, stats) => {
    if (err) {
      console.error(err);
      process.exit(1);
      return;
    }

    loaded |= 1 << 0;
    reloadOrStartElectronProcess();
  });

  preloadCompiler.watch({}, (err, stats) => {
    if (err) {
      console.error(err);
      process.exit(1);
      return;
    }

    loaded |= 1 << 1;
    reloadOrStartElectronProcess();
  });

  server.listen(port, "localhost", (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
      return;
    }

    loaded |= 1 << 2;

    log(`listening on port: ${port}`);

    reloadOrStartElectronProcess();
  });
}
