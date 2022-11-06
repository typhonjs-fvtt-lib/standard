import { colord }          from '@typhonjs-fvtt/runtime/color/colord';
import { propertyStore }   from '@typhonjs-fvtt/runtime/svelte/store';

export class ColorState
{
   /**
    * Delta time in milliseconds determining
    *
    * @type {number}
    */
   static #delta = 250; //

   #data = {
      hex: '#ff0000',
      hexNoAlpha: '#ff0000',
      hsv: { h: 0, s: 100, v: 100, a: 1 },
   };

   #lastTime = 0;

   #stores

   /**
    * Stores the subscribers.
    *
    * @type {(function(object): void)[]}
    */
   #subscriptions = [];

   constructor()
   {
      this.#stores = {
         hex: propertyStore(this, 'hex'),
         hexNoAlpha: propertyStore(this, 'hexNoAlpha'),
         hsv: propertyStore(this, 'hsv'),
      }
   }

   /**
    * @returns {object} hsv(a) object.
    */
   get hex() { return this.#data.hex; }

   set hex(hex)
   {
      this.#stores.hex.set(hex);
   }

   /**
    * @returns {object} hsv(a) object.
    */
   get hexNoAlpha() { return this.#data.hexNoAlpha; }

   set hexNoAlpha(hexNoAlpha)
   {
      this.#stores.hexNoAlpha.set(hexNoAlpha);
   }

   /**
    * @returns {object} hsv(a) object.
    */
   get hsv() { return this.#data.hsv; }

   set hsv(hsv)
   {
      this.#stores.hsv.set(hsv);
   }

   get stores()
   {
      return this.#stores;
   }

   getExternalColor()
   {
      return this.#data.hsv;
   }

   isExternalUpdate()
   {
      const result = (globalThis.performance.now() - this.#lastTime) > ColorState.#delta;

console.log(`!! ColorState - isExternalUpdate - elapsedTime: ${(globalThis.performance.now() - this.#lastTime)}; result: `, result);

      return result;

      // return (globalThis.performance.now() - this.#lastTime) > ColorState.#delta;
   }

   set(data)
   {
console.log(`!! ColorState - set - data: `, data);

      const colordInstance = colord(data.hsv);

      this.#data.hsv = data.hsv;
      this.#data.hex = colordInstance.toHex();
      this.#data.hexNoAlpha = this.#data.hex.substring(0, 7);

      this.#lastTime = globalThis.performance.now();

      this.#updateSubscribers();
   }

   updateExternal(extColor)
   {
      if (!this.isExternalUpdate()) { return; }

console.log(`!! ColorState - updateExternal - data: `, extColor);

      const colordInstance = colord(extColor);

      if (!colordInstance.isValid())
      {
         console.warn(`TJSColorPicker warning: 'color' prop set externally is not valid; '${extColor}'.`)
         return;
      }

      this.set({ hsv: colordInstance.toHsv() });
   }

   // Store subscriber implementation --------------------------------------------------------------------------------

   /**
    * @param {function(object): void} handler - Callback function that is invoked on update / changes.
    *
    * @returns {(function(): void)} Unsubscribe function.
    */
   subscribe(handler)
   {
      this.#subscriptions.push(handler); // add handler to the array of subscribers

      handler(this.#data);                     // call handler with current value

      // Return unsubscribe function.
      return () =>
      {
         const index = this.#subscriptions.findIndex((sub) => sub === handler);
         if (index >= 0) { this.#subscriptions.splice(index, 1); }
      };
   }

   /**
    * Updates subscribers.
    */
   #updateSubscribers()
   {
      const data = this.#data;
      for (let cntr = 0; cntr < this.#subscriptions.length; cntr++) { this.#subscriptions[cntr](data); }
   }
}

/**
 * @typedef {object} ColorStateStores
 *
 * @property {import('svelte/store').Writable<string>} hex - The hex color.
 *
 * @property {import('svelte/store').Writable<{ h: number, s: number, v: number, a: number }>} hsv - The HSVA color
 *
 * @property {import('svelte/store').Writable<{ r: number, g: number, b: number, a: number }>} rgb - The RGBA color
 */
