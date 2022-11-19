import { writable }  from 'svelte/store';

import { colord }    from '@typhonjs-fvtt/runtime/color/colord';

// TODO REFACTOR TO TOP LEVEL OPTION
import { rippleFocus } from '@typhonjs-fvtt/svelte-standard/action';

/**
 * Provides a buffered set of stores converting the current color from {@link ColorState} into rounded HSL component
 * values for display in the {@link TextInput} component. These HSL component stores have an overridden set method that
 * validate updates from the number inputs they are assigned to keeping number ranges between `0-360` for hue / h and
 * s / l (0 - 100). Also handling the case when the number input is `null` which occurs when the user removes all input
 * values or inputs `-` a minus character, etc. In that case `0` is substituted for `null`.
 */
export class HslState
{
   /** @type {{ h: number, s: number, l: number}} */
   #data;

   /** @type {ColorStateAccess} */
   #colorStateAccess;

   /** @type {TextStateAccess} */
   #textStateAccess;

   /** @type {HslStateInputData} */
   #inputData;

   /** @type {HslStateStores} */
   #stores;

   /**
    * Stores the original writable set methods.
    *
    * @type {{h: Function, s: Function, l: Function}}
    */
   #storeSet = {};

   /**
    * @param {ColorStateAccess}  colorStateAccess -
    *
    * @param {TextStateAccess}   textStateAccess -
    */
   constructor(colorStateAccess, textStateAccess)
   {
      this.#data = { h: 0, s: 100, l: 50 };

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

      const l = writable(this.#data.l);
      this.#storeSet.l = l.set;
      l.set = (value) => this.#updateComponent(value, 'l');

      this.#stores = { h, s, l };

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
         l: {
            store: l,
            efx: rippleFocus(),
            type: 'number',
            min: 0,
            max: 100,
            options: {
               blurOnEnterKey: true,
               cancelOnEscKey: true
            },
            aria: {
               label: 'luminance chanel color'
            }
         }
      }
   }

   /**
    * @returns {HslStateInputData} HSL input component data.
    */
   get inputData()
   {
      return this.#inputData;
   }

   /**
    * @returns {HslStateStores} HSV text state stores.
    */
   get stores()
   {
      return this.#stores;
   }

   /**
    * @param {number|null} value - A HSL component value to validate and update.
    *
    * @param {'h'|'s'|'l'} index - HSL component index.
    */
   #updateComponent(value, index)
   {
      // Handle case when all number input is removed or invalid and value is null.
      if (value === null) { value = 0; }

      if (typeof value !== 'number') { throw new TypeError(`HslState 'set ${index}' error: 'value' is not a number.`); }

      // Validate that input values; h (0-360) / s & l (0 - 100).
      if (value === Number.NaN) { value = 0; }
      if (value < 0) { value = 0; }

      switch (index)
      {
         case 'h':
            if (value > 360) { value = 360; }
            break;

         case 's':
         case 'l':
            if (value > 100) { value = 100; }
            break;
      }

      // Set the `textUpdate` flag to true so when ColorState.#updateCurrentColor executes it does not update
      // TextState.
      this.#colorStateAccess.internalUpdate.textUpdate = true;

      // Update local component value.
      this.#data[index] = value;

      // Update ColorState hue and sv component stores w/ parsed local HSL component data.
      const newHsv = colord(this.#data).toHsv(5);

      // The colord conversion will not maintain hue when `s` or `l` is `0`.
      if (this.#data.s === 0 || this.#data.l === 0) { newHsv.h = this.#data.h; }

      // The colord conversion will covert a hue of `360` to `0` wrapping around.
      if (this.#data.h === 360) { newHsv.h = 360; }

      // Update the appropriate ColorState store.
      switch (index)
      {
         case 'h':
            this.#colorStateAccess.stores.hue.set(newHsv.h);
            break;

         case 's':
         case 'l':
            this.#colorStateAccess.stores.sv.set({ s: newHsv.s, v: newHsv.v });
            break;
      }

      // Hack to have parsed / validated value always take by setting store temporarily to null. This handles the edge
      // case of writable stores not setting the same value. IE when the value is 0 and the user backspaces the number
      // input and the corrected value is `0` again.
      this.#storeSet[index](null);
      this.#storeSet[index](value);

      // Update all other text state modes, but exclude HslState.
      this.#textStateAccess.updateColorInternal(newHsv, 'hsl');
   }

   /**
    * Updates the internal state from changes in {@link ColorState} current color.
    * Covert to HSL and round values for display in the TextInput component.
    *
    * @param {object}   color - Current color value (HSV currently).
    *
    * @package
    */
   _updateColor(color)
   {
      const hsl = colord(color).toHsl();

      // The colord conversion will not maintain hue when `s` or `v` is `0`.
      if (hsl.h === 0 && hsl.s === 0) { hsl.h = color.h; }

      // The colord conversion will covert a hue of `360` to `0` wrapping around.
      if (color.h === 360) { hsl.h = 360; }

      this.#data.h = Math.round(hsl.h);
      this.#data.s = Math.round(hsl.s);
      this.#data.l = Math.round(hsl.l);

      this.#storeSet.h(this.#data.h);
      this.#storeSet.s(this.#data.s);
      this.#storeSet.l(this.#data.l);
   }
}

/**
 * @typedef {object} HslStateInputData Provides the input data options to use in number input components.
 *
 * @property {object} h - Hue input component data.
 *
 * @property {object} s - Saturation input component data.
 *
 * @property {object} l - Luminance input component data.
 */

/**
 * @typedef {object} HslStateStores Provides the buffered stores to use in text input components.
 *
 * @property {import('svelte/store').Writable<number|null>} h - Hue component value.
 *
 * @property {import('svelte/store').Writable<number|null>} s - Saturation component value.
 *
 * @property {import('svelte/store').Writable<number|null>} l - Luminance component value.
 */
