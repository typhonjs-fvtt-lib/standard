import { writable }     from 'svelte/store';

import { colord }       from '@typhonjs-fvtt/runtime/color/colord';

// TODO REFACTOR TO TOP LEVEL OPTION
import { rippleFocus }  from '@typhonjs-fvtt/svelte-standard/action';

/**
 * Provides a buffered set of stores converting the current color from {@link ColorState} into rounded RGB component
 * values for display in the {@link TextInput} component. These RGB component stores have an overridden set method that
 * validate updates from the number inputs they are assigned to keeping number ranges between `0-255` and also handling
 * the case when the number input is `null` which occurs when the user removes all input values or inputs `-` a minus
 * character, etc. In that case `0` is substituted for `null`.
 */
export class RgbState
{
   /** @type {{ r: number, g: number, b: number}} */
   #data;

   /** @type {ColorStateAccess} */
   #colorStateAccess;

   /** @type {TextStateAccess} */
   #textStateAccess;

   /** @type {RgbStateInputData} */
   #inputData;

   /** @type {RgbStateStores} */
   #stores;

   /**
    * Stores the original writable set methods.
    *
    * @type {{r: Function, g: Function, b: Function}}
    */
   #storeSet = {};

   /**
    * @param {ColorStateAccess}  colorStateAccess -
    *
    * @param {TextStateAccess}   textStateAccess -
    */
   constructor(colorStateAccess, textStateAccess)
   {
      this.#data = { r: 255, g: 0, b: 0 };

      this.#colorStateAccess = colorStateAccess;
      this.#textStateAccess = textStateAccess;

      // Setup custom stores that swap out the writable set method invoking `#updateComponent` that after
      // validation of new component data invokes the original set method.
      const r = writable(this.#data.r);
      this.#storeSet.r = r.set;
      r.set = (value) => this.#updateComponent(value, 'r');

      const g = writable(this.#data.g);
      this.#storeSet.g = g.set;
      g.set = (value) => this.#updateComponent(value, 'g');

      const b = writable(this.#data.b);
      this.#storeSet.b = b.set;
      b.set = (value) => this.#updateComponent(value, 'b');

      this.#stores = { r, g, b };

      this.#inputData = {
         r: {
            store: r,
            efx: rippleFocus(),
            type: 'number',
            min: 0,
            max: 255,
            options: {
               blurOnEnterKey: true,
               cancelOnEscKey: true
            },
            aria: {
               label: 'red chanel color'
            }
         },
         g: {
            store: g,
            efx: rippleFocus(),
            type: 'number',
            min: 0,
            max: 255,
            options: {
               blurOnEnterKey: true,
               cancelOnEscKey: true
            },
            aria: {
               label: 'green chanel color'
            }
         },
         b: {
            store: b,
            efx: rippleFocus(),
            type: 'number',
            min: 0,
            max: 255,
            options: {
               blurOnEnterKey: true,
               cancelOnEscKey: true
            },
            aria: {
               label: 'blue chanel color'
            }
         }
      }
   }

   /**
    * @returns {RgbStateInputData} HSL input component data.
    */
   get inputData()
   {
      return this.#inputData;
   }

   /**
    * @returns {RgbStateStores} RGB text state stores.
    */
   get stores()
   {
      return this.#stores;
   }

   /**
    * Returns whether all RGB components are the same value. If so when converted to HSV there is no
    * hue information, so a new hue value should not be set to maintain existing hue in the UI otherwise
    * it will be set to `0` which will always jump it to red.
    *
    * @returns {boolean} Are all RGB components the same.
    */
   #isRgbEqual()
   {
      return this.#data.r === this.#data.g && this.#data.r === this.#data.b;
   }

   /**
    * @param {number|null} value - A RGB component value to validate and update.
    *
    * @param {'r'|'g'|'b'} index - RGB component index.
    */
   #updateComponent(value, index)
   {
      // Handle case when all number input is removed or invalid and value is null.
      if (value === null) { value = 0; }

      if (typeof value !== 'number') { throw new TypeError(`RgbState 'set ${index}' error: 'value' is not a number.`); }

      // Validate that input values are between `0 - 255`.
      if (value === Number.NaN) { value = 0; }
      if (value < 0) { value = 0; }
      if (value > 255) { value = 255; }

      // Set the `textUpdate` flag to true so when ColorState.#updateCurrentColor executes it does not update
      // TextState.
      this.#colorStateAccess.internalUpdate.textUpdate = true;

      // Update local component value.
      this.#data[index] = value;

      // Update ColorState hue and sv component stores w/ parsed local RGB component data.
      const newHsv = colord(this.#data).toHsv(5);

      // Only change 'hue' when RGB components are not equal as the RGB to HSV conversion loses current hue value when
      // RGB components aare equal (IE it switches to 0 / red).
      if (!this.#isRgbEqual()) { this.#colorStateAccess.stores.hue.set(newHsv.h); }

      this.#colorStateAccess.stores.sv.set({ s: newHsv.s, v: newHsv.v });

      // Hack to have parsed / validated value always take by setting store temporarily to null. This handles the edge
      // case of writable stores not setting the same value. IE when the value is 0 and the user backspaces the number
      // input and the corrected value is `0` again.
      this.#storeSet[index](null);
      this.#storeSet[index](value);

      // Update all other text state modes, but exclude RgbState.
      this.#textStateAccess.updateColorInternal(newHsv, 'rgb');
   }

   /**
    * Updates the internal state from changes in {@link ColorState} current color.
    * Covert to RGB and round values for display in the TextInput component.
    *
    * @param {object}   color - Current color value (HSV currently).
    *
    * @package
    */
   _updateColor(color)
   {
      const rgb = colord(color).toRgb();

      this.#data.r = Math.round(rgb.r);
      this.#data.g = Math.round(rgb.g);
      this.#data.b = Math.round(rgb.b);

      this.#storeSet.r(this.#data.r);
      this.#storeSet.g(this.#data.g);
      this.#storeSet.b(this.#data.b);
   }
}

/**
 * @typedef {object} RgbStateInputData Provides the input data options to use in number input components.
 *
 * @property {object} r - Red input component data.
 *
 * @property {object} g - Green input component data.
 *
 * @property {object} b - Blue input component data.
 */

/**
 * @typedef {object} RgbStateStores Provides the buffered stores to use in text input components.
 *
 * @property {import('svelte/store').Writable<number|null>} r - Red component value.
 *
 * @property {import('svelte/store').Writable<number|null>} g - Green component value.
 *
 * @property {import('svelte/store').Writable<number|null>} b - Blue component value.
 */
