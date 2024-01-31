import { get, writable }         from '#svelte/store';

import { colord }                from '#runtime/color/colord';
import { Timing }                from '#runtime/util';
import { subscribeIgnoreFirst }  from '#runtime/util/store';

import { TextState }             from './text/TextState.js';

import { ColorParser }           from '../../util/ColorParser.js';

export class ColorState
{
   /** @type {Set<string>} */
   static #supportedFormats = new Set(['hex', 'hsl', 'hsv', 'rgb']);

   /** @type {Set<string>} */
   static #supportedFormatTypes = new Set(['object', 'string']);

   /** @type {import('./').ColorStateData} */
   #data = {
      alpha: 1,
      currentColor: 'hsl(0, 100%, 50%)',
      currentColorString: 'hsl(0, 100%, 50%)',
      format: 'hsl',
      formatType: 'string',
      hue: 0,
      initialPopupColor: 'hsl(0, 100%, 50%)',
      isDark: false,
      precision: 0,
      hslString: 'hsl(0, 100%, 50%)',
      hslHueString: 'hsl(0, 100%, 50%)',
      hslaString: 'hsla(0, 100%, 50%, 1)',
      lockTextFormat: false,
      sv: { s: 100, v: 100 }
   };

   /**
    * @type {import('../').InternalState}
    */
   #internalState;

   #lastTime = Number.MIN_SAFE_INTEGER;

   /** @type {import('./').ColorStateStores} */
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

   /** @type {import('./').ColorStateInternalUpdate} */
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
    * @param {import('../').InternalState}   internalState -
    *
    * @param {object|string}  color -
    *
    * @param {import('../../../').TJSColordPickerOptions}  options -
    */
   constructor(internalState, color, options)
   {
      this.#internalState = internalState;

      this.#validateOptions(options);

      // First attempt to parse color model format & type from any defined optional store.
      if (options.store)
      {
         const storeColor = get(options.store);

         if (storeColor !== void 0)
         {
            const colorFormat = ColorParser.getColorFormat(storeColor);

            // Post a warning message that any initial bound color prop is invalid. The default will be set to red.
            if (!colorFormat)
            {
               console.warn(`TJSColordPicker warning - initial 'options.store' for color is invalid: ${storeColor}`);
            }
            else
            {
               this.#data.format = colorFormat.format;
               this.#data.formatType = colorFormat.type;

               const initialHsv = HsvColorParser.parseExternal(storeColor);
               this.#updateColorData(initialHsv);
            }
         }
      }
      // Then potentially attempt to parse color model format & type from any `color` prop.
      else if (color !== void 0)
      {
         const colorFormat = ColorParser.getColorFormat(color);

         // Post a warning message that any initial bound color prop is invalid. The default will be set to red.
         if (!colorFormat)
         {
            console.warn(`TJSColordPicker warning - initial 'color' prop value is invalid: ${color}`);
         }
         else
         {
            this.#data.format = colorFormat.format;
            this.#data.formatType = colorFormat.type;

            const initialHsv = HsvColorParser.parseExternal(color);
            this.#updateColorData(initialHsv);
         }
      }

      // Override any parsed color format / format type above if explicitly set in initial options.
      if (typeof options.format === 'string') { this.#data.format = options.format; }
      if (typeof options.formatType === 'string') { this.#data.formatType = options.formatType; }

      // Set initial precision.
      this.#data.precision = internalState.precision;

      // 'alpha', 'hue', and 'sv' stores on subscription below invoke `#updateCurrentColor` on the next tick.
      this.#updateCurrentColorDebounce = Timing.debounce(() =>
      {
         this.#updateCurrentColor(this.#internalUpdate);
         this.#internalUpdate.h = void 0;
         this.#internalUpdate.sv = void 0;
         this.#internalUpdate.a = void 0;
         this.#internalUpdate.textUpdate = false;
      }, 0);

      // Cache externally "readable" store set methods.
      const tempStoreCurrentColor = writable(this.#data.currentColor);
      const tempStoreCurrentColorString = writable(this.#data.currentColorString);
      const tempStoreIsDark = writable(this.#data.isDark);
      const tempStoreHslString = writable(this.#data.hslString);
      const tempStoreHslHueString = writable(this.#data.hslHueString);
      const tempStoreHslaString = writable(this.#data.hslaString);

      this.#storeSet = {
         currentColor: tempStoreCurrentColor.set,
         currentColorString: tempStoreCurrentColorString.set,
         isDark: tempStoreIsDark.set,
         hslString: tempStoreHslString.set,
         hslaString: tempStoreHslaString.set,
         hslHueString: tempStoreHslHueString.set,
      };

      // Writable stores
      this.#stores.alpha = writable(this.#data.alpha);
      this.#stores.hue = writable(this.#data.hue);
      this.#stores.sv = writable(this.#data.sv);

      // Readable stores
      this.#stores.textState = new TextState(this, this.#internalUpdate);
      this.#stores.isDark = { subscribe: tempStoreIsDark.subscribe };
      this.#stores.hslString = { subscribe: tempStoreHslString.subscribe };
      this.#stores.hslHueString = { subscribe: tempStoreHslHueString.subscribe };
      this.#stores.hslaString = { subscribe: tempStoreHslaString.subscribe };
      this.#stores.currentColor = { subscribe: tempStoreCurrentColor.subscribe };
      this.#stores.currentColorString = { subscribe: tempStoreCurrentColorString.subscribe };

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

      // Subscribe to InternalState `hasAlpha` option to set ColorState alpha store when disabled.
      this.#unsubscribe.push(subscribeIgnoreFirst(internalState.stores.hasAlpha, (hasAlpha) =>
      {
         if (!hasAlpha) { this.#stores.alpha.set(1); }
      }));

      // Subscribe to InternalState `precision` option to set new color precision.
      this.#unsubscribe.push(subscribeIgnoreFirst(internalState.stores.precision, (precision) =>
      {
         this.#data.precision = precision;
         this.#updateCurrentColor();
      }));
   }

   /**
    * @returns {number} Alpha color data.
    */
   get alpha()
   {
      return this.#data.alpha;
   }

   /**
    * @returns {"hex"|"hsl"|"hsv"|"rgb"} Color format.
    */
   get format()
   {
      return this.#data.format;
   }

   /**
    * @returns {"object"|"string"} Color format data type.
    */
   get formatType()
   {
      return this.#data.formatType;
   }

   /**
    * @returns {number} Color hue data.
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

   /**
    * @returns {import('./').ColorStateStores} ColorState stores.
    */
   get stores()
   {
      return this.#stores;
   }

   /**
    * @returns {{s: number, v: number}} Saturation / Value data.
    */
   get sv()
   {
      return this.#data.sv;
   }

   /**
    * Unsubscribe from stores.
    */
   destroy()
   {
      for (const unsubscribe of this.#unsubscribe) { unsubscribe(); }
   }

   /**
    * Gets the current color in the specific format and format type.
    *
    * @param {object}                  [opts] - Optional parameters.
    *
    * @param {'hex'|'hsl'|'hsv'|'rgb'} [opts.format='hsl'] - Format to convert to...
    *
    * @param {'object'|'string'}       [opts.formatType='string'] - Primitive type.
    *
    * @param {number}                  [opts.precision=0] - Primitive type.
    *
    * @returns {object|string} Current color.
    */
   getColor(opts)
   {
      const currentHsv = { h: this.#data.hue, s: this.#data.sv.s, v: this.#data.sv.v, a: this.#data.alpha };

      return HsvColorParser.convertColor(currentHsv, opts);
   }

   /**
    * Returns initial color when in popup mode and container is openend.
    *
    * @returns {string|object} Initial color before popup.
    */
   getPopupColor()
   {
      return this.#data.initialPopupColor;
   }

   /**
    * Sets current color from given color data.
    *
    * @param {object|string}   color - Supported ColorD color format.
    */
   setColor(color)
   {
      let colordInstance = colord(color);
      if (colordInstance.isValid())
      {
         // If alpha is disabled then reset it in case the given color is not opaque.
         if (!this.#internalState.hasAlpha) { colordInstance = colordInstance.alpha(1); }

         const newHsv = colordInstance.toHsv();

         this.#stores.hue.set(newHsv.h);
         this.#stores.sv.set({ s: newHsv.s, v: newHsv.v });
         this.#stores.alpha.set(newHsv.a);
      }
      else
      {
         console.warn('TJSColordPicker setColor warning: Invalid color; ', color);
      }
   }

   /**
    * Saves the current color when in popup mode and picker is initially opened.
    */
   savePopupColor()
   {
      this.#data.initialPopupColor = this.#data.currentColor;
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

      // Update current color string based on `format` where string is defined or `hsl`.
      this.#data.currentColorString = HsvColorParser.convertColor(hsvColor, {
         format: this.#data.format === 'hsv' ? 'hsl' : this.#data.format,
         formatType: 'string',
         precision: this.#data.precision
      });
   }

   #updateCurrentColor({ h = this.#data.hue, sv = this.#data.sv, a = this.#data.alpha, textUpdate = false } = {})
   {
      const newHsv = { h, s: sv.s, v: sv.v, a };

      this.#updateColorData(newHsv);

      // Update TextState store if the update didn't come from TextState.
      if (!textUpdate) { this.#stores.textState.updateColor(newHsv); }

      this.#lastTime = globalThis.performance.now();

      this.#storeSet.currentColor(this.#data.currentColor);
      this.#storeSet.currentColorString(this.#data.currentColorString);
      this.#storeSet.isDark(this.#data.isDark);

      this.#storeSet.hslString(this.#data.hslString);
      this.#storeSet.hslHueString(this.#data.hslHueString);
      this.#storeSet.hslaString(this.#data.hslaString);
   }

   updateExternal(extColor)
   {
      if (!colord(extColor).isValid())
      {
         console.warn(`TJSColordPicker warning: 'color' prop set externally is not valid; '${extColor}'.`);
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
    * @param {import('../../../').TJSColordPickerOptions}   options -
    */
   updateOptions(options)
   {
      this.#validateOptions(options);

      let updateColor = false;

      if (options.format !== void 0 && options.format !== this.#data.format)
      {
         this.#data.format = options.format;
         updateColor = true;

         // Explicitly update text mode format when format mode changes.
         this.#stores.textState.updateFormat(this.#data.format);
      }

      if (options.formatType !== void 0 && options.formatType !== this.#data.formatType)
      {
         this.#data.formatType = options.formatType;
         updateColor = true;
      }

      if (options.lockTextFormat !== void 0 && options.lockTextFormat !== this.#data.lockTextFormat)
      {
         this.#data.lockTextFormat = options.lockTextFormat;

         // When switching to locked text format state set update text state format.
         if (this.#data.lockTextFormat) { this.#stores.textState.updateFormat(this.#data.format); }
      }

      if (updateColor) { this.#updateCurrentColor(); }
   }

   /**
    * Validates external user defined options.
    *
    * @param {import('../../../').TJSColordPickerOptions} opts -
    */
   #validateOptions(opts)
   {
      if (opts.format !== void 0)
      {
         if (typeof opts.format !== 'string') { throw new TypeError(`'options.format' is not a string.`); }

         if (!ColorState.#supportedFormats.has(opts.format))
         {
            throw new Error(`'TJSColordPicker error: Unknown format for 'options.format' - '${opts.format}'.`);
         }
      }

      if (opts.formatType !== void 0)
      {
         if (typeof opts.formatType !== 'string') { throw new TypeError(`'options.formatType' is not a string.`); }

         if (!ColorState.#supportedFormatTypes.has(opts.formatType))
         {
            throw new Error(
             `'TJSColordPicker error: Unknown format type for 'options.formatType' - '${opts.formatType}'.`);
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
    * @param {object}                  color - HSV color to convert.
    *
    * @param {object}                  [opts] - Optional parameters.
    *
    * @param {'hex'|'hsl'|'hsv'|'rgb'} [opts.format='hsl'] - Format to convert to...
    *
    * @param {'object'|'string'}       [opts.formatType='string'] - Primitive type.
    *
    * @param {number}                  [opts.hue] - Hue value.
    *
    * @param {number}                  [opts.precision=0] - Primitive type.
    *
    * @returns {object|string} Converted color.
    */
   static convertColor(color, { hue = color?.h, format = 'hsl', formatType = 'string',
    precision = 0 } = {})
   {
      let result;

      const colordInstance = colord(color);

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
            {
               const newHsv = colordInstance.toHsv(precision);
               newHsv.h = ColorParser.round(hue, precision);
               result = newHsv;
               break;
            }

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
               // Replace hue value with rounded original hue from `color`.
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
