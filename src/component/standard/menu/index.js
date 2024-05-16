export { default as TJSMenu }             from './TJSMenu.svelte';
export { default as TJSContextMenuImpl }  from './context/TJSContextMenuImpl.svelte';

/**
 * @typedef {object} TJSMenuData
 *
 * @property {Iterable<TJSMenuItemData>} [items] The data driven menu items.
 *
 * @property {{ x?: number, y?: number }} [offset] Optional X / Y offsets for the menu display.
 *
 * @property {{ class: Function, props?: object }} [slotAfter] A minimal Svelte config defining a menu item component
 * after the main data driven menu items.
 *
 * @property {{ class: Function, props?: object }} [slotBefore] A minimal Svelte config defining a menu item component
 * before the main data driven menu items.
 *
 * @property {{ class: Function, props?: object }} [slotDefault] A minimal Svelte config defining the default content
 * component replacing the data driven menu items.
 *
 * @property {Record<string, string>}   [styles] Styles to be applied inline.
 *
 * @property {Function}  [efx] Currently unused; for any future action effects.
 *
 * @property {string}  [keyCode='Enter'] The key code to activate menu items.
 *
 * @property {({
 *    duration: number,
 *    easing: import('#runtime/svelte/easing').EasingReference
 * })}  [transitionOptions={ duration: 200, easing: 'quintOut' }] Custom transition options for duration and easing
 * function reference. The default easing function is `quintOut`.
 */

/**
 * @typedef {object} TJSMenuItemData
 *
 * @property {(
 *    (data?: {
 *       event?: (KeyboardEvent | PointerEvent),
 *       item?: TJSMenuItemData,
 *       focusSource?: import('#runtime/util/browser').A11yFocusSource
 *    }) => any
 * )} [onPress] A callback function to invoke; The object contains the item menu item data and an A11yFocusSource object
 * to potentially pass to a new application.
 *
 * @property {boolean|Function} [condition] If a boolean and false or a function that invoked returns a falsy value
 * this item is not added.
 *
 *
 * @property {Function} [class] A Svelte component class.
 *
 * @property {object} [props] An object passed on as props for any Svelte component.
 *
 *
 * @property {string} [icon] A string containing icon classes.
 *
 *
 * @property {string} [image] An image icon path.
 *
 * @property {string} [imageAlt] An image 'alt' text description.
 *
 *
 * @property {string} [label] A text string that is passed through localization.
 *
 * @property {'hr'} [separator] A menu item separator; only 'hr' supported.
 */
