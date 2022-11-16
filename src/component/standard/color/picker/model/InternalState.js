import { writable }        from 'svelte/store';

import { propertyStore }   from '@typhonjs-svelte/lib/store';
import { isObject }        from '@typhonjs-svelte/lib/util';

import { ColorState }      from './ColorState.js';

import { layout }          from '../base/layout/index.js'
import { textInput }       from '../base/text/index.js';

export class InternalState
{
   /**
    * @type {ColorState}
    */
   #colorState;

   /**
    * Stores external user configurable settings.
    *
    * @type {TJSColorPickerOptions}
    */
   #externalData = {};

   /**
    * Stores internal data.
    *
    * @type {PickerInternalData}
    */
   #internalData = {};

   /**
    * @type {PickerStores}
    */
   #stores;

   /**
    * @param {TJSColorPickerColor}     color -
    *
    * @param {TJSColorPickerOptions}   options -
    */
   constructor(color, options)
   {
      // TODO determine color output format from initial props bound or otherwise; object or string.
      const opts = isObject(options) ? options : {};

      this.#validateOptions(opts);

      // External data -----------------------------------------------------------------------------------------------

      this.#externalData.canChangeMode = typeof opts.canChangeMode === 'boolean' ? opts.canChangeMode : true;

      this.#externalData.isAlpha = typeof opts.isAlpha === 'boolean' ? opts.isAlpha : true;

      this.#externalData.isPopup = typeof opts.isPopup === 'boolean' ? opts.isPopup : true;

      this.#externalData.isTextInput = typeof opts.isTextInput === 'boolean' ? opts.isTextInput : true;

      // Internal data -----------------------------------------------------------------------------------------------

      // this.#internalData.format =

      this.#internalData.isOpen = typeof opts.isOpen === 'boolean' ? opts.isOpen : !this.#externalData.isPopup;

      const externalData = writable(this.#externalData);
      const internalData = writable(this.#internalData);

      this.#stores = {
         components: writable(this.#prepareComponents(opts)), // Sets this.#externalData.layout

         canChangeMode: propertyStore(externalData, 'canChangeMode'),
         isAlpha: propertyStore(externalData, 'isAlpha'),
         isPopup: propertyStore(externalData, 'isPopup'),
         isTextInput: propertyStore(externalData, 'isTextInput'),

         isOpen: propertyStore(internalData, 'isOpen'),

         // Set by the respective wrapper; default wrapper sets to true & the Chrome wrapper to false.
         sliderHorizontal: propertyStore(internalData, 'sliderHorizontal')
      }

      this.#colorState = new ColorState(this, color);

      console.log(`!! InternalState - ctor - this.#externalData: `, this.#externalData)
console.log(`!! InternalState - ctor - this.#internalData: `, this.#internalData)
   }

   /**
    * @returns {ColorState}
    */
   get colorState()
   {
      return this.#colorState;
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

   destroy()
   {
      this.#colorState.destroy();
   }

   /**
    * Prepares layout components based on any user provided `options.layout`
    *
    * @param {TJSColorPickerOptions} opts -
    *
    * @returns {PickerComponents} Configured layout components.
    */
   #prepareComponents(opts)
   {
      let selectedVariant = {};

      switch(opts.layout)
      {
         case 'chrome':
            this.#externalData.layout = 'chrome';
            selectedVariant = layout.chrome;
            break;

         default:
            this.#externalData.layout = void 0;
            break;
      }

      return {
         ...textInput,
         ...layout.default,
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

   /**
    * Updates external & internal data on changes to the `options` prop.
    *
    * @param {TJSColorPickerOptions} options -
    */
   update(options)
   {
      const opts = isObject(options) ? options : {};

      this.#validateOptions(opts);

      const currentIsPopup = this.#externalData.isPopup;

      // External data -----------------------------------------------------------------------------------------------

      this.#stores.isAlpha.set(typeof opts.isAlpha === 'boolean' ? opts.isAlpha : true);

      const newIsPopup = typeof opts.isPopup === 'boolean' ? opts.isPopup : true;

      this.#stores.isPopup.set(newIsPopup);

      this.#stores.isTextInput.set(typeof opts.isTextInput === 'boolean' ? opts.isTextInput : true);

      if (opts.layout !== this.#externalData.layout) { this.#stores.components.set(this.#prepareComponents(opts)); }

      this.#stores.canChangeMode.set(typeof opts.canChangeMode === 'boolean' ? opts.canChangeMode : true);

      // Internal data -----------------------------------------------------------------------------------------------

      // Only reset `isOpen` if external `options.isPopup` has changed. When isPopup is false isOpen must be true.
      if (newIsPopup !== currentIsPopup) { this.#stores.isOpen.set(!newIsPopup); }

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

      if (opts.canChangeMode !== void 0 && typeof opts.canChangeMode !== 'boolean')
      {
         throw new TypeError(`'options.canChangeMode' is not a boolean.`);
      }

      if (opts.isAlpha !== void 0 && typeof opts.isAlpha !== 'boolean')
      {
         throw new TypeError(`'options.isAlpha' is not a boolean.`);
      }

      if (opts.isPopup !== void 0 && typeof opts.isPopup !== 'boolean')
      {
         throw new TypeError(`'options.isPopup' is not a boolean.`);
      }

      if (opts.isTextInput !== void 0 && typeof opts.isTextInput !== 'boolean')
      {
         throw new TypeError(`'options.isTextInput' is not a boolean.`);
      }

      if (opts.layout !== void 0 && typeof opts.layout !== 'string')
      {
         throw new TypeError(`'options.layout' is not a string or undefined.`);
      }

      if (typeof opts.layout === 'string' && opts.layout !== 'chrome')
      {
         throw new Error(`Unknown 'options.layout': ${opts.layout}; must be undefined or 'chrome'.`)
      }
   }
}

/**
 * @typedef {object|string} TJSColorPickerColor
 */

/**
 * @typedef {object} TJSColorPickerOptions
 *
 * @property {PickerComponents} [components] - User defined picker component overrides.
 *
 * @property {boolean} [canChangeMode=true] - Can the text mode be changed.
 *
 * @property {boolean} [isAlpha=true] - Is alpha / opacity color selection and output enabled.
 *
 * @property {boolean} [isPopup=true] - Is the picker configured as a pop-up.
 *
 * @property {boolean} [isTextInput=true] - Is the picker configured with text input components.
 *
 * @property {'chrome'|undefined} [layout=undefined] - Picker layout variant.
 */

/**
 * @typedef {object} PickerInternalData
 *
 * @property {'object'|'string'} format - Stores the output format passed back to bound color prop.
 *
 * @property {boolean} isOpen - Is the color picker in the open state.
 *
 * @property {boolean} sliderHorizontal - Are the sliders oriented horizontally.
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
 * @property {import('svelte/store').Writable<boolean>} canChangeMode - See {@link TJSColorPickerOptions.canChangeMode}
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
 * @property {import('svelte/store').Writable<boolean>} isOpen - See {@link PickerInternalData.isOpen}
 *
 * @property {import('svelte/store').Writable<boolean>} sliderHorizontal - See {@link PickerInternalData.sliderHorizontal}
 */
