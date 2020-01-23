import fs from "fs-extra";
import webpack from "webpack";
import merge from "webpack-merge";
import TerserPlugin from "terser-webpack-plugin";
import OptimizeCSSAssetsPlugin from "optimize-css-assets-webpack-plugin";
import safePostCssParser from "postcss-safe-parser";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import * as common from "./webpack.common";
import { resolveApp } from "./paths";

const config: webpack.Configuration = {
  mode: `production`,
  devtool: `source-map`,
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8,
          },
          compress: {
            ecma: 6,
            warnings: false,
            comparisons: false,
            inline: 2,
          },
          mangle: {
            safari10: false,
          },
          output: {
            ecma: 6,
            comments: false,
          },
        },
        sourceMap: true,
      }),
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          parser: safePostCssParser,
          map: {
            inline: false,
            annotation: true,
          },
        },
        cssProcessorPluginOptions: {
          preset: [`default`, { minifyFontValues: { removeQuotes: false } }],
        },
      }),
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: `[name].css`,
    }),
  ],
};

const userMainConfigPath = resolveApp(`src/main/webpack.config.js`);
let mainConfig = merge({}, common.main, config, {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: `static`,
      reportFilename: `report.main.html`,
    }),
  ],
});
if (fs.existsSync(userMainConfigPath)) {
  try {
    mainConfig = require(userMainConfigPath)(mainConfig);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

const preloadConfig = merge({}, common.preload, config);

const userRendererConfigPath = resolveApp(`src/renderer/webpack.config.js`);
let rendererConfig = merge({}, common.renderer, config);
if (fs.existsSync(userRendererConfigPath)) {
  try {
    rendererConfig = require(userRendererConfigPath)(rendererConfig);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

export = [mainConfig, preloadConfig, rendererConfig];
