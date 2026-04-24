declare module '/Users/vilius/.local/share/fnm/node-versions/v22.22.1/installation/lib/node_modules/openclaw/dist/plugin-entry-BfGzk0Q0.js' {
  import type { OpenClawPluginApi } from '/Users/vilius/.local/share/fnm/node-versions/v22.22.1/installation/lib/node_modules/openclaw/dist/plugin-sdk/src/plugin-sdk/plugin-entry.d.ts';

  export type DefinePluginEntryOptions = {
    id: string;
    name: string;
    description: string;
    kind?: string;
    register: (api: OpenClawPluginApi) => void;
  };

  export function definePluginEntry<T extends DefinePluginEntryOptions>(entry: T): T;
}
