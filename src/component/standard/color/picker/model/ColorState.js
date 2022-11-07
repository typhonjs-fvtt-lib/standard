import { tick }                  from 'svelte';

import { writable }              from 'svelte/store';

import { colord }                from '@typhonjs-fvtt/runtime/color/colord';
import { subscribeIgnoreFirst }  from '@typhonjs-fvtt/runtime/svelte/store';
import { isObject }              from '@typhonjs-fvtt/runtime/svelte/util';

export class ColorState
{
   /**
    * Delta time in milliseconds determining
    *
    * @type {number}
    */
   static #delta = 250; //

   #data = {
      alpha: 1,
      hue: 0,
      rgbString: 'rgb(255, 0, 0)',
      rgbHueString: 'rgb(255, 0, 0)',
      rgbaString: 'rgba(255, 0, 0, 1)',
      sv: { s: 100, v: 100 },
      outputColor: { h: 0, s: 100, v: 100, a: 1 }
   };

   #lastTime = 0;

   // #outputColor = { h: 0, s: 100, v: 100, a: 1 };

   /** @type {ColorStateStores} */
   #stores;

   #storeSet;

   /**
    * Stores the subscribers.
    *
    * @type {(function(object): void)[]}
    */
   #subscriptions = [];

   #unsubscribe = [];

   #internalUpdate = {
      h: void 0,
      sv: void 0,
      a: void 0
   };

   constructor($$props)
   {
      this.#validateProps($$props);

      const tempStoreRGBString = writable(this.#data.rgbString);
      const tempStoreRGBHueString = writable(this.#data.rgbHueString);
      const tempStoreRGBAString = writable(this.#data.rgbaString);
      const tempStoreOutputColor = writable(this.#data.outputColor);

      this.#storeSet = {
         rgbString: tempStoreRGBString.set,
         rgbHueString: tempStoreRGBHueString.set,
         rgbaString: tempStoreRGBAString.set,
         outputColor: tempStoreOutputColor.set
      }

      this.#stores = {
         alpha: writable(this.#data.alpha),
         hue: writable(this.#data.hue),
         rgbString: { subscribe: tempStoreRGBString.subscribe },
         rgbHueString: { subscribe: tempStoreRGBHueString.subscribe },
         rgbaString: { subscribe: tempStoreRGBAString.subscribe },
         sv: writable(this.#data.sv),
         outputColor: { subscribe: tempStoreOutputColor.subscribe }
      }

      this.#unsubscribe.push(this.#stores.alpha.subscribe((a) =>
      {
         // await tick();
         this.#updateOutputColor({ a })
      }));

      this.#unsubscribe.push(this.#stores.hue.subscribe((h) => {
         // await tick();
         this.#updateOutputColor({ h })
      }));

      this.#unsubscribe.push(this.#stores.sv.subscribe((sv) =>
      {
         // await tick();
         this.#updateOutputColor({ sv })
      }));

      // this.#unsubscribe.push(subscribeIgnoreFirst(this.#stores.alpha, (a) =>
      // {
      //    // await tick();
      //    this.#updateOutputColor({ a })
      // }));
      //
      // this.#unsubscribe.push(subscribeIgnoreFirst(this.#stores.hue, (h) => {
      //    // await tick();
      //    this.#updateOutputColor({ h })
      // }));
      //
      // this.#unsubscribe.push(subscribeIgnoreFirst(this.#stores.sv, (sv) =>
      // {
      //    // await tick();
      //    this.#updateOutputColor({ sv })
      // }));
   }

   destroy()
   {
      for (const unsubscribe of this.#unsubscribe) { unsubscribe(); }
   }

   #updateOutputColor({ h = this.#data.hue, sv = this.#data.sv, a = this.#data.alpha  })
   {
      const newHSV = { h, s: sv.s, v: sv.v, a };

console.log(`!! Color - #updateOutputColor - newHSV: `, newHSV);
console.trace();

      const colordInstance = colord(newHSV);

      this.#data.hue = h;
      this.#data.sv = sv;
      this.#data.alpha = a;
      this.#data.outputColor = newHSV;

      this.#data.rgbString = colordInstance.alpha(1).toRgbString();
      this.#data.rgbHueString = colord({ h, s: 100, v: 100, a: 1 }).toRgbString();
      this.#data.rgbaString = colordInstance.toRgbString();

      this.#lastTime = globalThis.performance.now();
      this.#storeSet.outputColor(this.#data.outputColor);

      this.#storeSet.rgbString(this.#data.rgbString);
      this.#storeSet.rgbHueString(this.#data.rgbHueString);
      this.#storeSet.rgbaString(this.#data.rgbaString);

      // this.#updateSubscribers();
   }

   /**
    * @returns {number}
    */
   get alpha()
   {
      return this.#data.alpha;
   }

   /**
    * @returns {number}
    */
   get hue()
   {
      return this.#data.hue;
   }

   get stores()
   {
      return this.#stores;
   }

   /**
    * @returns {{s: number, v: number}}
    */
   get sv()
   {
      return this.#data.sv;
   }

   #isExternalUpdate()
   {
      const result = (globalThis.performance.now() - this.#lastTime) > ColorState.#delta;

console.log(`!! ColorState - isExternalUpdate - elapsedTime: ${(globalThis.performance.now() - this.#lastTime)}; result: `, result);

      return result;

      // return (globalThis.performance.now() - this.#lastTime) > ColorState.#delta;
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

      const newHSV = colordInstance.toHsv();

      if (typeof newHSV.h === 'number')
      {
         this.#stores.hue.set(newHSV.h);
      }

      if (typeof newHSV.s === 'number' && typeof newHSV.v === 'number')
      {
         this.#stores.sv.set({ s: newHSV.s, v: newHSV.v });
      }

      if (typeof newHSV.a === 'number')
      {
         this.#stores.alpha.set(newHSV.a);
      }
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
      // for (let cntr = 0; cntr < this.#subscriptions.length; cntr++) { this.#subscriptions[cntr](this.#outputColor); }
   }

   /**
    * Validates all props ensuring that only one color prop is bound.
    *
    * @param {object}   $$props -
    */
   #validateProps($$props)
   {
console.log(`!! ColorState - #validateProps - 0 - $$props: `, $$props)

      if (isObject($$props?.color) || typeof $$props?.color === 'string')
      {
         const colordInstance = colord($$props.color);

         if (colordInstance.isValid())
         {
            const newHSV = colordInstance.toHsv();

console.log(`!! ColorState - #validateProps - 1 - newHSV: `, newHSV)

            this.#data.hue = newHSV.h;
            this.#data.sv = { s: newHSV.s, v: newHSV.v };
            this.#data.alpha = newHSV.a

            this.#data.outputColor = newHSV;

            this.#data.rgbString = colordInstance.alpha(1).toRgbString();
            this.#data.rgbHueString = colord({ h: newHSV.h, s: 100, v: 100, a: 1 }).toRgbString();
            this.#data.rgbaString = colordInstance.toRgbString();

console.log(`!! ColorState - #validateProps - 2 - this.#data: `, this.#data)
         }
         else
         {
            console.warn(`TJSColorPicker warning: bound 'color' prop is not a valid color; '${$$props.color}`);
         }
      }

   }
}

/**
 * @typedef {object} ColorStateStores
 *
 * @property {import('svelte/store').Writable<number>} alpha - The current alpha value (0 - 1).
 *
 * @property {import('svelte/store').Writable<number>} hue - The current hue value (0 - 360).
 *
 * @property {import('svelte/store').Readable<string>} rgbString - The current color / RGB only string.
 *
 * @property {import('svelte/store').Readable<string>} rgbHueString - The current color hue / RGB only string.
 *
 * @property {import('svelte/store').Readable<string>} rgbaString - The current color / RGBA only string.
 *
 * @property {import('svelte/store').Writable<{ s: number, v: number }>} sv - The saturation / value pair for HSV components.
 */
