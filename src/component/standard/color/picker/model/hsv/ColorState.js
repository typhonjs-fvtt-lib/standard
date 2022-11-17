import { writable }        from 'svelte/store';

import { colord }          from '@typhonjs-fvtt/runtime/color/colord';

import {
   debounce,
   isObject }              from '@typhonjs-fvtt/runtime/svelte/util';

import { subscribeIgnoreFirst }    from '@typhonjs-fvtt/runtime/svelte/store';

import { ActiveTextMode }  from './text/ActiveTextMode.js';
import { TextState }       from './text/TextState.js';

import { ColorParser }     from '../../util/ColorParser.js';

export class ColorState
{
   /**
    * Delta time in milliseconds determining if a change to the color prop in {@link TJSColorPicker} is made externally.
    *
    * @type {number}
    */
   static #delta = 100;

   /** @type {Set<string>} */
   static #supportedFormats = new Set(['hex', 'hsl', 'hsv', 'rgb']);

   /** @type {Set<string>} */
   static #supportedFormatTypes = new Set(['object', 'string']);

   /** @type {ColorStateData} */
   #data = {
      alpha: 1,
      currentColor: void 0, // { h: 0, s: 100, v: 100, a: 1 },
      // TODO REFACTOR TO 'hsl' / 'string'.
      format: 'hsv',
      formatType: 'object',
      hue: 0,
      isDark: false,
      rgbString: 'rgb(255, 0, 0)',
      rgbHueString: 'rgb(255, 0, 0)',
      rgbaString: 'rgba(255, 0, 0, 1)',
      sv: { s: 100, v: 100 }
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
    * @param {InternalState}           internalState -
    *
    * @param {object|string}           color -
    *
    * @param {TJSColorPickerOptions}   options -
    */
   constructor(internalState, color, options)
   {
      this.#validateOptions(options);

      // Attempt to parse color model format & type.
      if (color !== void 0)
      {
         const colorFormat = ColorParser.getColorFormat(color);

         // Post a warning message that any initial bound color prop is invalid. The default will be set to red.
         if (!colorFormat)
         {
            console.warn(`TJSColorPicker warning - initial 'color' prop value is invalid: ${color}`);
         }
         else
         {
console.log(`!! ColorState - ctor - 0 - colorFormat: `, colorFormat)

            this.#data.format = colorFormat.format;
            this.#data.formatType = colorFormat.type;
         }
      }
      else // Accept any explicitly set color model format & type.
      {
         // TODO REFACTOR TO 'hsl' / 'string'.
         this.#data.format = typeof options.format === 'string' ? options.format : 'hsv';
         this.#data.formatType = typeof options.formatType === 'string' ? options.formatType : 'object';
      }

console.log(`!! ColorState - ctor - 1 - #internalData.format: ${this.#data.format}; #internalData.formatType: ${this.#data.formatType}`)

      // 'alpha', 'hue', and 'sv' stores on subscription below invoke `#updateCurrentColor` on the next tick.
      this.#updateCurrentColorDebounce = debounce(() =>
      {
// console.log(`!! ColorState - #updateCurrentColorDebounce - invoked - this.#internalUpdate: `, JSON.stringify(this.#internalUpdate))
         this.#updateCurrentColor(this.#internalUpdate);
         this.#internalUpdate.h = void 0;
         this.#internalUpdate.sv = void 0;
         this.#internalUpdate.a = void 0;
         this.#internalUpdate.textUpdate = false;
      }, 0);

      // Cache externally "readable" store set methods.
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
      this.#stores.activeTextMode = new ActiveTextMode();
      this.#stores.textState = new TextState(this, this.#internalUpdate);
      this.#stores.isDark = { subscribe: tempStoreIsDark.subscribe };
      this.#stores.rgbString = { subscribe: tempStoreRGBString.subscribe };
      this.#stores.rgbHueString = { subscribe: tempStoreRGBHueString.subscribe };
      this.#stores.rgbaString = { subscribe: tempStoreRGBAString.subscribe };
      this.#stores.currentColor = { subscribe: tempStoreCurrentColor.subscribe };

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

   destroy()
   {
      for (const unsubscribe of this.#unsubscribe) { unsubscribe(); }
   }

   #isExternalUpdate()
   {
      const result = (globalThis.performance.now() - this.#lastTime) > ColorState.#delta;

// console.log(`!! ColorState - isExternalUpdate - elapsedTime: ${(globalThis.performance.now() - this.#lastTime)}; result: `, result);

      return result;

      // return (globalThis.performance.now() - this.#lastTime) > ColorState.#delta;
   }

   #updateCurrentColor({ h = this.#data.hue, sv = this.#data.sv, a = this.#data.alpha, textUpdate = false } = {})
   {
      const newHsv = { h, s: sv.s, v: sv.v, a };

// console.log(`!! ColorState - #updateCurrentColor - 0 - textUpdate: ${textUpdate}; newHsv: `, newHsv);
// console.trace();

      const colordInstance = colord(newHsv);

      this.#data.hue = h;
      this.#data.sv = sv;
      this.#data.alpha = a;
      this.#data.currentColor = newHsv;
      this.#data.isDark = colordInstance.isDark();

      this.#data.rgbString = colordInstance.alpha(1).toRgbString(3);
      this.#data.rgbHueString = colord({ h, s: 100, v: 100, a: 1 }).toRgbString(3);
      this.#data.rgbaString = colordInstance.toRgbString(3);

      // Update RgbInt store if the update didn't come from RgbInt.
      if (!textUpdate) { this.#stores.textState.updateColor(newHsv); }

      this.#lastTime = globalThis.performance.now();

      this.#storeSet.currentColor(this.#data.currentColor);
      this.#storeSet.isDark(this.#data.isDark);

      this.#storeSet.rgbString(this.#data.rgbString);
      this.#storeSet.rgbHueString(this.#data.rgbHueString);
      this.#storeSet.rgbaString(this.#data.rgbaString);
   }

   updateExternal(extColor)
   {
      if (!this.#isExternalUpdate()) { return; }

// console.log(`!! ColorState - updateExternal - 0 - data: `, extColor);

      if (!colord(extColor).isValid())
      {
// console.log(`!! ColorState - updateExternal - 1 - extColor is invalid`);

         // Ignore non-valid external color state changes after the initial invocation of `#updateCurrentColor`.
         // Post a warning.
         if (this.#lastTime >= 0)
         {
            console.warn(`TJSColorPicker warning: 'color' prop set externally is not valid; '${extColor}'.`)
            return;
         }
         else
         {
            // On first non-valid external color assume that the color prop was not set and set default to red.
            // A console warning already has been posted in ColorState constructor when the color prop is malformed.
            extColor = '#ff0000';
         }
      }

      const newHsv = HsvColorParser.parseExternal(extColor);

// console.log(`!! ColorState - updateExternal - 2 - newHsv: `, newHsv);

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
    * Updates options related to ColorState.
    *
    * @param {TJSColorPickerOptions}   options -
    */
   updateOptions(options)
   {
      this.#validateOptions(options);

      if (options.format !== void 0 && options.format !== this.#data.format)
      {
         this.#data.format = format;
      }

      if (options.formatType !== void 0 && options.formatType !== this.#data.formatType)
      {
         this.#data.formatType = options.formatType;
      }
   }

   /**
    * Validates external user defined options.
    *
    * @param {TJSColorPickerOptions} opts -
    */
   #validateOptions(opts)
   {
      if (opts.format !== void 0)
      {
         if (typeof opts.format !== 'string') { throw new TypeError(`'options.format' is not a string.`); }

         if (!ColorState.#supportedFormats.has(opts.format))
         {
            throw new Error(`'TJSColorPicker error: Unknown format for 'options.format' - '${opts.format}'.`);
         }
      }

      if (opts.formatType !== void 0)
      {
         if (typeof opts.formatType !== 'string') { throw new TypeError(`'options.formatType' is not a string.`); }

         if (!ColorState.#supportedFormatTypes.has(opts.formatType))
         {
            throw new Error(
             `'TJSColorPicker error: Unknown format type for 'options.formatType' - '${opts.formatType}'.`);
         }
      }
   }
}

class HsvColorParser
{
   // Functional syntax
   // hsl( <hue>, <percentage>, <percentage>, <alpha-value>? )
   static #hslaMatcherComma = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s*,\s*([+-]?\d*\.?\d+)%\s*,\s*([+-]?\d*\.?\d+)%\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i;

   // Whitespace syntax
   // hsl( <hue> <percentage> <percentage> [ / <alpha-value> ]? )
   static #hslaMatcherSpace = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s+([+-]?\d*\.?\d+)%\s+([+-]?\d*\.?\d+)%\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i;

   /**
    * Parses an externally set color. If HSL or HSV the hue is maintained in conversion to internal HSV data.
    *
    * @param {object|string}   color - Color to parse.
    *
    * @returns {object} HSV color.
    */
   static parseExternal(color)
   {
      const colorModel = ColorParser.getColorFormat(color);

      let initialHue = 0;

// console.log(`!! HsvColorParser - parseExternal - 0 - colorModel: `, colorModel);

      // Parse initial hue value from `hsl` or `hsv` formats.
      if (colorModel.format === 'hsv' && colorModel.type === 'object')
      {
         initialHue = color.h ?? 0;
// console.log(`!! HsvColorParser - parseExternal - A - initialHue: `, initialHue);
      }
      else if (colorModel.format === 'hsl')
      {
         switch (colorModel.type)
         {
            case 'object':
               initialHue = color.h ?? 0;
// console.log(`!! HsvColorParser - parseExternal - B - initialHue: `, initialHue);
               break;

            case 'string':
            {
               const match = this.#hslaMatcherComma.exec(color) ?? this.#hslaMatcherSpace.exec(color);
// console.log(`!! HsvColorParser - parseExternal - C - match: `, match);
               if (match)
               {
                  initialHue = ColorParser.parseHue(match[1], match[2]);
console.log(`!! HsvColorParser - parseExternal - C1 - initialHue: `, initialHue);
               }
            }
         }
      }

// console.log(`!! HsvColorParser - parseExternal - 1 - initialHue: `, initialHue);
// console.log(`!! HsvColorParser - parseExternal - 2 - colord: `, colord(color));

      const newHsv = colord(color).toHsv(5);
      newHsv.h = ColorParser.clampHue(initialHue);

// console.log(`!! HsvColorParser - parseExternal - 3 - newHsv: `, newHsv);
// console.log(`!! HsvColorParser - parseExternal - 4 - newHsv colord: `, colord(newHsv));
// console.log(`!! HsvColorParser - parseExternal - 5 - newHsv colord back to rgb: `, colord(newHsv).toRgb(5));

      return newHsv;
   }
}


/**
 * @typedef {object} ColorStateData
 *
 * @property {number} alpha - Current alpha value.
 *
 * @property {object|string} currentColor - Current color value.
 *
 * @property {'hex'|'hsl'|'hsv'|'rgb'} format - Output color format determined from initial color prop or options.
 *
 * @property {'object'|'string'} formatType - Output color format type determined from initial color prop or options.
 *
 * @property {number} hue - Current hue value.
 *
 * @property {boolean} isDark - Is the current color considered dark.
 *
 * @property {string} rgbString - Current color as RGB string without `alpha` component.
 *
 * @property {string} rgbHueString - Current hue as RGB string.
 *
 * @property {string} rgbaString - Current color as RGB string with `alpha` component.
 *
 * @property {{ s: number, v: number }} sv - Current internal color saturation / value state.
 */

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
 * @property {import('svelte/store').Readable<ActiveTextMode>} activeTextMode - The current active text mode.
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

