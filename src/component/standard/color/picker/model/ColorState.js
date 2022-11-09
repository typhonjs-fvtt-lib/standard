import { writable }  from 'svelte/store';

import { colord }    from '@typhonjs-fvtt/runtime/color/colord';
import {
   debounce,
   isObject }        from '@typhonjs-fvtt/runtime/svelte/util';

import { subscribeIgnoreFirst }    from '@typhonjs-fvtt/runtime/svelte/store';

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
      outputColor: { h: 0, s: 100, v: 100, a: 1 },
      outputColord: colord({ h: 0, s: 100, v: 100, a: 1 })
   };

   #lastTime = 0;

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

   /**
    * The separated store updates for alpha, hue, sv are debounced with a next tick update and this object
    * collates the values for any store update in the same tick. It is reset in #updaateOutputColorDebounce.
    *
    * @type {{a: number, sv: {s: number, v: number}, h: number, rgbInt: boolean}}
    */
   #internalUpdate = {
      h: void 0,
      sv: void 0,
      a: void 0,
      rgbInt: false
   };

   #updateOutputColorDebounce;

   constructor($$props)
   {
      this.#validateProps($$props);

      this.#updateOutputColorDebounce = debounce(() =>
      {
// console.log(`!! ColorState - #updateOutputColorDebounce - invoked`)
         this.#updateOutputColor(this.#internalUpdate);
         this.#internalUpdate.h = void 0;
         this.#internalUpdate.sv = void 0;
         this.#internalUpdate.a = void 0;
         this.#internalUpdate.rgbInt = false;
      }, 0);

      const tempStoreRGBString = writable(this.#data.rgbString);
      const tempStoreRGBHueString = writable(this.#data.rgbHueString);
      const tempStoreRGBAString = writable(this.#data.rgbaString);
      const tempStoreOutputColor = writable(this.#data.outputColor);
      const tempStoreOutputColord = writable(this.#data.outputColord);

      this.#storeSet = {
         rgbString: tempStoreRGBString.set,
         rgbHueString: tempStoreRGBHueString.set,
         rgbaString: tempStoreRGBAString.set,
         outputColor: tempStoreOutputColor.set,
         outputColord: tempStoreOutputColord.set
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
         outputColor: { subscribe: tempStoreOutputColor.subscribe },
         outputColord: { subscribe: tempStoreOutputColord.subscribe }
      }

      setTimeout(() =>
      {
         this.#unsubscribe.push(subscribeIgnoreFirst(this.#stores.alpha, (a) =>
         {
// console.log(`!! ColorState - stores.alpha change`);

            this.#internalUpdate.a = a;
            this.#updateOutputColorDebounce();
         }));

         this.#unsubscribe.push(subscribeIgnoreFirst(this.#stores.hue, (h) => {
// console.log(`!! ColorState - stores.hue change`);

            this.#internalUpdate.h = h;
            this.#updateOutputColorDebounce();
         }));

         this.#unsubscribe.push(subscribeIgnoreFirst(this.#stores.sv, (sv) =>
         {
// console.log(`!! ColorState - stores.sv change`);

            this.#internalUpdate.sv = sv;
            this.#updateOutputColorDebounce();
         }));

//          this.#unsubscribe.push(subscribeIgnoreFirst(this.#stores.rgbInt, (rgbInt) =>
//          {
// // console.log(`!! ColorState - stores.rgbInt change`);
//
//             const newHSV = rgbInt.hsv;
//
//             // this.#internalUpdate.h = newHSV.h;
//             // this.#internalUpdate.sv = { s: newHSV.s, v: newHSV.v };
//             this.#internalUpdate.rgbInt = true;
//
//             this.#stores.hue.set(newHSV.h);
//             this.#stores.sv.set({ s: newHSV.s, v: newHSV.v });
//
//             // this.#updateOutputColorDebounce();
//          }));
      }, 0);
   }

   destroy()
   {
      for (const unsubscribe of this.#unsubscribe) { unsubscribe(); }
   }

   #updateOutputColor({ h = this.#data.hue, sv = this.#data.sv, a = this.#data.alpha, rgbInt = false })
   {
      const newHSV = { h, s: sv.s, v: sv.v, a };

// console.log(`!! Color - #updateOutputColor - 0 - newHSV: `, newHSV);
// console.trace();

      const colordInstance = colord(newHSV);

      this.#data.hue = h;
      this.#data.sv = sv;
      this.#data.alpha = a;
      this.#data.outputColor = newHSV;
      this.#data.outputColord = colord(newHSV);

      this.#data.rgbString = colordInstance.alpha(1).toRgbString();
      this.#data.rgbHueString = colord({ h, s: 100, v: 100, a: 1 }).toRgbString();
      this.#data.rgbaString = colordInstance.toRgbString();

      // Update RgbInt store if the update didn't come from RgbInt. Round current RGB values.
      if (!rgbInt)
      {
// console.log(`!! Color - #updateOutputColor - B - updating rgbInt`);
         const rgb = colordInstance.toRgb();
         this.#stores.rgbInt.setRgb(Math.round(rgb.r), Math.round(rgb.g), Math.round(rgb.b));
      }

      this.#lastTime = globalThis.performance.now();
      this.#storeSet.outputColor(this.#data.outputColor);
      this.#storeSet.outputColord(this.#data.outputColord);

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

            if (typeof newHSV.h === 'number')
            {
               this.#data.hue = newHSV.h;
            }

            if (typeof newHSV.s === 'number' && typeof newHSV.v === 'number')
            {
               this.#data.sv = { s: newHSV.s, v: newHSV.v };
            }

            if (typeof newHSV.a === 'number')
            {
               this.#data.alpha = newHSV.a
            }

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
 * @property {import('svelte/store').Readable<string|object>} outputColor - The current color.
 *
 * @property {import('svelte/store').Readable<Colord>} outputColord - The current color / colord instance.
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

   set r(r)
   {
// console.log(`!! RgbInt - set r - r: `, r);
      this.#data.r = r;

      this.#internalUpdate.rgbInt = true;

      const newHSV = this.hsv;
      this.#colorState.stores.hue.set(newHSV.h);
      this.#colorState.stores.sv.set({ s: newHSV.s, v: newHSV.v });

      // this.#updateSubscribers();
   }

   set g(g)
   {
// console.log(`!! RgbInt - set g - g: `, g);
      this.#data.g = g;

      this.#internalUpdate.rgbInt = true;

      const newHSV = this.hsv;
      this.#colorState.stores.hue.set(newHSV.h);
      this.#colorState.stores.sv.set({ s: newHSV.s, v: newHSV.v });

      // this.#updateSubscribers();
   }

   set b(b)
   {
// console.log(`!! RgbInt - set b - b: `, b);
      this.#data.b = b;

      this.#internalUpdate.rgbInt = true;

      const newHSV = this.hsv;
      this.#colorState.stores.hue.set(newHSV.h);
      this.#colorState.stores.sv.set({ s: newHSV.s, v: newHSV.v });

      // this.#updateSubscribers();
   }

   setHex(hex)
   {

   }

   setRgb(r, g, b)
   {
      this.#data.r = r;
      this.#data.g = g;
      this.#data.b = b;

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
