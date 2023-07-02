export * from './InternalState.js';

/**
 * @typedef {object|string} TJSColordPickerColor
 */

/**
 * @typedef {object} TJSColordPickerOptions
 *
 * @property {Iterable<Function>} [addons] Iterable list of addon class constructor functions.
 *
 * @property {PickerComponents} [components] User defined picker component overrides.
 *
 * @property {'hex'|'hsl'|'hsv'|'rgb'} [format] The user defined color format.
 *
 * @property {'object'|'string'} [formatType] The user defined color format type.
 *
 * @property {boolean} [hasAddons=true] Enables the addons panel / can set to false to hide panel when addons loaded.
 *
 * @property {boolean} [hasAlpha=true] Enables alpha / opacity color selection and output.
 *
 * @property {boolean} [hasButtonBar=true] Enables the button bar.
 *
 * @property {boolean} [hasEyeDropper=true] Enables eye dropper support if available (requires secure context).
 *
 * @property {boolean} [hasTextInput=true] Enables text input component.
 *
 * @property {string} [inputName='tjs-color-picker'] Name attribute for hidden input element / form submission.
 *
 * @property {boolean} [isPopup=true] Is the picker configured as a pop-up.
 *
 * @property {'chrome'|undefined} [layout=undefined] Picker layout variant.
 *
 * @property {boolean} [lockTextFormat=false] When true text input format can not be changed from current format.
 *
 * @property {number} [precision=0] A positive integer defining rounding precision.
 *
 * @property {import('svelte/store').Writable<string|object>} [store] An external store to update current color.
 *
 * @property {object} [styles] Inline styles to apply to TJSColordPicker span; useful to set CSS variables.
 *
 * @property {number|string} [width=200] A positive integer greater than 50 defining the main container width in
 * pixels or a valid CSS dimension string.
 */

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
 * @typedef {object} PickerComponents
 *
 * @property {import('svelte').SvelteComponent} [alphaIndicator] Alpha slider indicator.
 *
 * @property {import('svelte').SvelteComponent} [alphaWrapper] Alpha slider wrapper.
 *
 * @property {import('svelte').SvelteComponent} [focusWrap] When in popup model advances focus to prop element.
 *
 * @property {import('svelte').SvelteComponent} [pickerIndicator] Picker indicator.
 *
 * @property {import('svelte').SvelteComponent} [pickerWrapper] Picker wrapper.
 *
 * @property {import('svelte').SvelteComponent} [sliderIndicator] Hue slider indicator.
 *
 * @property {import('svelte').SvelteComponent} [sliderWrapper] Hue slider wrapper.
 *
 * @property {import('svelte').SvelteComponent} [textInput] Text input component.
 *
 * @property {import('svelte').SvelteComponent} [wrapper] Outer wrapper for all components.
 */

/**
 * @typedef {object} PickerStores
 *
 * @property {import('svelte/store').Writable<PickerComponents>} components This selected layout components.
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
