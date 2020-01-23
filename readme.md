# electron-kit

Opinionated electron build tool.

Heavily inspired by [desktop/desktop](https://github.com/desktop/desktop) and [react-scripts](https://github.com/facebook/create-react-app)

## File Structure

This project has a few expectations of the file structured used by your app.

Both JavaScript and TypeScript with React is supported everywhere, but we'll use TypeScript in the examples.

Required file structure:

> `preload.ts` is required but can be empty if its not needed.

> All files in static folder will be copied over, and `index.html` will be used as your entry point to your React app.

```text
.electron-kit/
  config.js
src/
  main/
    index.ts
  renderer/
    index.tsx
    preload.ts
  static/
    index.html
```

## Configuration

TODO

## Compile Time Variables

| Name             | Value                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| **VERSION**      | The version of your app, as specified in your `package.json`.                  |
| **PROCESS_KIND** | Used internally, but is set to `main` or `renderer`, depending on the process. |

## Runtime API

| Warning: Electron will be deprecating shared globals between processes, you should instead looking to converting your API to use IPC methods instead. |
| --- |

Electron allows you to import dependencies even inside the renderer, and use this as if you were in the main process. However this tool does not keep `node_modules/` in the final build so this method will longer work.

Instead in your main process you should register your modules to work in the renderer process.

```js
// main
import kit from "electron-kit";
import Store from "electron-store";

const store = new Store();

kit.registerModule("store", store);

// renderer
import kit from "electron-kit";
const store = kit.importModule("store");
```

### Use IPC methods (recommended)

```js
// main
import { ipcMain } from "electron";
import Store from "electron-store";

ipcMain.handle(`store-get`, (e, key, defaultValue) => {
  return store.get(key, defaultValue);
});

ipcMain.handle(`store-set`, (e, key, val) => {
  return store.set(key, val);
});

ipcMain.handle(`store-delete`, (e, key) => {
  return store.delete(key);
});

// renderer
import { ipcRenderer } from "electron";

const store = {
  get(key: string, defaultValue?: string) {
    return ipcRenderer.invoke(`store-get`, key, defaultValue);
  },
  set<T>(key: string, val: T) {
    return ipcRenderer.invoke(`store-set`, key, val);
  },
  delete(key: string) {
    return ipcRenderer.invoke(`store-delete`, key);
  },
};
```


## Typescript

**electron-kit** provides many runtime and compile time utilities. Typescript should pick up the Runtime API by itself. However to get type access to the compile time variables add a `index.d.ts` file to the root of your app and add the following:

```html
/// <reference types="@a1motion/electron-kit/managed" />
```
