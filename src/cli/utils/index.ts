import chalk from "chalk";

const log = (...args: any[]) => {
  console.log(chalk`{cyan.bold [electron-kit]}`, ...args);
};

const createLogger = (name: string) => {
  return (...args: any[]) => {
    console.log(
      chalk`{cyan.bold [electron-kit:{magenta.bold ${name}}]}`,
      ...args
    );
  };
};

export { log, createLogger };
