import { TJSStyleManager } from '@typhonjs-svelte/lib/util';

const s_STYLE_KEY = '#__tjs-root-styles';

const cssVariables = new TJSStyleManager({ docKey: s_STYLE_KEY, version: 1 });

export { cssVariables };
