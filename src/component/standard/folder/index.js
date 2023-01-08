export { default as TJSSvgFolder }  from './TJSSvgFolder.svelte';
export { default as TJSIconFolder } from './TJSIconFolder.svelte';

/**
 * @typedef {object} TJSFolderOptions
 *
 * @property {boolean} [chevronOnly=false] - When true only clicks on the folder chevron open / close the summary.
 *
 *
 *
 * @property {boolean} [noKeys=false] - When true keyboard events do not control the details open / close state.
 *                                      This is useful when embedding an input element in the summary.
 */

/**
 * @typedef {object} TJSFolderData
 *
 * @property {string} [id] -
 *
 * @property {string} [label] -
 *
 * @property {string} [keyCode='Enter'] - Defines the key event code to open / close summary when focused.
 *
 * @property {TJSFolderOptions} [options] - Additional folder options.
 *
 * @property {{ class: Function, props?: object }} [slotDefault] - A minimal Svelte config defining the default content
 *           component.
 *
 * @property {{ class: Function, props?: object }} [slotLabel] - A minimal Svelte config defining the summary label
 *           component.
 *
 * @property {{ class: Function, props?: object }} [slotSummaryEnd] - A minimal Svelte config defining the summary end
 *           component.
 *
 * @property {import('svelte/store').Writable<boolean>} [store] - Folder open / close store.
 *
 * @property {object} [styles] - Additional styles to apply.
 *
 * @property {() => void} [onClose] - Callback when folder closed.
 *
 * @property {() => void} [onOpen] - Callback when folder opened.
 *
 * @property {(event?: MouseEvent) => void} [onContextMenu] - Callback for context menu.
 */

/**
 * @typedef {TJSFolderData} TJSIconFolderData
 *
 * @property {string} [iconClosed] - Class string for font.
 *
 * @property {string} [iconOpen] - Class string for font.
 */
