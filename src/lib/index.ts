import electron from "electron";

export function registerModule(name: string, mod: any) {
  if (__PROCESS_KIND__ === "main") {
    if (!(<any>global).__ELECTRON_KIT__) {
      (<any>global).__ELECTRON_KIT__ = {};
    }

    (<any>global).__ELECTRON_KIT__[name] = mod;
  } else {
    throw new Error(
      `Cannot call 'registerModule()' inside tbe ${__PROCESS_KIND__} process.`
    );
  }
}

export function importModule(name: string): any {
  if (__PROCESS_KIND__ === "renderer") {
    return electron.remote.getGlobal("__ELECTRON_KIT__")[name];
  }

  throw new Error(
    `Cannot call 'importModule()' inside tbe ${__PROCESS_KIND__} process.`
  );
}

const kit = {
  registerModule,
  importModule,
};

export default kit;
