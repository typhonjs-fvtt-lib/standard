import { StyleSheetResolve }  from '#runtime/util/dom/style';
import { getRoutePrefix }     from '#runtime/util/path';

/**
 * @privateRemarks
 * TODO: Consider parsing all system / module stylesheets for exact overrides of selectors / styles captured in parsing
 * the core Foundry styles. This will potentially capture additional themes, but requires those theme modifications to
 * use the precise selectors that Foundry core does; sadly in practice it's not expected that the 3rd party dev
 * community will understand or properly target the core CSS selectors / variables correctly.
 */
export class FoundryStyles
{
   static #core;

   static #ext;

   static #initialized = false;

   /**
    * @hideconstructor
    */
   constructor()
   {
      throw new Error('FoundryStyles constructor: This is a static class and should not be constructed.');
   }

   /**
    * @returns {StyleSheetResolve} Core parsed styles.
    */
   static get core()
   {
      if (!this.#initialized)
      {
         this.#initialized = true;
         this.#initialize();
      }

      return this.#core;
   }

   /**
    * @returns {StyleSheetResolve} Core parsed styles with extended game system / module overrides.
    */
   static get ext()
   {
      if (!this.#initialized)
      {
         this.#initialized = true;
         this.#initialize();
      }

      return this.#ext;
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   static #initialize()
   {
      // Find the Foundry core stylesheet ----------------------------------------------------------------------------

      const styleSheets = Array.from(document.styleSheets).filter((entry) => entry.href !== null);

      const foundryStyleSheetPath = getRoutePrefix('/css/foundry2.css');

      let foundryStyleSheet;

      // Find the core Foundry stylesheet.
      for (const sheet of styleSheets)
      {
         let url;

         try
         {
            url = new URL(sheet.href);
         }
         catch (err) { continue; }

         if (typeof url.pathname === 'string' && url.pathname === foundryStyleSheetPath)
         {
            foundryStyleSheet = sheet;
            break;
         }
      }

      // Quit now if the Foundry style sheet was not found.
      if (!foundryStyleSheet)
      {
         console.error(`[TyphonJS Runtime] error: FoundryStyles could not load core stylesheet.`);
      }

      // Create StyleSheetResolve for Foundry core sheet -------------------------------------------------------------

      this.#core = new StyleSheetResolve(foundryStyleSheet, {
         // Exclude any selector parts that match the following.
         excludeSelectorParts: [
            />\s*[^ ]+/,            // Direct child selectors
            /(^|\s)\*/,             // Universal selectors
            /(^|\s)\.app(?![\w-])/, // AppV1 class
            /^\.application\.theme/,
            /^body\.auth/,
            /^body(?:\.[\w-]+)*\.application\b/,  // Remove unnecessary `body.<theme>.application` pairing.
            /code-?mirror/i,
            /#camera-views/,
            /\.chat-message/,
            /\.combat-tracker/,
            /\.compendium-directory/,
            /(^|[^a-zA-Z0-9_-])#(?!context-menu\b)[\w-]+|[^ \t>+~]#context-menu\b/,
            /(^|\s)kbd\b/,
            /^input.placeholder-fa-solid\b/,
            /(^|\s)label\b/,
            /\.placeable-hud/,
            /prose-?mirror/i,
            /(^|\s)section\b/,
            /\.ui-control/,
            /\.window-app/,
         ],

         // Included fully qualified CSS layers to parse.
         includeCSSLayers: [
            /^variables\.base$/,
            /^variables\.themes\.general$/,
            /^variables\.themes\.specific$/,
            /^elements\.forms$/,
         ]
      });

      this.#ext = new StyleSheetResolve(new Map(this.#core.entries()));
   }
}
