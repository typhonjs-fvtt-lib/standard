import { StyleManager } from '@typhonjs-svelte/lib/util';

const s_STYLE_KEY = '#__tjs-root-styles';

const cssVariables = new StyleManager({ docKey: s_STYLE_KEY, version: 1 });

export { cssVariables };
