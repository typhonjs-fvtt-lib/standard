import { writable }  from 'svelte/store';

import { colord }    from '@typhonjs-fvtt/runtime/color/colord';
import {
   debounce,
   isObject }        from '@typhonjs-fvtt/runtime/svelte/util';

import { subscribeIgnoreFirst }    from '@typhonjs-fvtt/runtime/svelte/store';

import { TextState } from './text/TextState.js';

export class ColorState
{
   /**
    * Delta time in milliseconds determining if a change to the color prop in {@link TJSColorPicker} is made externally.
    *
    * @type {number}
    */
   static #delta = 100;

   #data = {
      alpha: 1,
      hue: 0,
      rgbString: 'rgb(255, 0, 0)',
      rgbHueString: 'rgb(255, 0, 0)',
      rgbaString: 'rgba(255, 0, 0, 1)',
      sv: { s: 100, v: 100 },
      currentColor: { h: 0, s: 100, v: 100, a: 1 }
   };

   #lastTime = 0;

   /** @type {ColorStateStores} */
   #stores;

   /**
    * Provides access to the externally "readable" stores set methods.
    *
    * @type {Record<string, Function>}
    */
   #storeSet;

   /**
    * Store unsubscribe functions for alpha, hue, sv stores that are subscribed to internally.
    *
    * @type {Function[]}
    */
   #unsubscribe = [];

   /**
    * The separated store updates for alpha, hue, sv are debounced with a next tick update and this object
    * collates the values for each store update in the same tick. It is reset in #updaateOutputColorDebounce.
    *
    * `rpgInt` determines if the update came from RgbInt and is handled differently in #updateColor.
    *
    * @type {{a: number, sv: {s: number, v: number}, h: number, textUpdate: boolean}}
    */
   #internalUpdate = {
      h: void 0,
      sv: void 0,
      a: void 0,
      textUpdate: false
   };

   /**
    * Debounces {@link ColorState.#updateCurrentColor} with a 0ms delay. This is invoked by the independent alpha, hue,
    * sv stores on the internal handlers to
    *
    * @type {Function}
    */
   #updateCurrentColorDebounce;

   constructor($$props)
   {
      this.#validateProps($$props);

      this.#updateCurrentColorDebounce = debounce(() =>
      {
// console.log(`!! ColorState - #updateCurrentColorDebounce - invoked`)
         this.#updateCurrentColor(this.#internalUpdate);
         this.#internalUpdate.h = void 0;
         this.#internalUpdate.sv = void 0;
         this.#internalUpdate.a = void 0;
         this.#internalUpdate.textUpdate = false;
      }, 0);

      const tempStoreRGBString = writable(this.#data.rgbString);
      const tempStoreRGBHueString = writable(this.#data.rgbHueString);
      const tempStoreRGBAString = writable(this.#data.rgbaString);
      const tempStoreOutputColor = writable(this.#data.currentColor);

      this.#storeSet = {
         rgbString: tempStoreRGBString.set,
         rgbHueString: tempStoreRGBHueString.set,
         rgbaString: tempStoreRGBAString.set,
         currentColor: tempStoreOutputColor.set
      }

      this.#stores = {
         // Writable stores
         alpha: writable(this.#data.alpha),
         hue: writable(this.#data.hue),
         sv: writable(this.#data.sv),

         // Readable stores
         textState: new TextState(this, this.#internalUpdate),
         rgbString: { subscribe: tempStoreRGBString.subscribe },
         rgbHueString: { subscribe: tempStoreRGBHueString.subscribe },
         rgbaString: { subscribe: tempStoreRGBAString.subscribe },
         currentColor: { subscribe: tempStoreOutputColor.subscribe }
      }

      setTimeout(() =>
      {
         this.#unsubscribe.push(subscribeIgnoreFirst(this.#stores.alpha, (a) =>
         {
// console.log(`!! ColorState - stores.alpha change`);

            this.#internalUpdate.a = a;
            this.#updateCurrentColorDebounce();
         }));

         this.#unsubscribe.push(subscribeIgnoreFirst(this.#stores.hue, (h) => {
// console.log(`!! ColorState - stores.hue change`);

            this.#internalUpdate.h = h;
            this.#updateCurrentColorDebounce();
         }));

         this.#unsubscribe.push(subscribeIgnoreFirst(this.#stores.sv, (sv) =>
         {
// console.log(`!! ColorState - stores.sv change`);

            this.#internalUpdate.sv = sv;
            this.#updateCurrentColorDebounce();
         }));
      }, 0);
   }

   destroy()
   {
      for (const unsubscribe of this.#unsubscribe) { unsubscribe(); }
   }

   #updateCurrentColor({ h = this.#data.hue, sv = this.#data.sv, a = this.#data.alpha, textUpdate = false })
   {
      const newHsv = { h, s: sv.s, v: sv.v, a };

// console.log(`!! Color - #updateCurrentColor - 0 - newHsv: `, newHsv);
// console.trace();

      const colordInstance = colord(newHsv);

      this.#data.hue = h;
      this.#data.sv = sv;
      this.#data.alpha = a;
      this.#data.currentColor = newHsv;

      this.#data.rgbString = colordInstance.alpha(1).toRgbString();
      this.#data.rgbHueString = colord({ h, s: 100, v: 100, a: 1 }).toRgbString();
      this.#data.rgbaString = colordInstance.toRgbString();

      // Update RgbInt store if the update didn't come from RgbInt.
      if (!textUpdate) { this.#stores.textState.updateColor(newHsv); }

      this.#lastTime = globalThis.performance.now();
      this.#storeSet.currentColor(this.#data.currentColor);

      this.#storeSet.rgbString(this.#data.rgbString);
      this.#storeSet.rgbHueString(this.#data.rgbHueString);
      this.#storeSet.rgbaString(this.#data.rgbaString);
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

// console.log(`!! ColorState - isExternalUpdate - elapsedTime: ${(globalThis.performance.now() - this.#lastTime)}; result: `, result);

      return result;

      // return (globalThis.performance.now() - this.#lastTime) > ColorState.#delta;
   }

   updateExternal(extColor)
   {
      if (!this.#isExternalUpdate()) { return; }

// console.log(`!! ColorState - updateExternal - data: `, extColor);

      const colordInstance = colord(extColor);

      if (!colordInstance.isValid())
      {
         console.warn(`TJSColorPicker warning: 'color' prop set externally is not valid; '${extColor}'.`)
         return;
      }

      const newHsv = colordInstance.toHsv();

      if (typeof newHsv.h === 'number')
      {
         this.#stores.hue.set(newHsv.h);
      }

      if (typeof newHsv.s === 'number' && typeof newHsv.v === 'number')
      {
         this.#stores.sv.set({ s: newHsv.s, v: newHsv.v });
      }

      if (typeof newHsv.a === 'number')
      {
         this.#stores.alpha.set(newHsv.a);
      }
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
            const newHsv = colordInstance.toHsv();

console.log(`!! ColorState - #validateProps - 1 - newHsv: `, newHsv)

            if (typeof newHsv.h === 'number')
            {
               this.#data.hue = newHsv.h;
            }

            if (typeof newHsv.s === 'number' && typeof newHsv.v === 'number')
            {
               this.#data.sv = { s: newHsv.s, v: newHsv.v };
            }

            if (typeof newHsv.a === 'number')
            {
               this.#data.alpha = newHsv.a
            }

            this.#data.currentColor = newHsv;

            this.#data.rgbString = colordInstance.alpha(1).toRgbString();
            this.#data.rgbHueString = colord({ h: newHsv.h, s: 100, v: 100, a: 1 }).toRgbString();
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
 * @property {import('svelte/store').Readable<string|object>} currentColor - The current color.
 *
 * @property {TextState} textState - The text state for various supported color formats.
 *
 * @property {import('svelte/store').Readable<string>} rgbString - The current color / RGB only string.
 *
 * @property {import('svelte/store').Readable<string>} rgbHueString - The current color hue / RGB only string.
 *
 * @property {import('svelte/store').Readable<string>} rgbaString - The current color / RGBA only string.
 *
 * @property {import('svelte/store').Writable<{ s: number, v: number }>} sv - The saturation / value pair for HSV components.
 */

