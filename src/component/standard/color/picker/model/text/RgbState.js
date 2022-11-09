import { colord } from '@typhonjs-fvtt/runtime/color/colord';

export class RgbState
{
   /** @type {{ r: number, g: number, b: number}} */
   #data;

   #colorState;
   #internalUpdate;
   #updateSubscribers

   constructor(colorState, internalUpdate, updateSubscribers)
   {
      this.#data = { r: 255, g: 0, b: 0 };

      this.#colorState = colorState;
      this.#internalUpdate = internalUpdate;
      this.#updateSubscribers = updateSubscribers;
   }

   /**
    * @returns {{r: number, g: number, b: number}}
    */
   get data()
   {
      return this.#data;
   }

   /**
    * @returns {number}
    */
   get r()
   {
      return this.#data.r;
   }

   /**
    * @returns {number}
    */
   get g()
   {
      return this.#data.g;
   }

   /**
    * @returns {number}
    */
   get b()
   {
      return this.#data.b;
   }

   get #hsv()
   {
      return colord(this.#data).toHsv();
   }

   /**
    * @param {number}   value - new red component.
    */
   set r(value)
   {
      const typeofValue = typeof value;

      if (typeofValue !== 'string' && typeofValue !== 'number')
      {
         throw new TypeError(`RgbInt 'set r' error: 'value' is not a string or number.`);
      }

      if (!this.isValidComponent(value)) { return; }

      let parsedValue = value;

      if (typeofValue === 'string') { parsedValue = globalThis.parseFloat(value); }

      this.#data.r = parsedValue;

      this.#internalUpdate.textUpdate = true;

      // Update hue and sv component stores w/ parsed data.
      const newHsv = this.#hsv;
      this.#colorState.stores.hue.set(newHsv.h);
      this.#colorState.stores.sv.set({ s: newHsv.s, v: newHsv.v });

      this.#updateSubscribers();
   }

   /**
    * @param {number}   value - new green component.
    */
   set g(value)
   {
      const typeofValue = typeof value;

      if (typeofValue !== 'string' && typeofValue !== 'number')
      {
         throw new TypeError(`RgbInt 'set g' error: 'value' is not a string or number.`);
      }

      if (!this.isValidComponent(value)) { return; }

      let parsedValue = value;

      if (typeofValue === 'string') { parsedValue = globalThis.parseFloat(value); }

      this.#data.g = parsedValue;

      this.#internalUpdate.textUpdate = true;

      // Update hue and sv component stores w/ parsed data.
      const newHsv = this.#hsv;
      this.#colorState.stores.hue.set(newHsv.h);
      this.#colorState.stores.sv.set({ s: newHsv.s, v: newHsv.v });

      this.#updateSubscribers();
   }

   /**
    * @param {number}   value - new blue component.
    */
   set b(value)
   {
      const typeofValue = typeof value;

      if (typeofValue !== 'string' && typeofValue !== 'number')
      {
         throw new TypeError(`RgbInt 'set b' error: 'value' is not a string or number.`);
      }

      if (!this.isValidComponent(value)) { return; }

      let parsedValue = value;

      if (typeofValue === 'string') { parsedValue = globalThis.parseFloat(value); }

      this.#data.b = parsedValue;

      this.#internalUpdate.textUpdate = true;

      // Update hue and sv component stores w/ parsed data.
      const newHsv = this.#hsv;
      this.#colorState.stores.hue.set(newHsv.h);
      this.#colorState.stores.sv.set({ s: newHsv.s, v: newHsv.v });

      this.#updateSubscribers();
   }

   /**
    * Determines if the given value is a valid RGB component from 0-255 either as a number or string.
    *
    * @param value
    * @returns {boolean}
    */
   isValidComponent(value)
   {
      const typeofValue = typeof value;

      if (typeofValue !== 'string' && typeofValue !== 'number') { return false; }

      let parsedValue = value;

      if (typeofValue === 'string') { parsedValue = globalThis.parseFloat(value); }

      if (parsedValue === Number.NaN) { return false; }

      return parsedValue >= 0 && parsedValue <= 255;
   }

   /**
    * Updates the internal state.
    *
    * @param {ColorD}   color - ColorD instance.
    *
    * @package
    */
   _updateColor(color)
   {
      const rgb = color.toRgb();

      this.#data.r = Math.round(rgb.r);
      this.#data.g = Math.round(rgb.g);
      this.#data.b = Math.round(rgb.b);
   }
}
