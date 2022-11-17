import { writable }  from 'svelte/store';

import { colord }    from '@typhonjs-fvtt/runtime/color/colord';

// TODO REFACTOR TO TOP LEVEL OPTION
import { rippleFocus } from '@typhonjs-fvtt/svelte-standard/action';

/**
 * Provides a buffered set of stores converting the current color from {@link ColorState} into a hex values for display
 * in the {@link TextInput} component. The hex store has an overridden set method that validate updates from the text
 * input assigned to it keeping ensuring that the string value is a valid hex color. A validation store `isHexValid`
 * is also available to be able to selectively set a CSS class on the input to notify users when the entered string
 * is not a valid hex color.
 */
export class HexState
{
   /** @type {string} */
   #hex;

   /** @type {ColorStateAccess} */
   #colorStateAccess;

   /** @type {TextStateAccess} */
   #textStateAccess;

   /** @type {HexStateInputData} */
   #inputData;

   /** @type {HexStateStores} */
   #stores;

   /**
    * Stores the original writable set methods.
    *
    * @type {{ hex: Function }}
    */
   #storeSet = {};

   /**
    * @param {ColorStateAccess}  colorStateAccess -
    *
    * @param {TextStateAccess}   textStateAccess -
    */
   constructor(colorStateAccess, textStateAccess)
   {
      this.#hex = '#ff0000';

      this.#colorStateAccess = colorStateAccess;
      this.#textStateAccess = textStateAccess;

      // Setup custom stores that swap out the writable set method invoking `#updateComponent` that after
      // validation of new component data invokes the original set method.
      const hex = writable(this.#hex);
      this.#storeSet.hex = hex.set;
      hex.set = (value) => this.#updateComponent(value);

      const isHexValid = writable(true);
      this.#stores = { hex, isHexValid };

      this.#inputData = {
         hex: {
            store: hex,
            storeIsValid: isHexValid,
            efx: rippleFocus(),
            type: 'text',
            styles: { flex: 3 },
            options: {
               blurOnEnterKey: true,
               cancelOnEscKey: true
            },
            aria: {
               label: 'hex color'
            }
         }
      }
   }

   /**
    * @returns {HexStateInputData} Hex input component data.
    */
   get inputData()
   {
      return this.#inputData;
   }

   /**
    * @returns {HexStateStores} Hex text state stores.
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
   #isRgbEqual(rgb)
   {
      return rgb.r === rgb.g && rgb.r === rgb.b;
   }

   /**
    * @param {string|null} value - A hex value to validate and update.
    */
   #updateComponent(value)
   {
      if (typeof value !== 'string') { value = '#'; }

      // Handle case when all number input is removed or invalid and value is null.
      if (value === '') { value = '#'; }

      // Insert a leading `#` if there is none.
      if (!value.startsWith('#')) { value = `#${value}`; }

      const colordInstance = colord(value);

      if (!colordInstance.isValid())
      {
         this.#storeSet.hex(null);
         this.#storeSet.hex(value);

         this.#stores.isHexValid.set(false);
         return;
      }

      // Set the `textUpdate` flag to true so when ColorState.#updateCurrentColor executes it does not update
      // TextState.
      this.#colorStateAccess.internalUpdate.textUpdate = true;

      // Update local component value.
      this.#hex = colordInstance.toHex();

      // Update ColorState hue and sv component stores w/ parsed local hex color data.
      const newHsv = colordInstance.toHsv(5);

      // Only change 'hue' when RGB components are not equal as the RGB to HSV conversion loses current hue value when
      // RGB components are equal (IE it switches to 0 / red).
      if (!this.#isRgbEqual(colordInstance.toRgb())) { this.#colorStateAccess.stores.hue.set(newHsv.h); }

      this.#colorStateAccess.stores.sv.set({ s: newHsv.s, v: newHsv.v });

      // Set the alpha state when available as hex colors can contain alpha values.
      if (typeof newHsv.a === 'number') { this.#colorStateAccess.stores.alpha.set(newHsv.a); }

      // Hack to have parsed / validated value always take by setting store temporarily to null. This handles the edge
      // case of writable stores not setting the same value. IE when the value is '#' and the user backspaces the text
      // input and the corrected value is `#` again.
      this.#storeSet.hex(null);
      this.#storeSet.hex(value);

      // Set the isHexValid store to true as the hex color is valid.
      this.#stores.isHexValid.set(true);

      // Update all other text state modes, but exclude HexState.
      this.#textStateAccess.updateColorInternal(newHsv, 'hex');
   }

   /**
    * Updates the internal state from changes in {@link ColorState} current color.
    * Covert to a hex color for display in the TextInput component.
    *
    * @param {object}   color - Current color value (HSV currently).
    *
    * @package
    */
   _updateColor(color)
   {
      const hex = colord(color).toHex();

      this.#storeSet.hex(hex);
      this.#stores.isHexValid.set(true);
   }
}

/**
 * @typedef {object} HexStateInputData Provides the input data options to use in text input components.
 *
 * @property {object} hex - Hex input component data.
 */

/**
 * @typedef {object} HexStateStores Provides the buffered stores to use in text input components.
 *
 * @property {import('svelte/store').Writable<string|null>} hex - Hex value.
 *
 * @property {import('svelte/store').Writable<boolean>}     isHexValid - Is current entered hex string valid.
 */
