import webpack from "webpack";
import merge from "webpack-merge";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import postcssNormalize from "postcss-normalize";
import appPaths, { extensions, resolveApp } from "./paths";
import babelOptions from "./babel";
import babelOptionsForDeps from "./babelDeps";

const cssRegex = /\.css$/;
const sassRegex = /\.(scss|sass)$/;
const lessRegex = /\.(less)$/;

const getStyleLoaders = (cssOptions: any, preProcessor?: any) => {
  const loaders: any = [
    process.env.NODE_ENV === "development" && require.resolve("style-loader"),
    process.env.NODE_ENV === "production" && {
      loader: MiniCssExtractPlugin.loader,
      options: {},
    },
    {
      loader: require.resolve("css-loader"),
      options: cssOptions,
    },
    {
      loader: require.resolve("postcss-loader"),
      options: {
        indent: "postcss",
        plugins: () => [
          require("postcss-preset-env")({
            autoprefixer: {
              flexbox: "no-2009",
            },
            stage: 3,
          }),
          postcssNormalize(),
        ],
      },
    },
  ].filter(Boolean);
  if (preProcessor) {
    loaders.push(
      {
        loader: require.resolve("resolve-url-loader"),
        options: {
          sourceMap: process.env.NODE_ENV === "production",
        },
      },
      {
        loader: require.resolve(preProcessor),
        options: {
          sourceMap: true,
        },
      }
    );
  }

  return loaders;
};

const commonConfig: (processType: ProcessType) => webpack.Configuration = (
  processType
) => ({
  context: appPaths.appPath,
  output: {
    filename: "[name].js",
    path: appPaths.outputPath,
    publicPath: "./",
    globalObject: processType === "main" ? "global" : "window",
  },
  module: {
    strictExportPresence: true,
    rules: [
      {
        test: /\.(js, jsx)$/,
        enforce: "pre",
        use: require.resolve("source-map-loader"),
      },
      {
        oneOf: [
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve("url-loader"),
            options: {
              limit: 10000,
              name: "static/[name].[hash:8].[ext]",
            },
          },
          {
            test: /\.node$/,
            use: require.resolve("node-loader"),
          },
          {
            test: /\.(js|mjs|jsx|ts|tsx)$/,
            include: appPaths.appSrc,
            loader: require.resolve("babel-loader"),
            options: babelOptions(processType),
          },
          {
            test: /\.(js|mjs)$/,
            exclude: /@babel(?:\/|\\{1,2})runtime/,
            loader: require.resolve("babel-loader"),
            options: babelOptionsForDeps(processType),
          },
          {
            test: cssRegex,
            use: getStyleLoaders({
              importLoaders: 1,
              sourceMap: process.env.NODE_ENV === "production",
            }),
            sideEffects: true,
          },
          {
            test: sassRegex,
            use: getStyleLoaders(
              {
                importLoaders: 2,
                sourceMap: process.env.NODE_ENV === "production",
              },
              "sass-loader"
            ),
            sideEffects: true,
          },
          {
            test: lessRegex,
            use: getStyleLoaders(
              {
                importLoaders: 2,
                sourceMap: process.env.NODE_ENV === "production",
              },
              "less-loader"
            ),
            sideEffects: true,
          },
          {
            loader: require.resolve("file-loader"),
            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
            options: {
              name: "static/[name].[hash:8].[ext]",
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.DefinePlugin({
      __PROCESS_KIND__: JSON.stringify(processType),
      __VERSION__: JSON.stringify(require(appPaths.appPackageJson).version),
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "development"
      ),
    }),
  ],
  resolve: {
    extensions,
    modules: ["node_modules", appPaths.appNodeModules],
  },
  node: {
    __dirname: false,
    __filename: false,
    global: true,
  },
  cache: true,
});

export const main = merge({}, commonConfig("main"), {
  name: "main",
  entry: {
    main: appPaths.appMainJs,
  },
  target: "electron-main",
});
export const preload = merge({}, commonConfig("renderer"), {
  name: "preload",
  entry: {
    preload: appPaths.appPreloadJs,
  },
  target: "electron-preload" as any,
});
/**
 * TODO: add easier support for adding new entries
 */
export const renderer = merge({}, commonConfig("renderer"), {
  name: "renderer",
  entry: {
    renderer: appPaths.appRendererJs,
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: resolveApp("src/static/index.html"),
      chunks: ["renderer"],
    }),
  ],
  target: "electron-renderer",
});
