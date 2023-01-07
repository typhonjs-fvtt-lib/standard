export { default as TJSMenu }          from './TJSMenu.svelte';
export { default as TJSContextMenu }   from './context/TJSContextMenu.svelte';

/**
 * @typedef {object} TJSMenuData
 *
 * @property {Iterable<TJSMenuItemData>} [items] -
 *
 * @property {{ x?: number, y?: number }} [offset] -
 *
 * @property {Record<string, string>}   [styles] -
 *
 * @property {Function}  [efx] -
 *
 * @property {string}  [keyCode='Enter'] -
 *
 * @property {{ duration: number, easing: Function }}  [transitionOptions={ duration: 200, easing: quintOut }] -
 */

/**
 * @typedef {object} TJSMenuItemData
 *
 * @property {Function} [callback] - A single callback function to invoke. onPress -> callback -> onClick -> onclick
 * @property {Function} [onclick] - A single callback function to invoke. onPress -> callback -> onClick -> onclick
 * @property {Function} [onClick] - A single callback function to invoke. onPress -> callback -> onClick -> onclick
 * @property {Function} [onPress] - A single callback function to invoke. onPress -> callback -> onClick -> onclick
 *
 * @property {boolean|Function} [condition] - If a boolean and false or a function that invoked returns a falsy value
 *                                            this item is not added.
 *
 *
 * @property {Function} [class] - A Svelte component class.
 *
 * @property {object} [props] - An object passed on as props for any Svelte component.
 *
 *
 * @property {string} [icon] - A string containing icon classes.
 *
 *
 * @property {string} [image] - An image icon path.
 *
 * @property {string} [imageAlt] - An image 'alt' text description.
 *
 *
 * @property {string} [label] - A text string that is passed through localization.
 *
 * @property {'hr'} [separator] - A menu item separator; only 'hr' supported.
 */
