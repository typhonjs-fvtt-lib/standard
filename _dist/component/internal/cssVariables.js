import { StyleManager } from './StyleManager.js';

const s_STYLE_KEY = '#__tjs-root-styles';

const cssVariables = new StyleManager({ docKey: s_STYLE_KEY });

export { cssVariables };