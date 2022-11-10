export class HsvState
{
   /** @type {{ h: number, s: number, v: number}} */
   #data;

   #colorState;
   #textStateUpdate

   constructor(colorState, textStateUpdate)
   {
      this.#data = { h: 0, s: 100, v: 100 };

      this.#colorState = colorState;
      this.#textStateUpdate = textStateUpdate;
   }

   /**
    * @returns {{ h: number, s: number, v: number}}
    */
   get data()
   {
      return this.#data;
   }

   /**
    * @returns {number}
    */
   get h()
   {
      return this.#data.h;
   }

   /**
    * @returns {number}
    */
   get s()
   {
      return this.#data.s;
   }

   /**
    * @returns {number}
    */
   get v()
   {
      return this.#data.v;
   }

   /**
    * @param {string|number}  value - New hue component.
    */
   set h(value)
   {
      const typeofValue = typeof value;

      if (typeofValue !== 'string' && typeofValue !== 'number')
      {
         throw new TypeError(`HsvState 'set h' error: 'value' is not a string or number.`);
      }

      if (!this.isValidHue(value)) { return; }

      let parsedValue = value;

      if (typeofValue === 'string') { parsedValue = globalThis.parseFloat(value); }

      this.#data.h = parsedValue;

      this.#colorState.internalUpdate.textUpdate = true;

      // Update hue and sv component stores w/ parsed data.
      this.#colorState.stores.hue.set(this.#data.h);

      this.#textStateUpdate.color(this.#data, 'hsv');
   }

   /**
    * @param {string|number}  value - New saturation component.
    */
   set s(value)
   {
      const typeofValue = typeof value;

      if (typeofValue !== 'string' && typeofValue !== 'number')
      {
         throw new TypeError(`HsvState 'set s' error: 'value' is not a string or number.`);
      }

      if (!this.isValidSV(value)) { return; }

      let parsedValue = value;

      if (typeofValue === 'string') { parsedValue = globalThis.parseFloat(value); }

      this.#data.s = parsedValue;

      this.#colorState.internalUpdate.textUpdate = true;

      // Update hue and sv component stores w/ parsed data.
      this.#colorState.stores.sv.set({ s: this.#data.s, v: this.#data.v });

      this.#textStateUpdate.color(this.#data, 'hsv');
   }

   /**
    * @param {string|number}  value - New value component.
    */
   set v(value)
   {
      const typeofValue = typeof value;

      if (typeofValue !== 'string' && typeofValue !== 'number')
      {
         throw new TypeError(`HsvState 'set v' error: 'value' is not a string or number.`);
      }

      if (!this.isValidSV(value)) { return; }

      let parsedValue = value;

      if (typeofValue === 'string') { parsedValue = globalThis.parseFloat(value); }

      this.#data.v = parsedValue;

      this.#colorState.internalUpdate.textUpdate = true;

      // Update hue and sv component stores w/ parsed data.
      this.#colorState.stores.sv.set({ s: this.#data.s, v: this.#data.v });

      this.#textStateUpdate.color(this.#data, 'hsv');
   }

   /**
    * Determines if the given value is a valid hue component from 0-360 either as a number or string.
    *
    * @param {string|number}  value - value to test.
    *
    * @returns {boolean} Is a valid hue value.
    */
   isValidHue(value)
   {
      const typeofValue = typeof value;

      if (typeofValue !== 'string' && typeofValue !== 'number') { return false; }

      let parsedValue = value;

      if (typeofValue === 'string') { parsedValue = globalThis.parseFloat(value); }

      if (parsedValue === Number.NaN) { return false; }

      return parsedValue >= 0 && parsedValue <= 360;
   }

   /**
    * Determines if the given value is a valid saturation or value component from 0-100 either as a number or string.
    *
    * @param {string|number}  value - value to test.
    *
    * @returns {boolean} Is a valid saturation / value component.
    */
   isValidSV(value)
   {
      const typeofValue = typeof value;

      if (typeofValue !== 'string' && typeofValue !== 'number') { return false; }

      let parsedValue = value;

      if (typeofValue === 'string') { parsedValue = globalThis.parseFloat(value); }

      if (parsedValue === Number.NaN) { return false; }

      return parsedValue >= 0 && parsedValue <= 100;
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
      this.#data.h = Math.round(color.h);
      this.#data.s = Math.round(color.s);
      this.#data.v = Math.round(color.v);
   }
}
