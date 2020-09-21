#!/usr/bin/env node
import path from "path";
import yargs from "yargs";
import dotenv from "dotenv";
import { start, compile } from "./commands";
import { resolveApp } from "../config/paths";
import webpack from "webpack";

export interface Options {
  [x: string]: unknown;
  _: string[];
  $0: string;
  production: boolean;
  skipCompile: boolean;
  config: {
    build?: any;
    renderer?: {
      entries?: {
        [key: string]: string;
      };
    };
    preload?: {
      entries?: {
        [key: string]: string;
      };
    };
  };
}

dotenv.config({ path: resolveApp(".electron-kit/.env") });

yargs
  .options({
    production: {
      type: "boolean",
      default: false,
    },
    skipCompile: {
      type: "boolean",
      default: false,
    },
    config: {
      type: "string",
      default: "./electron-kit.config.js",
    },
  })
  .middleware((argv) => {
    try {
      const config = require(path.resolve(argv.config));

      argv.config = config;
    } catch (_e) {
      throw new Error("Missing config file.");
    }
  })
  .middleware((argv) => {
    process.env.NODE_ENV = argv.production ? "production" : "development";
  })
  .command("compile", "", {}, (argv) =>
    compile(argv as Options)
      .then((stats: webpack.Stats) => {
        console.log(
          stats.toString({
            ...webpack.Stats.presetToOptions("minimal"),
            colors: true,
            assets: true,
          })
        );
      })
      .catch((err: any) => {
        console.error(err);
      })
  )
  .command("start", "", {}, (argv) => start(argv as Options))
  .demandCommand()
  .strict()
  .help().argv;
