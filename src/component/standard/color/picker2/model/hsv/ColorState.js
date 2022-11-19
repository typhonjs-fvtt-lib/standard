import { writable }        from 'svelte/store';

import {
   colord,
   Colord }                from '@typhonjs-fvtt/runtime/color/colord';

import { debounce }        from '@typhonjs-fvtt/runtime/svelte/util';

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
      currentColor: 'hsl(0, 100%, 50%)',
      format: 'hsl',
      formatType: 'string',
      hue: 0,
      isDark: false,
      precision: 0,
      hslString: 'hsl(0, 100%, 50%)',
      hslHueString: 'hsl(0, 100%, 50%)',
      hslaString: 'hsla(0, 100%, 50%, 1)',
      sv: { s: 100, v: 100 }
   };

   /**
    * @type {InternalState}
    */
   #internalState;

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
      this.#internalState = internalState;

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
            this.#data.format = colorFormat.format;
            this.#data.formatType = colorFormat.type;

            const initialHsv = HsvColorParser.parseExternal(color);
            this.#updateColorData(initialHsv);
         }
      }
      else // Accept any explicitly set color model format & type.
      {
         this.#data.format = typeof options.format === 'string' ? options.format : 'hsl';
         this.#data.formatType = typeof options.formatType === 'string' ? options.formatType : 'string';
      }

      // Set initial precision.
      this.#data.precision = internalState.precision;

      // 'alpha', 'hue', and 'sv' stores on subscription below invoke `#updateCurrentColor` on the next tick.
      this.#updateCurrentColorDebounce = debounce(() =>
      {
         this.#updateCurrentColor(this.#internalUpdate);
         this.#internalUpdate.h = void 0;
         this.#internalUpdate.sv = void 0;
         this.#internalUpdate.a = void 0;
         this.#internalUpdate.textUpdate = false;
      }, 0);

      // Cache externally "readable" store set methods.
      const tempStoreCurrentColor = writable(this.#data.currentColor);
      const tempStoreIsDark = writable(this.#data.isDark);
      const tempStoreHslString = writable(this.#data.hslString);
      const tempStoreHslHueString = writable(this.#data.hslHueString);
      const tempStoreHslaString = writable(this.#data.hslaString);

      this.#storeSet = {
         currentColor: tempStoreCurrentColor.set,
         isDark: tempStoreIsDark.set,
         hslString: tempStoreHslString.set,
         hslaString: tempStoreHslaString.set,
         hslHueString: tempStoreHslHueString.set,
      }

      // Writable stores
      this.#stores.alpha = writable(this.#data.alpha);
      this.#stores.hue = writable(this.#data.hue);
      this.#stores.sv = writable(this.#data.sv);

      // Readable stores
      this.#stores.activeTextMode = new ActiveTextMode();
      this.#stores.textState = new TextState(this, this.#internalUpdate);
      this.#stores.isDark = { subscribe: tempStoreIsDark.subscribe };
      this.#stores.hslString = { subscribe: tempStoreHslString.subscribe };
      this.#stores.hslHueString = { subscribe: tempStoreHslHueString.subscribe };
      this.#stores.hslaString = { subscribe: tempStoreHslaString.subscribe };
      this.#stores.currentColor = { subscribe: tempStoreCurrentColor.subscribe };

      this.#unsubscribe.push(subscribeIgnoreFirst(this.#stores.alpha, (a) =>
      {
         this.#internalUpdate.a = a;
         this.#updateCurrentColorDebounce();
      }));

      this.#unsubscribe.push(subscribeIgnoreFirst(this.#stores.hue, (h) =>
      {
         this.#internalUpdate.h = h;
         this.#updateCurrentColorDebounce();
      }));

      this.#unsubscribe.push(subscribeIgnoreFirst(this.#stores.sv, (sv) =>
      {
         this.#internalUpdate.sv = sv;
         this.#updateCurrentColorDebounce();
      }));

      // Subscribe to InternalState `isAlpha` option to set ColorState alpha store when disabled.
      this.#unsubscribe.push(subscribeIgnoreFirst(internalState.stores.isAlpha, (isAlpha) =>
      {
         if (!isAlpha) { this.#stores.alpha.set(1); }
      }));

      // Subscribe to InternalState `precision` option to set new color precision.
      this.#unsubscribe.push(subscribeIgnoreFirst(internalState.stores.precision, (precision) =>
      {
         this.#data.precision = precision;
         this.#updateCurrentColor();
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

   /**
    * @returns {{ h: number, s: number, v: number, a: number }} Current HSV color object.
    */
   get hsv()
   {
      return { h: this.#data.hue, s: this.#data.sv.s, v: this.#data.sv.v, a: this.#data.alpha };
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
      return (globalThis.performance.now() - this.#lastTime) > ColorState.#delta;
   }

   /**
    * @param {object}   hsvColor -
    */
   #updateColorData(hsvColor)
   {
      this.#data.hue = hsvColor.h;
      this.#data.sv = { s: hsvColor.s, v: hsvColor.v };
      this.#data.alpha = hsvColor.a ?? 1;

      const colordInstance = colord(hsvColor);

      this.#data.isDark = colordInstance.isDark();

      this.#data.hslString = HsvColorParser.convertColor({ ...hsvColor, a: 1 }, { precision: 3 });
      this.#data.hslHueString = HsvColorParser.convertColor({ h: hsvColor.h, s: 100, v: 100, a: 1 }, { precision: 3 });
      this.#data.hslaString = HsvColorParser.convertColor(hsvColor, { precision: 3 });

      // Update current color based on `format` and `formatType`
      this.#data.currentColor = HsvColorParser.convertColor(hsvColor, this.#data);
   }

   #updateCurrentColor({ h = this.#data.hue, sv = this.#data.sv, a = this.#data.alpha, textUpdate = false } = {})
   {
      const newHsv = { h, s: sv.s, v: sv.v, a };

      this.#updateColorData(newHsv);

      // Update TextState store if the update didn't come from TextState.
      if (!textUpdate) { this.#stores.textState.updateColor(newHsv); }

      this.#lastTime = globalThis.performance.now();

      this.#storeSet.currentColor(this.#data.currentColor);
      this.#storeSet.isDark(this.#data.isDark);

      this.#storeSet.hslString(this.#data.hslString);
      this.#storeSet.hslHueString(this.#data.hslHueString);
      this.#storeSet.hslaString(this.#data.hslaString);
   }

   updateExternal(extColor)
   {
      // if (!this.#isExternalUpdate()) { return; }

      if (!colord(extColor).isValid())
      {
         console.warn(`TJSColorPicker warning: 'color' prop set externally is not valid; '${extColor}'.`)
         return;
      }

      const newHsv = HsvColorParser.parseExternal(extColor);

      if (colord(newHsv).isEqual(this.#data.currentColor)) { return; }

      if (typeof newHsv.h === 'number') { this.#stores.hue.set(newHsv.h); }

      if (typeof newHsv.s === 'number' && typeof newHsv.v === 'number')
      {
         this.#stores.sv.set({ s: newHsv.s, v: newHsv.v });
      }

      if (typeof newHsv.a === 'number') { this.#stores.alpha.set(newHsv.a); }
   }

   /**
    * Updates options related to ColorState.
    *
    * @param {TJSColorPickerOptions}   options -
    */
   updateOptions(options)
   {
      this.#validateOptions(options);

      let updateColor = false;

      if (options.format !== void 0 && options.format !== this.#data.format)
      {
         this.#data.format = options.format;
         updateColor = true;
      }

      if (options.formatType !== void 0 && options.formatType !== this.#data.formatType)
      {
         this.#data.formatType = options.formatType;
         updateColor = true;
      }

      if (updateColor) { this.#updateCurrentColor(); }
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
    * Converts the internal HSV color to the given format and primitive type.
    *
    * @param {object}                  color - ColorD instance or HSV color to convert.
    *
    * @param {object}                  [opts] - Optional parameters.
    *
    * @param {'hex'|'hsl'|'hsv'|'rgb'} [opts.format='hsl'] - Format to convert to...
    *
    * @param {'object'|'string'}       [opts.formatType='string'] - Primitive type.
    *
    * @param {number}                  [opts.precision=0] - Primitive type.
    *
    * @returns {object|string} Converted color.
    */
   static convertColor(color, { hue = color?.h ?? color.hue(), format = 'hsl', formatType = 'string',
    precision = 0 } = {})
   {
      let result;

      const colordInstance = color instanceof Colord ? color : colord(color);

      if (formatType === 'object')
      {
         switch (format)
         {
            case 'hsl':
            {
               const newHsl = colordInstance.toHsl(precision);
               newHsl.h = ColorParser.round(hue, precision);
               result = newHsl;
               break;
            }

            case 'hsv':
               const newHsv = colordInstance.toHsv(precision);
               newHsv.h = ColorParser.round(hue, precision);
               result = newHsv;
               break;

            case 'rgb':
            {
               result = colordInstance.toRgb(precision);
               break;
            }
         }
      }
      else
      {
         switch (format)
         {
            case 'hex':
               result = colordInstance.toHex(precision);
               break;

            case 'hsl':
            {
               const newHsl = colordInstance.toHslString(precision);
               const hsvColor = colordInstance.toHsv();

               // The colord conversion will not maintain hue when `s` or `v` is `0`.
               // Replace hue value with rounded original hue from `hsvColor`.
               result = hsvColor.s === 0 || hsvColor.v === 0 ?
                newHsl.replace(/(hsla?\()\s*([+-]?\d*\.?\d+)(.*)/, (match, p1, p2, p3) =>
                 `${p1}${ColorParser.round(hue, precision)}${p3}`) : newHsl;
               break;
            }

            case 'rgb':
               result = colordInstance.toRgbString(precision);
               break;
         }
      }

      return result;
   }

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

      // Parse initial hue value from `hsl` or `hsv` formats.
      if (colorModel.format === 'hsv' && colorModel.type === 'object')
      {
         initialHue = color.h ?? 0;
      }
      else if (colorModel.format === 'hsl')
      {
         switch (colorModel.type)
         {
            case 'object':
               initialHue = color.h ?? 0;
               break;

            case 'string':
            {
               const match = this.#hslaMatcherComma.exec(color) ?? this.#hslaMatcherSpace.exec(color);
               if (match) { initialHue = ColorParser.parseHue(match[1], match[2]); }
            }
         }
      }

      const newHsv = colord(color).toHsv(5);
      newHsv.h = ColorParser.clampHue(initialHue);

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
 * @property {number} precision - The rounding precision for the current color output.
 *
 * @property {string} hslString - Current color as RGB string without `alpha` component.
 *
 * @property {string} hslHueString - Current hue as RGB string.
 *
 * @property {string} hslaString - Current color as RGB string with `alpha` component.
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
 * @property {import('svelte/store').Readable<string>} hslString - The current color / RGB only string.
 *
 * @property {import('svelte/store').Readable<string>} hslHueString - The current color hue / RGB only string.
 *
 * @property {import('svelte/store').Readable<string>} hslaString - The current color / RGBA only string.
 *
 * @property {import('svelte/store').Writable<{ s: number, v: number }>} sv - The saturation / value pair for HSV components.
 */

