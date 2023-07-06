import { isObject }     from '#runtime/util/object';

import { FVTTVersion }  from '../util/FVTTVersion.js';

/**
 * Loads FVTT core fonts supporting `FontConfig` on Foundry v10+.
 *
 * Note: This class contains code modified from Foundry VTT core client code. There are only so many ways to process
 * core Foundry data structures correctly.
 */
export class FontManager
{
   /**
    * Collect all the font definitions and combine them.
    *
    * @returns { {[key: string]: globalThis.FontFamilyDefinition}[] } Core font definitions.
    */
   static getCoreDefinitions()
   {
      /** @type { {[key: string]: globalThis.FontFamilyDefinition}[] } */
      const fonts = [];

      if (FVTTVersion.isAtLeast(10))
      {
         let legacyFamilies;

         /**
          * @deprecated since v10, so check that it exists.
          */
         if (Array.isArray(globalThis.CONFIG?._fontFamilies))
         {
            legacyFamilies = globalThis.CONFIG._fontFamilies.reduce((obj, f) =>
            {
               obj[f] = { editor: true, fonts: [] };
               return obj;
            }, {});
         }

         if (Array.isArray(globalThis.CONFIG?.fontDefinitions))
         {
            fonts.push(globalThis.foundry.utils.duplicate(globalThis.CONFIG.fontDefinitions));
         }

         const coreFonts = globalThis.game?.settings.get('core', 'fonts');
         if (Array.isArray(coreFonts))
         {
            fonts.push(globalThis.foundry.utils.duplicate(coreFonts));
         }

         if (legacyFamilies) { fonts.push(legacyFamilies); }
      }
      else
      {
         if (Array.isArray(globalThis.CONFIG?.fontFamilies))
         {
            // Handle v9 and below legacy font families.
            const legacyFamilies = globalThis.CONFIG.fontFamilies.reduce((obj, f) =>
            {
               obj[f] = { editor: true, fonts: [] };
               return obj;
            }, {});

            fonts.push(legacyFamilies);
         }
      }

      FontManager.removeDuplicateDefinitions(fonts);

      return fonts;
   }

   /**
    * Load a font definition.
    *
    * @param {string}               fontSpecification - The font specification.
    *
    * @param {string}               family - The font family name (case-sensitive).
    *
    * @param {globalThis.FontFamilyDefinition} definition - The font family definition.
    *
    * @param {Document}             document - Target Document to load font into.
    *
    * @returns {Promise<boolean>} Returns true if the font was successfully loaded.
    */
   static async #loadFont(fontSpecification, family, definition, document)
   {
      try
      {
         for (const fontEntry of definition.fonts)
         {
            // Collect URLs from FontDefinition.
            const urls = fontEntry.urls.map((url) => `url("${url}")`).join(', ');

            // Note: 'font' contains 'FontFaceDescriptors' data.
            const fontFace = new FontFace(family, urls, fontEntry);
            await fontFace.load();

            document.fonts.add(fontFace);
         }

         await document.fonts.load(fontSpecification);
      }
      catch (err)
      {
         console.warn(`Font family "${family}" failed to load: `, err);
         return false;
      }

      if (!document.fonts.check(fontSpecification))
      {
         console.warn(`Font family "${family}" failed to load.`);
         return false;
      }

      return true;
   }

   /**
    * Ensure that fonts have loaded and are ready for use.
    * Enforce a maximum timeout in milliseconds.
    * Proceed after that point even if fonts are not yet available.
    *
    * @param {object} [opts] - Optional parameters.
    *
    * @param {number} [opts.ms=4500] - The maximum time to spend loading fonts before proceeding.
    *
    * @param {Document} [opts.document] - The target document to load the fonts into.
    *
    * @param {boolean} [opts.editor=true] - When true verifies the `editor` field of {@link FontFamilyDefinition}.
    *
    * @param {(
    *    {[key: string]: globalThis.FontFamilyDefinition}[] |
    *    {[key: string]: globalThis.FontFamilyDefinition}
    * )} [opts.fonts] - A custom set of font family definitions to load. If not defined the core font family definitions
    *    are loaded.
    *
    * @returns {Promise<void>}
    */
   static async loadFonts({ ms = 4500, document = globalThis.document, editor = true, fonts } = {})
   {
      // TODO sanity checks

      const allFonts = fonts ? Array.isArray(fonts) ? fonts : [fonts] : this.getCoreDefinitions();

      const promises = [];

      for (const definitions of allFonts)
      {
         if (isObject(definitions))
         {
            for (const [family, definition] of Object.entries(definitions))
            {
               // Don't load a font that is not marked to be used in the editor.
               if (editor && (typeof definition.editor !== 'boolean' || !definition.editor)) { continue; }

               const fontSpecification = `1rem "${family}"`;

               // Early out if the font is already loaded.
               if (document.fonts.check(fontSpecification)) { continue; }

               promises.push(this.#loadFont(fontSpecification, family, definition, document));
            }
         }
      }

      const timeout = new Promise((resolve) => setTimeout(resolve, ms));
      const ready = Promise.all(promises).then(() => document.fonts.ready);

      return Promise.race([ready, timeout]);
   }

   /**
    * Removes duplicate font definitions.
    *
    * @param { {[key: string]: globalThis.FontFamilyDefinition}[] }  fonts - An array of FontFamilyDefinition objects
    *        to process.
    *
    * @returns { {[key: string]: globalThis.FontFamilyDefinition}[] } Filtered font definitions.
    */
   static removeDuplicateDefinitions(fonts)
   {
      if (!Array.isArray(fonts))
      {
         throw new TypeError(`FontManager.removeDuplicateDefinitions error: 'fonts' is not an array.`);
      }

      const familySet = new Set();

      for (const definitions of fonts)
      {
         if (!isObject(definitions))
         {
            throw new TypeError(`FontManager.removeDuplicateDefinitions error: 'definitions' is not an object.`);
         }

         for (const family of Object.keys(definitions))
         {
            // Remove duplicate from current definitions set.
            if (familySet.has(family))
            {
               delete definitions[family];
            }
            else
            {
               familySet.add(family);
            }
         }
      }

      return fonts;
   }
}
