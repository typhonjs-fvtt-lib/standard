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
      isDark: false,
      rgbString: 'rgb(255, 0, 0)',
      rgbHueString: 'rgb(255, 0, 0)',
      rgbaString: 'rgba(255, 0, 0, 1)',
      sv: { s: 100, v: 100 },
      currentColor: { h: 0, s: 100, v: 100, a: 1 }
   };

   #lastTime = Number.MIN_SAFE_INTEGER;

   /** @type {ColorStateStores} */
   #stores = {};

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

   /** @type {ColorStateInternalUpdate} */
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

   /**
    * @param {InternalState}  internalState -
    *
    * @param {object|string}  color
    */
   constructor(internalState, color)
   {
      this.#validateProps(color);

      this.#updateCurrentColorDebounce = debounce(() =>
      {
// console.log(`!! ColorState - #updateCurrentColorDebounce - invoked`)
         this.#updateCurrentColor(this.#internalUpdate);
         this.#internalUpdate.h = void 0;
         this.#internalUpdate.sv = void 0;
         this.#internalUpdate.a = void 0;
         this.#internalUpdate.textUpdate = false;
      }, 0);

      const tempStoreCurrentColor = writable(this.#data.currentColor);
      const tempStoreIsDark = writable(this.#data.isDark);
      const tempStoreRGBString = writable(this.#data.rgbString);
      const tempStoreRGBHueString = writable(this.#data.rgbHueString);
      const tempStoreRGBAString = writable(this.#data.rgbaString);

      this.#storeSet = {
         currentColor: tempStoreCurrentColor.set,
         isDark: tempStoreIsDark.set,
         rgbString: tempStoreRGBString.set,
         rgbaString: tempStoreRGBAString.set,
         rgbHueString: tempStoreRGBHueString.set,
      }

      // Writable stores
      this.#stores.alpha = writable(this.#data.alpha);
      this.#stores.hue = writable(this.#data.hue);
      this.#stores.sv = writable(this.#data.sv);

      // Readable stores
      this.#stores.textState = new TextState(this, this.#internalUpdate);
      this.#stores.isDark = { subscribe: tempStoreIsDark.subscribe };
      this.#stores.rgbString = { subscribe: tempStoreRGBString.subscribe };
      this.#stores.rgbHueString = { subscribe: tempStoreRGBHueString.subscribe };
      this.#stores.rgbaString = { subscribe: tempStoreRGBAString.subscribe };
      this.#stores.currentColor = { subscribe: tempStoreCurrentColor.subscribe };

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

         // Subscribe to InternalState `isAlpha` option to set ColorState alpha store when disabled.
         this.#unsubscribe.push(subscribeIgnoreFirst(internalState.stores.isAlpha, (isAlpha) =>
         {
            if (!isAlpha) { this.#stores.alpha.set(1); }
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
      this.#data.isDark = colordInstance.isDark();

      this.#data.rgbString = colordInstance.alpha(1).toRgbString();
      this.#data.rgbHueString = colord({ h, s: 100, v: 100, a: 1 }).toRgbString();
      this.#data.rgbaString = colordInstance.toRgbString();

      // Update RgbInt store if the update didn't come from RgbInt.
      if (!textUpdate) { this.#stores.textState.updateColor(newHsv); }

      this.#lastTime = globalThis.performance.now();

      this.#storeSet.currentColor(this.#data.currentColor);
      this.#storeSet.isDark(this.#data.isDark);

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
    * @param {object|string}   color -
    */
   #validateProps(color)
   {
console.log(`!! ColorState - #validateProps - 0 - color: `, color)

      if (isObject(color) || typeof color === 'string')
      {
         const colordInstance = colord(color);

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
            console.warn(`TJSColorPicker warning: bound 'color' prop is not a valid color; '${color}`);
         }
      }
   }
}

/**
 * @typedef {object} ColorStateInternalUpdate
 *
 * The separated store updates for alpha, hue, sv are debounced with a next tick update and this object
 * collates the values for each store update in the same tick. It is reset in #updaateOutputColorDebounce.
 *
 * `textUpdate` determines if the update came from {@link TextState} and if so TextState is not updated in
 * #updateCurrentColor.
 *
 * @property {number}                  a - New alpha value.
 *
 * @property {number}                  h - New hue value.
 *
 * @property {{s: number, v: number}}  sv - New SV value.
 *
 * @property {boolean}                 textUpdate - Did the update come from {@link TextState}.
 */

/**
 * @typedef {object} ColorStateStores
 *
 * @property {import('svelte/store').Writable<number>} alpha - The current alpha value (0 - 1).
 *
 * @property {import('svelte/store').Writable<number>} hue - The current hue value (0 - 360).
 *
 * @property {import('svelte/store').Readable<string|object>} currentColor - The current color.
 *
 * @property {import('svelte/store').Readable<boolean>} isDark - Is the current color considered "dark".
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

