import { writable }        from 'svelte/store';

import { propertyStore }   from '@typhonjs-svelte/lib/store';
import { isObject }        from '@typhonjs-svelte/lib/util';

import { variant }         from '../base/variant/index.js'

export class InternalState
{
   /**
    * Stores external user configurable settings.
    *
    * @type {TJSColorPickerOptions}
    */
   #externalData = {};

   /**
    * Stores internal data.
    *
    * @type {InternalData}
    */
   #internalData = {};

   /**
    * Tracks the last user defined `options.isPopUp` setting.
    *
    * @type {boolean}
    */
   #lastIsPopup;

   /**
    * Tracks the last user defined variant selected by `options.variant`.
    *
    * @type {string|undefined}
    */
   #lastVariant = void 0;

   /**
    * @type {PickerStores}
    */
   #stores;

   constructor($$props, options)
   {
      // TODO determine color output format from initial props bound or otherwise; object or string.

      const opts = isObject(options) ? options : {};

      this.#validateProps($$props);
      this.#validateOptions(opts);

      // External data -----------------------------------------------------------------------------------------------

      this.#externalData.isAlpha = typeof opts.isAlpha === 'boolean' ? opts.isAlpha : true;

      this.#lastIsPopup = this.#externalData.isPopup = typeof opts.isPopup === 'boolean' ? opts.isPopup : true;

      this.#externalData.isTextInput = typeof opts.isTextInput === 'boolean' ? opts.isTextInput : true;

      // Internal data -----------------------------------------------------------------------------------------------

      // this.#internalData.format =

      // Set in updateColor
      this.#internalData.isDark = false;

      this.#internalData.isOpen = typeof opts.isOpen === 'boolean' ? opts.isOpen : !this.#externalData.isPopup;

      // Set by the respective wrapper; the Chrome wrapper will set this to true.
      this.#internalData.toRight = false;

      const externalData = writable(this.#externalData);
      const internalData = writable(this.#internalData);

      this.#stores = {
         components: writable(this.#prepareComponents(opts)),

         isAlpha: propertyStore(externalData, 'isAlpha'),
         isPopup: propertyStore(externalData, 'isPopup'),
         isTextInput: propertyStore(externalData, 'isTextInput'),

         isDark: propertyStore(internalData, 'isDark'),
         isOpen: propertyStore(internalData, 'isOpen'),
         toRight: propertyStore(internalData, 'toRight')
      }

console.log(`!! InternalState - ctor - this.#externalData: `, this.#externalData)
console.log(`!! InternalState - ctor - this.#internalData: `, this.#internalData)
   }

   /**
    * @returns {boolean} Current `isOpen` state.
    */
   get isOpen()
   {
      return this.#internalData.isOpen;
   }

   /**
    * @returns {PickerStores}
    */
   get stores()
   {
      return this.#stores;
   }

   /**
    * @param {boolean}  isOpen - New `isOpen` state.
    */
   set isOpen(isOpen)
   {
      this.#stores.isOpen.set(isOpen);
   }

   #prepareComponents(opts)
   {
      let selectedVariant = {};

      switch(opts.variant)
      {
         case 'chrome':
            this.#lastVariant = 'chrome';
            selectedVariant = variant.chrome;
            break;

         default:
            this.#lastVariant = void 0;
            break;
      }

      return {
         ...variant.default,
         ...(isObject(opts.components) ? opts.components : selectedVariant)
      }
   }

   /**
    * Swaps the current `isOpen` state.
    *
    * @returns {boolean} The current `isOpen` state.
    */
   swapIsOpen()
   {
      const result = !this.#internalData.isOpen;

      this.#stores.isOpen.set(result);

      return result;
   }

   update(options)
   {
      const opts = isObject(options) ? options : {};

      this.#validateOptions(opts);

      // External data -----------------------------------------------------------------------------------------------

      this.#stores.isAlpha.set(typeof opts.isAlpha === 'boolean' ? opts.isAlpha : true);

      const newIsPopup = typeof opts.isPopup === 'boolean' ? opts.isPopup : true;

      this.#stores.isPopup.set(newIsPopup);

      this.#stores.isTextInput.set(typeof opts.isTextInput === 'boolean' ? opts.isTextInput : true);

      // Internal data -----------------------------------------------------------------------------------------------

      if (this.#lastVariant !== opts.variant) { this.#stores.components.set(this.#prepareComponents(opts)); }

      // Only reset `isOpen` if external `options.isPopup` has changed. When isPopup is false isOpen must be true.
      if (newIsPopup !== this.#lastIsPopup)
      {
         this.#stores.isOpen.set(!this.#externalData.isPopup);
         this.#lastIsPopup = newIsPopup;
      }

console.log(`!! InternalState - update - this.#externalData: `, this.#externalData)
console.log(`!! InternalState - update - this.#internalData: `, this.#internalData)
   }

   /**
    * Validates external user defined options.
    *
    * @param {TJSColorPickerOptions} opts -
    */
   #validateOptions(opts)
   {
      if (opts.format !== void 0 && typeof opts.format !== 'string')
      {
         throw new TypeError(`'options.format' is not a string.`);
      }

      if (opts.variant !== void 0 && typeof opts.variant !== 'string')
      {
         throw new TypeError(`'options.variant' is not a string or undefined.`);
      }
   }

   /**
    * Validates all props ensuring that only one color prop is bound.
    *
    * @param {object}   $$props -
    */
   #validateProps($$props)
   {

   }
}

/**
 * @typedef {object} TJSColorPickerOptions
 *
 * @property {boolean} isAlpha - Is alpha / opacity color selection and output enabled.
 *
 * @property {boolean} isPopup - Is the picker configured as a pop-up.
 *
 * @property {boolean} isTextInput - Is the picker configured with text input components.
 */

/**
 * @typedef {object} InternalData
 *
 * @property {'object'|'string'} format - Stores the output format passed back to bound color prop.
 *
 * @property {boolean} isDark - Is the current color considered dark by `colord`.
 *
 * @property {boolean} isOpen - Is the color picker in the open state.
 *
 * @property {boolean} toRight - Are the sliders oriented vertically; TODO: consider changing to `sliderVertical`
 */

/**
 * @typedef {object} PickerComponents
 *
 * @property {import('svelte').SvelteComponent} [alphaIndicator] - Alpha slider indicator.
 *
 * @property {import('svelte').SvelteComponent} [alphaWrapper] - Alpha slider wrapper.
 *
 * @property {import('svelte').SvelteComponent} [pickerIndicator] - Picker indicator.
 *
 * @property {import('svelte').SvelteComponent} [pickerWrapper] - Picker wrapper.
 *
 * @property {import('svelte').SvelteComponent} [sliderIndicator] - Hue slider indicator.
 *
 * @property {import('svelte').SvelteComponent} [sliderWrapper] - Hue slider wrapper.
 *
 * @property {import('svelte').SvelteComponent} [textInput] - Text input component.
 *
 * @property {import('svelte').SvelteComponent} [wrapper] - Outer wrapper for all components.
 */

/**
 * @typedef {object} PickerStores
 *
 * @property {import('svelte/store').Writable<PickerComponents>} components - This selected layout components.
 *
 * @property {import('svelte/store').Writable<boolean>} isAlpha - See {@link TJSColorPickerOptions.isAlpha}
 *
 * @property {import('svelte/store').Writable<boolean>} isPopup - See {@link TJSColorPickerOptions.isPopup}
 *
 * @property {import('svelte/store').Writable<boolean>} isTextInput - See {@link TJSColorPickerOptions.isTextInput}
 *
 *
 * @property {import('svelte/store').Writable<boolean>} isDark - See {@link InternalData.isDark}
 *
 * @property {import('svelte/store').Writable<boolean>} isOpen - See {@link InternalData.isOpen}
 *
 * @property {import('svelte/store').Writable<boolean>} toRight - See {@link InternalData.toRight}
 */
