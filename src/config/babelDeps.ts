import { BabelPresetEnvOptions } from "./babel";

const babelOptionsForDeps = (processType: ProcessType) => {
  const envOptions: BabelPresetEnvOptions = {
    targets: {
      node: "current",
    },
    useBuiltIns: "usage",
    corejs: 3,
    modules: false,
    exclude: ["transform-typeof-symbol"],
  };

  if (processType !== "main") {
    envOptions.targets = "chrome 69";
  }

  return {
    sourceType: "unambiguous",
    presets: [[require("@babel/preset-env").default, envOptions]],
    plugins: [
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
      require("@babel/plugin-syntax-dynamic-import").default,
    ],
  };
};

export default babelOptionsForDeps;
