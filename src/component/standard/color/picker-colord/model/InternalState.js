import { writable }        from '#svelte/store';

import {
   isWritableStore,
   propertyStore }         from '#runtime/svelte/store';

import {
   isIterable,
   isObject }              from '#runtime/svelte/util';

import { AddOnState }      from './AddOnState.js';
import { ButtonState }     from './ButtonState.js';
import { ColorState }      from './hsv/ColorState.js';
import { EyeDropper }      from './EyeDropper.js';

import { layout }          from '../view/layout/index.js';

export class InternalState
{
   /**
    * @type {AddOnState}
    */
   #addonState;

   /**
    * @type {ButtonState}
    */
   #buttonState;

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
    * External TJSSessionStorage instance.
    *
    * @type {TJSSessionStorage}
    */
   #sessionStorage;

   /**
    * @type {PickerStores}
    */
   #stores;

   /**
    * @param {object|string}           color -
    *
    * @param {TJSColordPickerOptions}  options -
    *
    * @param {TJSSessionStorage}       tjsSessionStorage - External TJSSessionStorage instance.
    */
   constructor(color, options, tjsSessionStorage)
   {
      const opts = isObject(options) ? options : {};

      this.#validateOptions(opts);

      this.#sessionStorage = tjsSessionStorage;

      this.#buttonState = new ButtonState(this);

      this.#addonState = new AddOnState(this);
      this.#addonState.updateOptions(isIterable(opts.addons) ? opts.addons : []);

      // External data -----------------------------------------------------------------------------------------------

      this.#externalData.hasAlpha = typeof opts.hasAlpha === 'boolean' ? opts.hasAlpha : true;

      this.#externalData.hasAddons = typeof opts.hasAddons === 'boolean' ? opts.hasAddons : true;

      this.#externalData.hasButtonBar = typeof opts.hasButtonBar === 'boolean' ? opts.hasButtonBar : true;

      this.#externalData.hasEyeDropper = typeof opts.hasEyeDropper === 'boolean' ?
       opts.hasEyeDropper && EyeDropper.isAvailable : EyeDropper.isAvailable;

      this.#externalData.hasTextInput = typeof opts.hasTextInput === 'boolean' ? opts.hasTextInput : true;

      this.#externalData.inputName = typeof opts.inputName === 'string' ? opts.inputName : 'tjs-color-picker';

      this.#externalData.isPopup = typeof opts.isPopup === 'boolean' ? opts.isPopup : true;

      this.#externalData.lockTextFormat = typeof opts.lockTextFormat === 'boolean' ? opts.lockTextFormat : false;

      this.#externalData.precision = Number.isInteger(opts.precision) ? opts.precision : 0;

      this.#externalData.width = Number.isInteger(opts.width) ? `${opts.width}px` : opts.width;

      // Internal data -----------------------------------------------------------------------------------------------

      this.#internalData.hasAddons = this.#externalData.hasAddons && this.#addonState.size > 0;

      this.#internalData.isOpen = !this.#externalData.isPopup;

      this.#internalData.padding = '0';

      const externalData = writable(this.#externalData);
      const internalData = writable(this.#internalData);

      this.#stores = {
         components: writable(this.#prepareComponents(opts)), // Sets this.#externalData.layout

         hasEyeDropper: propertyStore(externalData, 'hasEyeDropper'),
         hasAlpha: propertyStore(externalData, 'hasAlpha'),
         hasButtonBar: propertyStore(externalData, 'hasButtonBar'),
         hasTextInput: propertyStore(externalData, 'hasTextInput'),
         inputName: propertyStore(externalData, 'inputName'),
         isPopup: propertyStore(externalData, 'isPopup'),
         lockTextFormat: propertyStore(externalData, 'lockTextFormat'),
         precision: propertyStore(externalData, 'precision'),
         width: propertyStore(externalData, 'width'),

         firstFocusEl: writable(void 0),
         hasAddons: propertyStore(internalData, 'hasAddons'),
         isOpen: propertyStore(internalData, 'isOpen'),
         padding: propertyStore(internalData, 'padding')
      };

      this.#colorState = new ColorState(this, color, opts);
   }

   /**
    * @returns {AddOnState} Gets AddOnState data.
    */
   get addOnState()
   {
      return this.#addonState;
   }

   /**
    * @returns {ButtonState} Gets ButtonState data.
    */
   get buttonState()
   {
      return this.#buttonState;
   }

   /**
    * @returns {ColorState} Gets ColorState data.
    */
   get colorState()
   {
      return this.#colorState;
   }

   /**
    * @returns {boolean} Current 'hasAlpha' state.
    */
   get hasAlpha()
   {
      return this.#externalData.hasAlpha;
   }

   /**
    * @returns {boolean} Current `isOpen` state.
    */
   get isOpen()
   {
      return this.#internalData.isOpen;
   }

   /**
    * @returns {number} Gets current `precision` data.
    */
   get precision()
   {
      return this.#externalData.precision;
   }

   /**
    * @returns {TJSSessionStorage} Gets associated TJSSessionStorage instance.
    */
   get sessionStorage()
   {
      return this.#sessionStorage;
   }

   /**
    * @returns {PickerStores} Gets the color picker stores.
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
      this.#sessionStorage = void 0;
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

      switch (opts.layout)
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
      };
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

      this.#addonState.updateOptions(isIterable(opts.addons) ? opts.addons : []);

      // External data -----------------------------------------------------------------------------------------------

      this.#stores.hasAlpha.set(typeof opts.hasAlpha === 'boolean' ? opts.hasAlpha : true);

      this.#externalData.hasAddons = typeof opts.hasAddons === 'boolean' ? opts.hasAddons : true;

      this.#stores.hasButtonBar.set(typeof opts.hasButtonBar === 'boolean' ? opts.hasButtonBar : true);

      this.#stores.hasEyeDropper.set(typeof opts.hasEyeDropper === 'boolean' ?
       opts.hasEyeDropper && EyeDropper.isAvailable : EyeDropper.isAvailable);

      this.#stores.hasTextInput.set(typeof opts.hasTextInput === 'boolean' ? opts.hasTextInput : true);

      this.#stores.inputName.set(typeof opts.inputName === 'string' ? opts.inputName : 'tjs-color-picker');

      const newIsPopup = typeof opts.isPopup === 'boolean' ? opts.isPopup : true;

      // Only reset `isOpen` if external `options.isPopup` has changed. When isPopup is false isOpen must be true.
      if (newIsPopup !== currentIsPopup)
      {
         this.#stores.isOpen.set(!newIsPopup);

         // The open state must take effect before changing popup mode, so defer to next tick.
         setTimeout(() => this.#stores.isPopup.set(newIsPopup), 0);
      }

      if (opts.layout !== this.#externalData.layout) { this.#stores.components.set(this.#prepareComponents(opts)); }

      this.#stores.lockTextFormat.set(typeof opts.lockTextFormat === 'boolean' ? opts.lockTextFormat : false);

      this.#stores.precision.set(Number.isInteger(opts.precision) ? opts.precision : 0);

      this.#stores.width.set(Number.isInteger(opts.width) ? `${opts.width}px` : opts.width);

      // Internal data -----------------------------------------------------------------------------------------------

      this.#stores.hasAddons.set(this.#externalData.hasAddons && this.#addonState.size > 0);

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
      if (opts.addons !== void 0 && !isIterable(opts.addons))
      {
         throw new TypeError(`'options.addons' is not an iterable list of addon constructor functions.`);
      }

      if (opts.hasAddons !== void 0 && typeof opts.hasAddons !== 'boolean')
      {
         throw new TypeError(`'options.hasAddons' is not a boolean.`);
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

      if (opts.inputName !== void 0 && typeof opts.inputName !== 'string')
      {
         throw new TypeError(`'options.inputName' is not a string.`);
      }

      if (opts.isPopup !== void 0 && typeof opts.isPopup !== 'boolean')
      {
         throw new TypeError(`'options.isPopup' is not a boolean.`);
      }

      if (opts.layout !== void 0 && typeof opts.layout !== 'string')
      {
         throw new TypeError(`'options.layout' is not a string or undefined.`);
      }

      if (opts.lockTextFormat !== void 0 && typeof opts.lockTextFormat !== 'boolean')
      {
         throw new TypeError(`'options.lockTextFormat' is not a boolean.`);
      }

      if (opts.precision !== void 0 && (!Number.isInteger(opts.precision) || opts.precision < 0))
      {
         throw new TypeError(`'options.precision' must be an integer >= 0.`);
      }

      if (opts.store !== void 0 && !isWritableStore(opts.store))
      {
         throw new TypeError(`'options.store' must be a writable store.`);
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
 * @property {Iterable<Function>} [addons] - Iterable list of addon class constructor functions.
 *
 * @property {PickerComponents} [components] - User defined picker component overrides.
 *
 * @property {'hex'|'hsl'|'hsv'|'rgb'} [format] - The user defined color format.
 *
 * @property {'object'|'string'} [formatType] - The user defined color format type.
 *
 * @property {boolean} [hasAddons=true] - Enables the addons panel / can set to false to hide panel when addons loaded.
 *
 * @property {boolean} [hasAlpha=true] - Enables alpha / opacity color selection and output.
 *
 * @property {boolean} [hasButtonBar=true] - Enables the button bar.
 *
 * @property {boolean} [hasEyeDropper=true] - Enables eye dropper support if available (requires secure context).
 *
 * @property {boolean} [hasTextInput=true] - Enables text input component.
 *
 * @property {string} [inputName='tjs-color-picker'] - Name attribute for hidden input element / form submission.
 *
 * @property {boolean} [isPopup=true] - Is the picker configured as a pop-up.
 *
 * @property {'chrome'|undefined} [layout=undefined] - Picker layout variant.
 *
 * @property {boolean} [lockTextFormat=false] - When true text input format can not be changed from current format.
 *
 * @property {number} [precision=0] - A positive integer defining rounding precision.
 *
 * @property {import('#svelte/store').Writable<string|object>} [store] - An external store to update current color.
 *
 * @property {object} [styles] - Inline styles to apply to TJSColordPicker span; useful to set CSS variables.
 *
 * @property {number|string} [width=200] - A positive integer greater than 50 defining the main container width in
 *                                         pixels or a valid CSS dimension string.
 */

/**
 * @typedef {object} PickerInternalData
 *
 * @property {boolean} hasAddons - true when external options `hasAddons` is true and there are addons loaded.
 *
 * @property {boolean} isOpen - Is the color picker in the open state.
 *
 * @property {string} [padding] - A padding style to add to the main container to compensate for any layout adjustments.
 */

/**
 * @typedef {object} PickerComponents
 *
 * @property {import('#svelte').SvelteComponent} [alphaIndicator] - Alpha slider indicator.
 *
 * @property {import('#svelte').SvelteComponent} [alphaWrapper] - Alpha slider wrapper.
 *
 * @property {import('#svelte').SvelteComponent} [focusWrap] - When in popup model advances focus to prop element.
 *
 * @property {import('#svelte').SvelteComponent} [pickerIndicator] - Picker indicator.
 *
 * @property {import('#svelte').SvelteComponent} [pickerWrapper] - Picker wrapper.
 *
 * @property {import('#svelte').SvelteComponent} [sliderIndicator] - Hue slider indicator.
 *
 * @property {import('#svelte').SvelteComponent} [sliderWrapper] - Hue slider wrapper.
 *
 * @property {import('#svelte').SvelteComponent} [textInput] - Text input component.
 *
 * @property {import('#svelte').SvelteComponent} [wrapper] - Outer wrapper for all components.
 */

/**
 * @typedef {object} PickerStores
 *
 * @property {import('#svelte/store').Writable<PickerComponents>} components - This selected layout components.
 *
 * @property {import('#svelte/store').Writable<boolean>} hasAlpha - See {@link TJSColordPickerOptions.hasAlpha}
 *
 * @property {import('#svelte/store').Writable<boolean>} hasButtonBar - See {@link TJSColordPickerOptions.hasButtonBar}
 *
 * @property {import('#svelte/store').Writable<boolean>} hasEyeDropper - See {@link TJSColordPickerOptions.hasEyeDropper}
 *
 * @property {import('#svelte/store').Writable<boolean>} hasTextInput - See {@link TJSColordPickerOptions.hasTextInput}
 *
 * @property {import('#svelte/store').Writable<string>} inputName - See {@link TJSColordPickerOptions.inputName}
 *
 * @property {import('#svelte/store').Writable<boolean>} isPopup - See {@link TJSColordPickerOptions.isPopup}
 *
 * @property {import('#svelte/store').Writable<boolean>} lockTextFormat - See {@link TJSColordPickerOptions.lockTextFormat}
 *
 * @property {import('#svelte/store').Writable<number>} precision - See {@link TJSColordPickerOptions.precision}
 *
 * @property {import('#svelte/store').Writable<string>} width - See {@link TJSColordPickerOptions.width}
 *
 *
 * @property {import('#svelte/store').Writable<boolean>} firstFocusEl - Stores first tab / focus traversable element.
 *
 * @property {import('#svelte/store').Writable<boolean>} hasAddons - See {@link PickerInternalData.hasAddons}
 *
 * @property {import('#svelte/store').Writable<boolean>} isOpen - See {@link PickerInternalData.isOpen}
 *
 * @property {import('#svelte/store').Writable<string>} padding - See {@link PickerInternalData.padding}
 */
