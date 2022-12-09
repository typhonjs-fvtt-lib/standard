import { writable }        from 'svelte/store';

import { propertyStore }   from '@typhonjs-svelte/lib/store';

import {
   isIterable,
   isObject }              from '@typhonjs-svelte/lib/util';

import { AddOnState }      from './AddOnState.js';
import { ColorState }      from './hsv/ColorState.js';
import { EyeDropper }      from './EyeDropper.js';

import { layout }          from '../view/layout/index.js'

export class InternalState
{
   /**
    * @type {AddOnState}
    */
   #addonState;

   /**
    * @type {ColorState}
    */
   #colorState;

   /**
    * Stores external user configurable settings.
    *
    * @type {TJSColordPickerOptions}
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
    * @param {object|string}           color -
    *
    * @param {TJSColordPickerOptions}  options -
    */
   constructor(color, options)
   {
      const opts = isObject(options) ? options : {};

      this.#validateOptions(opts);

      this.#addonState = new AddOnState(this);

      this.#addonState.updateOptions(isIterable(opts.addOn) ? opts.addOn : []);

      // External data -----------------------------------------------------------------------------------------------

      this.#externalData.canChangeMode = typeof opts.canChangeMode === 'boolean' ? opts.canChangeMode : true;

      this.#externalData.hasAlpha = typeof opts.hasAlpha === 'boolean' ? opts.hasAlpha : true;

      this.#externalData.hasButtonBar = typeof opts.hasButtonBar === 'boolean' ? opts.hasButtonBar : true;

      this.#externalData.hasEyeDropper = typeof opts.hasEyeDropper === 'boolean' ?
       opts.hasEyeDropper && EyeDropper.isAvailable : EyeDropper.isAvailable;

      this.#externalData.hasTextInput = typeof opts.hasTextInput === 'boolean' ? opts.hasTextInput : true;

      this.#externalData.isPopup = typeof opts.isPopup === 'boolean' ? opts.isPopup : true;

      this.#externalData.paddingOffset = typeof opts.paddingOffset === 'string' ? opts.paddingOffset : '0';

      this.#externalData.precision = Number.isInteger(opts.precision) ? opts.precision : 0;

      this.#externalData.width = Number.isInteger(opts.width) ? `${opts.width}px` : opts.width;

      // Internal data -----------------------------------------------------------------------------------------------

      this.#internalData.isOpen = !this.#externalData.isPopup;

      const externalData = writable(this.#externalData);
      const internalData = writable(this.#internalData);

      this.#stores = {
         components: writable(this.#prepareComponents(opts)), // Sets this.#externalData.layout

         canChangeMode: propertyStore(externalData, 'canChangeMode'),
         hasEyeDropper: propertyStore(externalData, 'hasEyeDropper'),
         hasAlpha: propertyStore(externalData, 'hasAlpha'),
         hasButtonBar: propertyStore(externalData, 'hasButtonBar'),
         hasTextInput: propertyStore(externalData, 'hasTextInput'),
         isPopup: propertyStore(externalData, 'isPopup'),
         paddingOffset: propertyStore(externalData, 'paddingOffset'),
         precision: propertyStore(externalData, 'precision'),
         width: propertyStore(externalData, 'width'),

         isOpen: propertyStore(internalData, 'isOpen'),
      }

      this.#colorState = new ColorState(this, color, opts);
   }

   /**
    * @returns {AddOnState}
    */
   get addOnState()
   {
      return this.#addonState;
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
    * @returns {number}
    */
   get precision()
   {
      return this.#externalData.precision;
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
    * @param {TJSColordPickerOptions} opts -
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

         case 'default':
         default:
            this.#externalData.layout = void 0;
            break;
      }

      return {
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
    * @param {TJSColordPickerOptions} options -
    */
   updateOptions(options)
   {
      const opts = isObject(options) ? options : {};

      this.#validateOptions(opts);

      const currentIsPopup = this.#externalData.isPopup;

      this.#addonState.updateOptions(isIterable(opts.addOn) ? opts.addOn : []);

      // External data -----------------------------------------------------------------------------------------------

      this.#stores.canChangeMode.set(typeof opts.canChangeMode === 'boolean' ? opts.canChangeMode : true);

      this.#stores.hasAlpha.set(typeof opts.hasAlpha === 'boolean' ? opts.hasAlpha : true);

      this.#stores.hasButtonBar.set(typeof opts.hasButtonBar === 'boolean' ? opts.hasButtonBar : true);

      this.#stores.hasEyeDropper.set(typeof opts.hasEyeDropper === 'boolean' ?
       opts.hasEyeDropper && EyeDropper.isAvailable : EyeDropper.isAvailable);

      this.#stores.hasTextInput.set(typeof opts.hasTextInput === 'boolean' ? opts.hasTextInput : true);

      const newIsPopup = typeof opts.isPopup === 'boolean' ? opts.isPopup : true;

      this.#stores.isPopup.set(newIsPopup);

      if (opts.layout !== this.#externalData.layout) { this.#stores.components.set(this.#prepareComponents(opts)); }

      this.#stores.paddingOffset.set(opts.paddingOffset ? opts.paddingOffset : '0');

      this.#stores.precision.set(Number.isInteger(opts.precision) ? opts.precision : 0);

      this.#stores.width.set(Number.isInteger(opts.width) ? `${opts.width}px` : opts.width);

      // Internal data -----------------------------------------------------------------------------------------------

      // Only reset `isOpen` if external `options.isPopup` has changed. When isPopup is false isOpen must be true.
      if (newIsPopup !== currentIsPopup) { this.#stores.isOpen.set(!newIsPopup); }

      // Update color state options (color format / type) ------------------------------------------------------------

      this.#colorState.updateOptions(opts);
   }

   /**
    * Validates external user defined options.
    *
    * @param {TJSColordPickerOptions} opts -
    */
   #validateOptions(opts)
   {
      if (opts.addOn !== void 0 && !isIterable(opts.addOn))
      {
         throw new TypeError(`'options.addOn' is not an iterable list of addon constructor functions.`);
      }

      if (opts.canChangeMode !== void 0 && typeof opts.canChangeMode !== 'boolean')
      {
         throw new TypeError(`'options.canChangeMode' is not a boolean.`);
      }

      if (opts.hasAlpha !== void 0 && typeof opts.hasAlpha !== 'boolean')
      {
         throw new TypeError(`'options.hasAlpha' is not a boolean.`);
      }

      if (opts.hasButtonBar !== void 0 && typeof opts.hasButtonBar !== 'boolean')
      {
         throw new TypeError(`'options.hasButtonBar' is not a boolean.`);
      }

      if (opts.hasEyeDropper !== void 0 && typeof opts.hasEyeDropper !== 'boolean')
      {
         throw new TypeError(`'options.hasEyeDropper' is not a boolean.`);
      }

      if (opts.hasTextInput !== void 0 && typeof opts.hasTextInput !== 'boolean')
      {
         throw new TypeError(`'options.hasTextInput' is not a boolean.`);
      }

      if (opts.isPopup !== void 0 && typeof opts.isPopup !== 'boolean')
      {
         throw new TypeError(`'options.isPopup' is not a boolean.`);
      }

      if (opts.layout !== void 0 && typeof opts.layout !== 'string')
      {
         throw new TypeError(`'options.layout' is not a string or undefined.`);
      }

      if (opts.paddingOffset !== void 0 && typeof opts.paddingOffset !== 'string')
      {
         throw new TypeError(`'options.paddingOffset' is not a string.`);
      }

      if (opts.precision !== void 0 && (!Number.isInteger(opts.precision) || opts.precision < 0))
      {
         throw new TypeError(`'options.precision' must be an integer >= 0.`);
      }

      if (opts.width !== void 0)
      {
         switch (typeof opts.width)
         {
            case 'number':
               if (Number.isInteger(opts.width) && opts.width < 50)
               {
                  throw new TypeError(`'options.width' must be an integer >= 50 or valid CSS dimension string.`);
               }
               break;

            default:
               if (typeof opts.width !== 'string')
               {
                  throw new TypeError(`'options.width' must be an integer >= 50 or valid CSS dimension string.`);
               }
               break;
         }
      }
   }
}

/**
 * @typedef {object|string} TJSColordPickerColor
 */

/**
 * @typedef {object} TJSColordPickerOptions
 *
 * @property {Iterable<Function>} [addOn] - Iterable list of addon class constructor functions.
 *
 * @property {PickerComponents} [components] - User defined picker component overrides.
 *
 * @property {boolean} [canChangeMode=true] - Can the text mode be changed.
 *
 * @property {'hex'|'hsl'|'hsv'|'rgb'} [format] - The user defined color format.
 *
 * @property {'object'|'string'} [formatType] - The user defined color format type.
 *
 * @property {boolean} [hasAlpha=true] - Enables alpha / opacity color selection and output.
 *
 * @property {boolean} [hasButtonBar=true] - Enables the button bar.
 *
 * @property {boolean} [hasEyeDropper=true] - Enables eye dropper support if available (requires secure context).
 *
 * @property {boolean} [hasTextInput=true] - Enables text input component.
 *
 * @property {boolean} [isPopup=true] - Is the picker configured as a pop-up.
 *
 * @property {'chrome'|undefined} [layout=undefined] - Picker layout variant.
 *
 * @property {string} [paddingOffset] - A valid CSS dimension to provide offset padding as necessary depending on layout.
 *                                      IE the default layout when below 235px wide needs make up padding on the right.
 *
 * @property {number} [precision=0] - A positive integer defining rounding precision.
 *
 * @property {object} [styles] - Inline styles to apply to TJSColordPicker span; useful to set CSS variables.
 *
 * @property {number|string} [width=200] - A positive integer greater than 50 defining the main container width in
 *                                         pixels or a valid CSS dimension string.
 */

/**
 * @typedef {object} PickerInternalData
 *
 * @property {boolean} isOpen - Is the color picker in the open state.
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
 * @property {import('svelte/store').Writable<boolean>} canChangeMode - See {@link TJSColordPickerOptions.canChangeMode}
 *
 * @property {import('svelte/store').Writable<PickerComponents>} components - This selected layout components.
 *
 * @property {import('svelte/store').Writable<boolean>} hasAlpha - See {@link TJSColordPickerOptions.hasAlpha}
 *
 * @property {import('svelte/store').Writable<boolean>} hasEyeDropper - See {@link TJSColordPickerOptions.hasEyeDropper}
 *
 * @property {import('svelte/store').Writable<boolean>} hasTextInput - See {@link TJSColordPickerOptions.hasTextInput}
 *
 * @property {import('svelte/store').Writable<boolean>} isPopup - See {@link TJSColordPickerOptions.isPopup}
 *
 * @property {import('svelte/store').Writable<string>} paddingOffset - See {@link TJSColordPickerOptions.paddingOffset}
 *
 * @property {import('svelte/store').Writable<number>} precision - See {@link TJSColordPickerOptions.precision}
 *
 * @property {import('svelte/store').Writable<string>} width - See {@link TJSColordPickerOptions.width}
 *
 *
 * @property {import('svelte/store').Writable<boolean>} isOpen - See {@link PickerInternalData.isOpen}
 */
