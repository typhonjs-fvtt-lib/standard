import { isObject }  from '@typhonjs-fvtt/svelte/util';

import { getFormat } from '@typhonjs-fvtt/runtime/color/colord';

export class DataValidator
{
   /**
    * This regex tests for correct CSS variable names according to the CSS specification.
    *
    * @type {RegExp}
    *
    * @see https://www.w3.org/TR/css-variables-1/#defining-variables
    * @see https://www.w3.org/TR/css-syntax-3/#ident-token-diagram
    */
   static #REGEX_CSS_VAR_NAME =
    /--(?:[_a-zA-Z\u00A0-\uFFFF]|\\[0-9a-fA-F]{1,6})(?:[\w\u00A0-\uFFFF-]|\\[0-9a-fA-F]{1,6})*/;

   static #SET_TYPES = new Set(['color']);

   static dataEntry(entry, cntr)
   {
      const result = Object.assign({}, entry);

      if (!isObject(entry))
      {
         throw new TypeError(`TJSThemeStore initialize error: data[${cntr}] entry is not an object.`);
      }

      if (typeof entry.label !== 'string')
      {
         throw new Error(
          `TJSThemeStore initialize error: data[${cntr}] 'entry.label' is not a string.`);
      }

      if (typeof entry.type !== 'string')
      {
         throw new Error(
          `TJSThemeStore initialize error: data[${cntr}] 'entry.type' is not a string.`);
      }

      if (!this.#SET_TYPES.has(entry.type))
      {
         throw new Error(`TJSThemeStore initialize error: data[${cntr}] 'entry.type' unknown.`);
      }

      if (entry.var !== void 0 && typeof entry.var !== 'string')
      {
         throw new TypeError(`TJSThemeStore initialize error: data[${cntr}] 'entry.var' is not a string.`);
      }

      // Handle common data for CSS variable entries.
      if (typeof entry.var === 'string')
      {
         // Test for valid CSS variable name
         if (!this.#REGEX_CSS_VAR_NAME.test(entry.var))
         {
            throw new Error(
             `TJSThemeStore initialize error: data[${cntr}] 'entry.var' is not a valid CSS variable name.`);
         }

         if (typeof entry.default !== 'string')
         {
            throw new TypeError(`TJSThemeStore initialize error: data[${cntr}] 'entry.default' is not a string.`);
         }
      }

      switch (entry.type)
      {
         case 'color':
         {
            // Verify that default value is a supported color format.
            const format = getFormat(entry.default);
            if (!format)
            {
               throw new Error(`TJSThemeStore initialize error: data[${cntr}] 'entry.default' unknown color format.`);
            }

            // Add the color format to entry result data.
            result.format = format;
            break;
         }
      }

      return result;
   }
}
