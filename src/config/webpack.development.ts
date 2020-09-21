import fs from "fs";
import webpack from "webpack";
import merge from "webpack-merge";
import * as common from "./webpack.common";
import { resolveApp } from "./paths";
import { Options } from "../cli";

const config: webpack.Configuration = {
  mode: "development",
  devtool: "cheap-module-source-map",
};

const userMainConfigPath = resolveApp("src/main/webpack.config.js");
let mainConfig = (userConfig: Options) =>
  merge({}, common.main(userConfig), config);
if (fs.existsSync(userMainConfigPath)) {
  try {
    mainConfig = require(userMainConfigPath)(mainConfig);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

const preloadConfig = (userConfig: Options) =>
  merge({}, common.preload(userConfig), config);

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

const port = getPortOrDefault();
const webpackHotModuleReloadUrl = `?path=http://localhost:${port}/__webpack_hmr`;

const userRendererConfigPath = resolveApp("src/renderer/webpack.config.js");
const rendererConfig = (userConfig: Options) => {
  const commonRendererConfig = common.renderer(userConfig);
  const entries = Object.entries(commonRendererConfig.entry as any).reduce(
    (obj: { [key: string]: string[] }, [name, value]: any) => {
      obj[name] = [
        require.resolve("webpack-hot-middleware/client") +
          webpackHotModuleReloadUrl,
      ].concat(Array.isArray(value) ? value : [value]);
      return obj;
    },
    {}
  );
  let _rendererConfig = merge({}, common.renderer(userConfig), config, {
    entry: entries,
    output: {
      publicPath: `http://localhost:${port}/`,
    },
    plugins: [new webpack.HotModuleReplacementPlugin()],
  });
  if (fs.existsSync(userRendererConfigPath)) {
    try {
      _rendererConfig = require(userRendererConfigPath)(_rendererConfig);
    } catch (e) {
      console.log(e);
      process.exit(1);
    }
  }

  return _rendererConfig;
};

export = (userConfig: Options) => [
  mainConfig(userConfig),
  preloadConfig(userConfig),
  rendererConfig(userConfig),
];
