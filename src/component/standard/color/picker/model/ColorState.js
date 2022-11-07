import { writable }        from 'svelte/store';

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
      hsv: { h: 0, s: 100, v: 100, a: 1 },
      rgbString: 'rgb(255, 0, 0)',
      rgbHueString: 'rgb(255, 0, 0)',
      rgbaString: 'rgba(255, 0, 0, 1)'
   };

   #lastTime = 0;

   #outputColor;

   /** @type {ColorStateStores} */
   #stores;

   #storeSet;

   /**
    * Stores the subscribers.
    *
    * @type {(function(object): void)[]}
    */
   #subscriptions = [];

   constructor($$props)
   {
      this.#validateProps($$props);

      const tempStoreRGBString = writable(this.#data.rgbString);
      const tempStoreRGBHueString = writable(this.#data.rgbHueString);
      const tempStoreRGBAString = writable(this.#data.rgbaString);

      this.#storeSet = {
         rgbString: tempStoreRGBString.set,
         rgbHueString: tempStoreRGBHueString.set,
         rgbaString: tempStoreRGBAString.set
      }

      this.#stores = {
         hsv: propertyStore(this, 'hsv'),
         rgbString: { subscribe: tempStoreRGBString.subscribe },
         rgbHueString: { subscribe: tempStoreRGBHueString.subscribe },
         rgbaString: { subscribe: tempStoreRGBAString.subscribe },
      }
   }

   get stores()
   {
      return this.#stores;
   }

   getExternalColor()
   {
      return this.#outputColor;
   }

   #isExternalUpdate()
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

      this.#data.rgbString = colordInstance.alpha(1).toRgbString();
      this.#data.rgbHueString = colord({ h: this.#data.hsv.h, s: 100, v: 100, a: 1 }).toRgbString();
      this.#data.rgbaString = colordInstance.toRgbString();

      this.#storeSet.rgbString(this.#data.rgbString);
      this.#storeSet.rgbHueString(this.#data.rgbHueString);
      this.#storeSet.rgbaString(this.#data.rgbaString);

      this.#outputColor = this.#data.hsv;

      this.#lastTime = globalThis.performance.now();

      this.#updateSubscribers();
   }

   updateExternal(extColor)
   {
      if (!this.#isExternalUpdate()) { return; }

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

   /**
    * Validates all props ensuring that only one color prop is bound.
    *
    * @param {object}   $$props -
    */
   #validateProps($$props)
   {
      console.log(`!! ColorState - #validateProps - $$props: `, $$props)
   }
}

/**
 * @typedef {object} ColorStateStores
 *
 * @property {import('svelte/store').Readable<string>} hex - The hex color.
 *
 * @property {import('svelte/store').Readable<string>} hexNoAlpha - The hex color without alpha.
 *
 * @property {import('svelte/store').Writable<{ h: number, s: number, v: number, a: number }>} hsv - The HSVA color
 */
