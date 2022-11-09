import { writable }  from 'svelte/store';

import { colord }    from '@typhonjs-fvtt/runtime/color/colord';
import {
   debounce,
   isObject }        from '@typhonjs-fvtt/runtime/svelte/util';

import { subscribeIgnoreFirst }    from '@typhonjs-fvtt/runtime/svelte/store';

export class ColorState
{
   /**
    * Delta time in milliseconds determining if a change to the color prop in {@link TJSColorPicker} is made externally.
    *
    * @type {number}
    */
   static #delta = 100; //

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
    * @type {{a: number, sv: {s: number, v: number}, h: number, rgbInt: boolean}}
    */
   #internalUpdate = {
      h: void 0,
      sv: void 0,
      a: void 0,
      rgbInt: false
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
         this.#internalUpdate.rgbInt = false;
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
         rgbInt: new RgbInt({ colorState: this, internalUpdate: this.#internalUpdate }),
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

   #updateCurrentColor({ h = this.#data.hue, sv = this.#data.sv, a = this.#data.alpha, rgbInt = false })
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
      if (!rgbInt) { this.#stores.rgbInt.updateColor(newHsv); }

      this.#lastTime = globalThis.performance.now();
      this.#storeSet.currentColor(this.#data.currentColor);

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
 * Manages RGB component based representations such as `rgb` and `hex` formats. The internal storage format is HSV and
 * the conversions between floating point and integer representation in the text input GUI is lossy. RgbInt provides a
 * store that tracks the `rgb` component values (0 - 255) and hex representations. Changes from the text input
 * component are converted into internal HSV representation and set the `hue` and `sv` stores setting the #interalUpdate
 * rgbInt flag so that {@link ColorState.#updateCurrentColor} on updates RgbInt isn't updated. This makes it possible to
 * support a single internal color representation in HSV and not have independent variables for each type.
 */
class RgbInt
{
   /** @type {{ r: number, g: number, b: number}} */
   #data

   #colorState;
   #internalUpdate;

   constructor({ r = 255, g = 0, b = 0, colorState, internalUpdate } = {})
   {
      this.#data = { r, g, b };

      this.#colorState = colorState;
      this.#internalUpdate = internalUpdate;
   }

   /**
    * Stores the subscribers.
    *
    * @type {(function(object): void)[]}
    */
   #subscriptions = [];

   get r()
   {
      return this.#data.r;
   }

   get g()
   {
      return this.#data.g;
   }

   get b()
   {
      return this.#data.b;
   }

   get rgb()
   {
      return this.#data;
   }

   get hsv()
   {
      return colord(this.#data).toHsv();
   }

   set r(value)
   {
      const typeofValue = typeof value;

      if (typeofValue !== 'string' && typeofValue !== 'number')
      {
         throw new TypeError(`RgbInt 'set r' error: 'value' is not a string or number.`);
      }

      if (!this.isValidRgbComponent(value)) { return; }

      let parsedValue = value;

      if (typeofValue === 'string') { parsedValue = globalThis.parseFloat(value); }

      this.#data.r = parsedValue;

      this.#internalUpdate.rgbInt = true;

      // Update hue and sv component stores w/ parsed data.
      const newHsv = this.hsv;
      this.#colorState.stores.hue.set(newHsv.h);
      this.#colorState.stores.sv.set({ s: newHsv.s, v: newHsv.v });

      this.#updateSubscribers();
   }

   set g(value)
   {
      const typeofValue = typeof value;

      if (typeofValue !== 'string' && typeofValue !== 'number')
      {
         throw new TypeError(`RgbInt 'set g' error: 'value' is not a string or number.`);
      }

      if (!this.isValidRgbComponent(value)) { return; }

      let parsedValue = value;

      if (typeofValue === 'string') { parsedValue = globalThis.parseFloat(value); }

      this.#data.g = parsedValue;

      this.#internalUpdate.rgbInt = true;

      // Update hue and sv component stores w/ parsed data.
      const newHsv = this.hsv;
      this.#colorState.stores.hue.set(newHsv.h);
      this.#colorState.stores.sv.set({ s: newHsv.s, v: newHsv.v });

      this.#updateSubscribers();
   }

   set b(value)
   {
      const typeofValue = typeof value;

      if (typeofValue !== 'string' && typeofValue !== 'number')
      {
         throw new TypeError(`RgbInt 'set b' error: 'value' is not a string or number.`);
      }

      if (!this.isValidRgbComponent(value)) { return; }

      let parsedValue = value;

      if (typeofValue === 'string') { parsedValue = globalThis.parseFloat(value); }

      this.#data.b = parsedValue;

      this.#internalUpdate.rgbInt = true;

      // Update hue and sv component stores w/ parsed data.
      const newHsv = this.hsv;
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
   isValidRgbComponent(value)
   {
      const typeofValue = typeof value;

      if (typeofValue !== 'string' && typeofValue !== 'number') { return false; }

      let parsedValue = value;

      if (typeofValue === 'string') { parsedValue = globalThis.parseFloat(value); }

      if (parsedValue === Number.NaN) { return false; }

      return parsedValue >= 0 && parsedValue <= 255;
   }

   setHex(hex)
   {

   }

   updateColor(color)
   {
      const colordInstance = colord(color)

      if (!colordInstance.isValid()) { throw new Error(`RgbInt updateColor error: 'color' is not valid'.`); }

      const rgb = colordInstance.toRgb();

      this.#data.r = Math.round(rgb.r);
      this.#data.g = Math.round(rgb.g);
      this.#data.b = Math.round(rgb.b);

      this.#updateSubscribers();
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

      handler(this);                     // call handler with current value

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
      for (let cntr = 0; cntr < this.#subscriptions.length; cntr++) { this.#subscriptions[cntr](this); }
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
 * @property {RgbInt} rgbInt - The integer based tracking for rgb / hex text input avoiding floating point calculation.
 *
 * @property {import('svelte/store').Readable<string>} rgbString - The current color / RGB only string.
 *
 * @property {import('svelte/store').Readable<string>} rgbHueString - The current color hue / RGB only string.
 *
 * @property {import('svelte/store').Readable<string>} rgbaString - The current color / RGBA only string.
 *
 * @property {import('svelte/store').Writable<{ s: number, v: number }>} sv - The saturation / value pair for HSV components.
 */

