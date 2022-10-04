import { FVTTVersion } from './FVTTVersion.js';

/**
 * Loads FVTT core fonts supporting `FontConfig` on Foundry v10+.
 *
 * Note: This class contains code directly taken from Foundry VTT core client code.
 */
export class FontManager
{
   /**
    * Collect all the font definitions and combine them.
    *
    * @returns {Object<FontFamilyDefinition>[]}
    */
   static #collectDefinitions()
   {
      if (FVTTVersion.isV10)
      {
         /**
          * @deprecated since v10.
          */
         const legacyFamilies = CONFIG._fontFamilies.reduce((obj, f) =>
         {
            obj[f] = { editor: true, fonts: [] };
            return obj;
         }, {});

         return [CONFIG.fontDefinitions, game.settings.get('core', 'fonts'), legacyFamilies];
      }
      else
      {
         const legacyFamilies = CONFIG.fontFamilies.reduce((obj, f) =>
         {
            obj[f] = { editor: true, fonts: [] };
            return obj;
         }, {});

         return [legacyFamilies];
      }
   }

   /**
    * Load a font definition.
    *
    * @param {string}               family - The font family name (case-sensitive).
    *
    * @param {FontFamilyDefinition} definition - The font family definition.
    *
    * @param {Document}             document - Target Document to load font into.
    *
    * @returns {Promise<boolean>} Returns true if the font was successfully loaded.
    */
   static async #loadFont(family, definition, document)
   {
      const font = `1rem "${family}"`;

      try
      {
         for (const font of definition.fonts)
         {
            // Collect URLs from FontDefinition.
            const urls = font.urls.map(url => `url("${url}")`).join(', ');

            const fontFace = new FontFace(family, urls);
            await fontFace.load();

            document.fonts.add(fontFace);
         }

         await document.fonts.load(font);
      }
      catch (err)
      {
         console.warn(`Font family "${family}" failed to load: `, err);
         return false;
      }

      if (!document.fonts.check(font))
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
    * @returns {Promise<void>}
    */
   static async loadFonts({ ms = 4500, document = document, editor = true } = {})
   {
      const allFonts = this.#collectDefinitions();
      const promises = [];
      for (const definitions of allFonts)
      {
         if (typeof definitions === 'object')
         {
            // Don't load a font that is not marked to be used in the editor.
            if (editor && (typeof definitions.editor !== 'boolean' || !definitions.editor)) { continue; }

            for (const [family, definition] of Object.entries(definitions))
            {
               promises.push(this.#loadFont(family, definition, document));
            }
         }
      }

      const timeout = new Promise(resolve => setTimeout(resolve, ms));
      const ready = Promise.all(promises).then(() => document.fonts.ready);

      return Promise.race([ready, timeout]);
   }
}
