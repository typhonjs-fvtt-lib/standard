export * from './InternalState.js';

/**
 * @typedef {object} PickerInternalData
 *
 * @property {boolean} hasAddons true when external options `hasAddons` is true and there are addons loaded.
 *
 * @property {boolean} isOpen Is the color picker in the open state.
 *
 * @property {string} [padding] A padding style to add to the main container to compensate for any layout adjustments.
 */

/**
 * @typedef {object} PickerStores
 *
 * @property {import('svelte/store').Writable<import('../').TJSColordPickerComponents>} components This selected
 * layout components.
 *
 * @property {import('svelte/store').Writable<boolean>} hasAlpha See {@link TJSColordPickerOptions.hasAlpha}
 *
 * @property {import('svelte/store').Writable<boolean>} hasButtonBar See {@link TJSColordPickerOptions.hasButtonBar}
 *
 * @property {import('svelte/store').Writable<boolean>} hasEyeDropper See {@link TJSColordPickerOptions.hasEyeDropper}
 *
 * @property {import('svelte/store').Writable<boolean>} hasTextInput See {@link TJSColordPickerOptions.hasTextInput}
 *
 * @property {import('svelte/store').Writable<string>} inputName See {@link TJSColordPickerOptions.inputName}
 *
 * @property {import('svelte/store').Writable<boolean>} isPopup See {@link TJSColordPickerOptions.isPopup}
 *
 * @property {import('svelte/store').Writable<boolean>} lockTextFormat See {@link TJSColordPickerOptions.lockTextFormat}
 *
 * @property {import('svelte/store').Writable<number>} precision See {@link TJSColordPickerOptions.precision}
 *
 * @property {import('svelte/store').Writable<string>} width See {@link TJSColordPickerOptions.width}
 *
 *
 * @property {import('svelte/store').Writable<boolean>} firstFocusEl Stores first tab / focus traversable element.
 *
 * @property {import('svelte/store').Writable<boolean>} hasAddons See {@link PickerInternalData.hasAddons}
 *
 * @property {import('svelte/store').Writable<boolean>} isOpen See {@link PickerInternalData.isOpen}
 *
 * @property {import('svelte/store').Writable<string>} padding See {@link PickerInternalData.padding}
 */
