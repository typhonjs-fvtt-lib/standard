import { writable } from 'svelte/store';

// TODO REFACTOR TO TOP LEVEL OPTION
import { rippleFocus } from '@typhonjs-fvtt/svelte-standard/action';

/**
 * Provides a buffered set of stores converting the current color from color state into a rounded alpha
 * value for display in the {@link TextInput} component. The alpha component store has an overridden set method that
 * validate updates from the number inputs they are assigned to keeping number ranges between `0-1`.
 * Also handling the case when the number input is `null` which occurs when the user removes all input
 * values or inputs `-` a minus character, etc. In that case `0` is substituted for `null`.
 *
 * Note: Alpha state changes do not set `#colorStateAccess.internalUpdate.textUpdate` to true.
 */
export class AlphaState
{
   /** @type {number} */
   #alpha;

   /** @type {ColorStateAccess} */
   #colorStateAccess;

   /** @type {TextStateAccess} */
   #textStateAccess;

   /** @type {AlphaStateInputData} */
   #inputData;

   /** @type {AlphaStateStores} */
   #stores;

   /**
    * Stores the original writable set methods.
    *
    * @type {Function}
    */
   #storeSet;

   /**
    * @param {ColorStateAccess}  colorStateAccess -
    *
    * @param {TextStateAccess}   textStateAccess -
    */
   constructor(colorStateAccess, textStateAccess)
   {
      this.#alpha = 1;

      this.#colorStateAccess = colorStateAccess;
      this.#textStateAccess = textStateAccess;

      // Setup custom stores that swap out the writable set method invoking `#updateComponent` that after
      // validation of new component data invokes the original set method.
      const alpha = writable(this.#alpha);
      this.#storeSet = alpha.set;
      alpha.set = (value) => this.#updateComponent(value);

      this.#stores = { alpha };

      this.#inputData = {
         alpha: {
            store: alpha,
            efx: rippleFocus(),
            type: 'number',
            min: 0,
            max: 1,
            step: 0.01,
            options: {
               blurOnEnterKey: true,
               cancelOnEscKey: true
            },
            aria: {
               label: 'transparency chanel color'
            }
         }
      }
   }

   /**
    * @returns {AlphaStateInputData} Alpha input component data.
    */
   get inputData()
   {
      return this.#inputData;
   }

   /**
    * @returns {AlphaStateStores} Alpha text state stores.
    */
   get stores()
   {
      return this.#stores;
   }

   /**
    * @param {number|null} value - An alpha component value to validate and update.
    */
   #updateComponent(value)
   {
      // Handle case when all number input is removed or invalid and value is null.
      if (value === null) { value = 1; }

      if (typeof value !== 'number') { throw new TypeError(`AlphaState 'set' error: 'value' is not a number.`); }

      // Validate that input values; (0-1).
      if (value === Number.NaN) { value = 1; }
      if (value < 0) { value = 0; }
      if (value > 1) { value = 1; }

      // Update local component value.
      this.#alpha = value;

      this.#colorStateAccess.stores.alpha.set(this.#alpha);

      // Hack to have parsed / validated value always take by setting store temporarily to null. This handles the edge
      // case of writable stores not setting the same value. IE when the value is 0 and the user backspaces the number
      // input and the corrected value is `0` again.
      this.#storeSet(null);
      this.#storeSet(value);
   }

   /**
    * Updates the internal state from changes in color state current color.
    *
    * @param {object}   color - Current color value (HSV currently).
    *
    * @package
    */
   _updateColor(color)
   {
      this.#alpha = typeof color.a === 'number' ? Math.round(color.a * 100) / 100 : 1;

      this.#storeSet(this.#alpha);
   }
}

/**
 * @typedef {object} AlphaStateInputData Provides the input data options to use in number input components.
 *
 * @property {object} alpha - Alpha input component data.
 */

/**
 * @typedef {object} AlphaStateStores Provides the buffered stores to use in number input components.
 *
 * @property {import('svelte/store').Writable<number|null>} alpha - Alpha component value.
 */
