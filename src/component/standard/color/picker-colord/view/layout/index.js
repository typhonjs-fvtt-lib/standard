import { components }            from './default/index.js';
import { components as chrome }  from './chrome/index.js';

/**
 * The layouts available for the color picker.
 *
 * @type {{default: import('../../').TJSColordPickerComponents, chrome: import('../../').TJSColordPickerComponents}}
 */
export const layout = {
   default: components,
   chrome
};
