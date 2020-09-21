import path from "path";

export interface BabelPresetEnvOptions {
  targets?: string | string[] | { [key: string]: string };
  useBuiltIns?: "usage" | "entry" | false;
  corejs?: 2 | 3 | { version: 2 | 3; proposals: boolean };
  modules?: boolean;
  exclude?: string[];
  compact?: boolean | "auto";
}

const absoluteRuntimePath = path.dirname(
  require.resolve("@babel/runtime/package.json")
);

const babelOptions = (processType: ProcessType) => {
  const envOptions: BabelPresetEnvOptions = {
    targets: {
      node: "current",
    },
    useBuiltIns: "usage",
    corejs: 3,
    modules: false,
  };

  if (processType !== "main") {
    envOptions.targets = "chrome 69";
  }

  return {
    presets: [
      [require("@babel/preset-env").default, envOptions],
      [
        require("@babel/preset-react").default,
        {
          development: process.env.NODE_ENV === "development",
        },
      ],
      require("@babel/preset-typescript").default,
    ],
    plugins: [
      require("babel-plugin-macros"),
      require("@babel/plugin-proposal-optional-chaining").default,
      [
        require("@babel/plugin-transform-destructuring").default,
        {
          // Use loose mode for performance:
          // https://github.com/facebook/create-react-app/issues/5602
          loose: false,
          selectiveLoose: [
            "useState",
            "useEffect",
            "useContext",
            "useReducer",
            "useCallback",
            "useMemo",
            "useRef",
            "useImperativeHandle",
            "useLayoutEffect",
            "useDebugValue",
          ],
        },
      ],
      [
        require("@babel/plugin-proposal-class-properties").default,
        {
          loose: true,
        },
      ],
      [
        require("@babel/plugin-transform-runtime").default,
        {
          corejs: false,
          helpers: true,
          // By default, babel assumes babel/runtime version 7.0.0-beta.0,
          // explicitly resolving to match the provided helper functions.
          // https://github.com/babel/babel/issues/10261
          version: require("@babel/runtime/package.json").version,
          regenerator: true,
          // https://babeljs.io/docs/en/babel-plugin-transform-runtime#useesmodules
          // We should turn this on once the lowest version of Node LTS
          // supports ES Modules.
          useESModules: true,
          // Undocumented option that lets us encapsulate our runtime, ensuring
          // the correct version is used
          // https://github.com/babel/babel/blob/090c364a90fe73d36a30707fc612ce037bdbbb24/packages/babel-plugin-transform-runtime/src/index.js#L35-L42
          absoluteRuntime: absoluteRuntimePath,
        },
      ],
      require("@babel/plugin-syntax-dynamic-import").default,
    ],
    sourceMaps: true,
  };
};

export default babelOptions;
