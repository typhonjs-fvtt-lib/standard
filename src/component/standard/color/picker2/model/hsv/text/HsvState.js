import { writable }     from 'svelte/store';

// TODO REFACTOR TO TOP LEVEL OPTION
import { rippleFocus }  from '@typhonjs-fvtt/svelte-standard/action';

/**
 * Provides a buffered set of stores converting the current color from {@link ColorState} into rounded HSV component
 * values for display in the {@link TextInput} component. These HSV component stores have an overridden set method that
 * validate updates from the number inputs they are assigned to keeping number ranges between `0-360` for hue / h and
 * s / v (0 - 100). Also handling the case when the number input is `null` which occurs when the user removes all input
 * values or inputs `-` a minus character, etc. In that case `0` is substituted for `null`.
 */
export class HsvState
{
   /** @type {{ h: number, s: number, v: number}} */
   #data;

   /** @type {ColorStateAccess} */
   #colorStateAccess;

   /** @type {TextStateAccess} */
   #textStateAccess;

   /** @type {HsvStateInputData} */
   #inputData;

   /** @type {HsvStateStores} */
   #stores;

   /**
    * Stores the original writable set methods.
    *
    * @type {{h: Function, s: Function, v: Function}}
    */
   #storeSet = {};

   /**
    * @param {ColorStateAccess}  colorStateAccess -
    *
    * @param {TextStateAccess}   textStateAccess -
    */
   constructor(colorStateAccess, textStateAccess)
   {
      this.#data = { h: 0, s: 100, v: 100 };

      this.#colorStateAccess = colorStateAccess;
      this.#textStateAccess = textStateAccess;

      // Setup custom stores that swap out the writable set method invoking `#updateComponent` that after
      // validation of new component data invokes the original set method.
      const h = writable(this.#data.h);
      this.#storeSet.h = h.set;
      h.set = (value) => this.#updateComponent(value, 'h');

      const s = writable(this.#data.s);
      this.#storeSet.s = s.set;
      s.set = (value) => this.#updateComponent(value, 's');

      const v = writable(this.#data.v);
      this.#storeSet.v = v.set;
      v.set = (value) => this.#updateComponent(value, 'v');

      this.#stores = { h, s, v };

      this.#inputData = {
         h: {
            store: h,
            efx: rippleFocus(),
            type: 'number',
            min: 0,
            max: 360,
            options: {
               blurOnEnterKey: true,
               cancelOnEscKey: true
            },
            aria: {
               label: 'hue chanel color'
            }
         },
         s: {
            store: s,
            efx: rippleFocus(),
            type: 'number',
            min: 0,
            max: 100,
            options: {
               blurOnEnterKey: true,
               cancelOnEscKey: true
            },
            aria: {
               label: 'saturation chanel color'
            }
         },
         v: {
            store: v,
            efx: rippleFocus(),
            type: 'number',
            min: 0,
            max: 100,
            options: {
               blurOnEnterKey: true,
               cancelOnEscKey: true
            },
            aria: {
               label: 'brightness chanel color'
            }
         }
      }
   }

   /**
    * @returns {HsvStateInputData} HSV input component data.
    */
   get inputData()
   {
      return this.#inputData;
   }

   /**
    * @returns {HsvStateStores} HSV text state stores.
    */
   get stores()
   {
      return this.#stores;
   }

   /**
    * @param {number|null} value - A HSV component value to validate and update.
    *
    * @param {'h'|'s'|'v'} index - HSV component index.
    */
   #updateComponent(value, index)
   {
      // Handle case when all number input is removed or invalid and value is null.
      if (value === null) { value = 0; }

      if (typeof value !== 'number') { throw new TypeError(`HsvState 'set ${index}' error: 'value' is not a number.`); }

      // Validate that input values; h (0-360) / s & v (0 - 100).
      if (value === Number.NaN) { value = 0; }
      if (value < 0) { value = 0; }

      switch (index)
      {
         case 'h':
            if (value > 360) { value = 360; }
            break;

         case 's':
         case 'v':
            if (value > 100) { value = 100; }
            break;
      }

      // Set the `textUpdate` flag to true so when ColorState.#updateCurrentColor executes it does not update
      // TextState.
      this.#colorStateAccess.internalUpdate.textUpdate = true;

      // Update local component value.
      this.#data[index] = value;

      // Update the appropriate ColorState store.
      switch (index)
      {
         case 'h':
            this.#colorStateAccess.stores.hue.set(this.#data.h);
            break;

         case 's':
         case 'v':
            this.#colorStateAccess.stores.sv.set({ s: this.#data.s, v: this.#data.v });
            break;
      }

      // Hack to have parsed / validated value always take by setting store temporarily to null. This handles the edge
      // case of writable stores not setting the same value. IE when the value is 0 and the user backspaces the number
      // input and the corrected value is `0` again.
      this.#storeSet[index](null);
      this.#storeSet[index](value);

      // Update all other text state modes, but exclude RgbState.
      this.#textStateAccess.updateColorInternal(this.#data, 'hsv');
   }

   /**
    * Updates the internal state from changes in {@link ColorState} current color.
    * Covert to HSV and round values for display in the TextInput component.
    *
    * @param {object}   color - Current color value (HSV currently).
    *
    * @package
    */
   _updateColor(color)
   {
      this.#data.h = Math.round(color.h);
      this.#data.s = Math.round(color.s);
      this.#data.v = Math.round(color.v);

      this.#storeSet.h(this.#data.h);
      this.#storeSet.s(this.#data.s);
      this.#storeSet.v(this.#data.v);
   }
}

/**
 * @typedef {object} HsvStateInputData Provides the input data options to use in number input components.
 *
 * @property {object} h - Hue input component data.
 *
 * @property {object} s - Saturation input component data.
 *
 * @property {object} v - Value / Brightness value input component data.
 */

/**
 * @typedef {object} HsvStateStores Provides the buffered stores to use in text input components.
 *
 * @property {import('svelte/store').Writable<number|null>} h - Hue component value.
 *
 * @property {import('svelte/store').Writable<number|null>} s - Saturation component value.
 *
 * @property {import('svelte/store').Writable<number|null>} v - Value / brightness component value.
 */
