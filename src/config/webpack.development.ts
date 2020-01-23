import fs from "fs";
import webpack from "webpack";
import merge from "webpack-merge";
import * as common from "./webpack.common";
import { resolveApp } from "./paths";

const config: webpack.Configuration = {
  mode: `development`,
  devtool: `cheap-module-source-map`,
};

const userMainConfigPath = resolveApp(`src/main/webpack.config.js`);
let mainConfig = merge({}, common.main, config);
if (fs.existsSync(userMainConfigPath)) {
  try {
    mainConfig = require(userMainConfigPath)(mainConfig);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

const preloadConfig = merge({}, common.preload, config);

const getRendererEntryPoint = () => {
  const entry = common.renderer.entry as webpack.Entry;
  if (!entry) {
    throw new Error(
      `Unable to resolve entry point. Check webpack.common.ts and try again`
    );
  }

  return entry.renderer as string;
};

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

const userRendererConfigPath = resolveApp(`src/renderer/webpack.config.js`);
let rendererConfig = merge({}, common.renderer, config, {
  entry: {
    renderer: [
      require.resolve(`webpack-hot-middleware/client`) +
        webpackHotModuleReloadUrl,
      getRendererEntryPoint(),
    ],
  },
  output: {
    publicPath: `http://localhost:${port}/`,
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
});
if (fs.existsSync(userRendererConfigPath)) {
  try {
    rendererConfig = require(userRendererConfigPath)(rendererConfig);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

export = [mainConfig, preloadConfig, rendererConfig];
