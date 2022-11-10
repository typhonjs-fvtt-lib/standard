import { writable }  from 'svelte/store';

import { colord }    from '@typhonjs-fvtt/runtime/color/colord';

export class RgbState
{
   /** @type {{ r: number, g: number, b: number}} */
   #data;

   #colorState;
   #textStateUpdate;

   #stores;
   #storeSet = {};

   constructor(colorState, textStateUpdate)
   {
      this.#data = { r: 255, g: 0, b: 0 };

      this.#colorState = colorState;
      this.#textStateUpdate = textStateUpdate;

      const r = writable(this.#data.r);
      this.#storeSet.r = r.set;
      r.set = (value) =>
      {
         const parsedValue = this.#setR(value);

         // Hack to have parsed / validated value always take by setting store temporarily to null.
         this.#storeSet.r(null);
         this.#storeSet.r(parsedValue);
      }

      const g = writable(this.#data.g);
      this.#storeSet.g = g.set;
      g.set = (value) =>
      {
         const parsedValue = this.#setG(value);

         // Hack to have parsed / validated value always take by setting store temporarily to null.
         this.#storeSet.g(null);
         this.#storeSet.g(parsedValue);
      }

      const b = writable(this.#data.b);
      this.#storeSet.b = b.set;
      b.set = (value) =>
      {
         const parsedValue = this.#setB(value);

         // Hack to have parsed / validated value always take by setting store temporarily to null.
         this.#storeSet.b(null);
         this.#storeSet.b(parsedValue);
      }

      this.#stores = { r, g, b };
   }

   get stores()
   {
      return this.#stores;
   }

   get #hsv()
   {
      return colord(this.#data).toHsv();
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
    * @param {string|number|null}   value - new red component.
    *
    * @returns {number} Validated number or null
    */
   #setR(value)
   {
      // Handle case when all number input is removed or invalid and value is null.
      if (value === null) { value = 0; }

      if (typeof value !== 'number') { throw new TypeError(`RgbState 'set r' error: 'value' is not a number.`); }

      // Validate that input values are between `0 - 255`.
      if (value === Number.NaN) { value = 0; }
      if (value < 0) { value = 0; }
      if (value > 255) { value = 255; }

      this.#data.r = value;

      this.#colorState.internalUpdate.textUpdate = true;

      // Update hue and sv component stores w/ parsed data.
      const newHsv = this.#hsv;

      if (!this.#isRgbEqual()) { this.#colorState.stores.hue.set(newHsv.h); }
      this.#colorState.stores.sv.set({ s: newHsv.s, v: newHsv.v });

      this.#textStateUpdate.color(newHsv, 'rgb');

      return value;
   }

   /**
    * @param {string|number|null}   value - new green component.
    *
    * @returns {number} Set successful.
    */
   #setG(value)
   {
      // Handle case when all number input is removed or invalid and value is null.
      if (value === null) { value = 0; }

      if (typeof value !== 'number') { throw new TypeError(`RgbState 'set g' error: 'value' is not a number.`); }

      // Validate that input values are between `0 - 255`.
      if (value === Number.NaN) { value = 0; }
      if (value < 0) { value = 0; }
      if (value > 255) { value = 255; }

      this.#data.g = value;

      this.#colorState.internalUpdate.textUpdate = true;

      // Update hue and sv component stores w/ parsed data.
      const newHsv = this.#hsv;

      if (!this.#isRgbEqual()) { this.#colorState.stores.hue.set(newHsv.h); }
      this.#colorState.stores.sv.set({ s: newHsv.s, v: newHsv.v });

      this.#textStateUpdate.color(newHsv, 'rgb');

      return value;
   }

   /**
    * @param {string|number|null}   value - new blue component.
    *
    * @returns {number} Set successful.
    */
   #setB(value)
   {
      // Handle case when all number input is removed or invalid and value is null.
      if (value === null) { value = 0; }

      if (typeof value !== 'number') { throw new TypeError(`RgbState 'set b' error: 'value' is not a number.`); }

      // Validate that input values are between `0 - 255`.
      if (value === Number.NaN) { value = 0; }
      if (value < 0) { value = 0; }
      if (value > 255) { value = 255; }

      this.#data.b = value;

      this.#colorState.internalUpdate.textUpdate = true;

      // Update hue and sv component stores w/ parsed data.
      const newHsv = this.#hsv;

      if (!this.#isRgbEqual()) { this.#colorState.stores.hue.set(newHsv.h); }
      this.#colorState.stores.sv.set({ s: newHsv.s, v: newHsv.v });

      this.#textStateUpdate.color(newHsv, 'rgb');

      return value;
   }

   /**
    * Updates the internal state.
    *
    * @param {{h: number, s: number, v: number}}   color - ColorD instance.
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
