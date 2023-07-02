export * from './ColorState.js';

/**
 * @typedef {object} ColorStateData
 *
 * @property {number} alpha Current alpha value.
 *
 * @property {object|string} currentColor Current color value.
 *
 * @property {string} currentColorString Current color value; matches format if string available otherwise HSL.
 *
 * @property {'hex'|'hsl'|'hsv'|'rgb'} format Output color format determined from initial color prop or options.
 *
 * @property {'object'|'string'} formatType Output color format type determined from initial color prop or options.
 *
 * @property {number} hue Current hue value.
 *
 * @property {string|object} initialPopupColor Stores the initial color when in popup mode and picker is opened.
 *
 * @property {boolean} isDark Is the current color considered dark.
 *
 * @property {number} precision The rounding precision for the current color output.
 *
 * @property {string} hslString Current color as RGB string without `alpha` component.
 *
 * @property {string} hslHueString Current hue as RGB string.
 *
 * @property {string} hslaString Current color as RGB string with `alpha` component.
 *
 * @property {boolean} lockTextFormat Current lock text state format state.
 *
 * @property {{ s: number, v: number }} sv Current internal color saturation / value state.
 */

/**
 * @typedef {object} ColorStateInternalUpdate
 *
 * The separated store updates for alpha, hue, sv are debounced with a next tick update and this object
 * collates the values for each store update in the same tick. It is reset in #updateOutputColorDebounce.
 *
 * `textUpdate` determines if the update came from {@link TextState} and if so TextState is not updated in
 * #updateCurrentColor.
 *
 * @property {number}                  a New alpha value.
 *
 * @property {number}                  h New hue value.
 *
 * @property {{s: number, v: number}}  sv New SV value.
 *
 * @property {boolean}                 textUpdate Did the update come from {@link TextState}.
 */

/**
 * @typedef {object} ColorStateStores
 *
 * @property {import('svelte/store').Writable<number>} alpha The current alpha value (0 - 1).
 *
 * @property {import('svelte/store').Writable<number>} hue The current hue value (0 - 360).
 *
 * @property {import('svelte/store').Readable<string|object>} currentColor The current color.
 *
 * @property {import('svelte/store').Readable<string>} currentColorString - The current color string matching format or
 * HSL.
 *
 * @property {import('svelte/store').Readable<boolean>} isDark Is the current color considered "dark".
 *
 * @property {import('./text').TextState} textState The text state for various supported color formats.
 *
 * @property {import('svelte/store').Readable<string>} hslString The current color / RGB only string.
 *
 * @property {import('svelte/store').Readable<string>} hslHueString The current color hue / RGB only string.
 *
 * @property {import('svelte/store').Readable<string>} hslaString The current color / RGBA only string.
 *
 * @property {import('svelte/store').Writable<{ s: number, v: number }>} sv The saturation / value pair for HSV
 * components.
 */
