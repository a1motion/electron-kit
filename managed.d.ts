declare type ProcessType = `main` | `renderer` | `crash`;


declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: `development` | `production`;
  }
}

declare var __VERSION__: string;

declare var __PROCESS_KIND__: ProcessType;