import { components }            from './default/index.js';
import { components as chrome }  from './chrome/index.js';

/**
 * The layouts available for the color picker.
 *
 * @type {{default: PickerComponents, chrome: PickerComponents}}
 */
export const layout = {
   default: components,
   chrome
}
