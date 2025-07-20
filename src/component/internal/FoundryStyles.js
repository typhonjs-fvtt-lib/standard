import { isObject }        from '#runtime/util/object';
import { getRoutePrefix }  from '#runtime/util/path';

/**
 * Parses the core Foundry style sheet creating an indexed object of properties by individual selector parts that are
 * viable to use for specific element styling.
 */
export class FoundryStyles
{
   /**
    * @type {Map<string, []>} Allowed fully qualified CSS layers to parse.
    */
   static #ALLOWED_LAYERS = new Map([
      ['variables.base', []],
      ['variables.themes.general', []],
      ['variables.themes.specific', []],
      ['elements.forms', []]
   ]);

   /**
    * @type {RegExp[]} Array of regexes to reduce selector parts tracked.
    */
   static #DISALLOWED_PARTS_ANY = [
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
   ];

   /**
    * Foundry stylesheet.
    *
    * @type {CSSStyleSheet}
    */
   static #sheet = void 0;

   /** @type {Map<string, {[key: string]: string}>} */
   static #sheetMap = new Map();

   static #initialized = false;

   /**
    * @returns {MapIterator<[string, {[p: string]: string}]>} Tracked CSS selector key / value iterator.
    */
   static entries()
   {
      if (!this.#initialized) { this.#initialize(); }

      return this.#sheetMap.entries();
   }

   /**
    * Gets all properties associated with the selector. Try and use a direct match otherwise all keys
    * are iterated to find a selector string that includes the `selector`.
    *
    * @param {string}   selector - Selector to find.
    *
    * @param {object}   [opts] - Options.
    *
    * @param {string | string[]} [opts.resolve] -
    *
    * @returns { {[key: string]: string} } Properties object.
    */
   static get(selector, { resolve } = {})
   {
      if (!this.#initialized) { this.#initialize(); }

      let result;

      // If there is a direct selector match then return a value immediately.
      if (this.#sheetMap.has(selector))
      {
         result = this.#sheetMap.get(selector);
      }

      // TODO: THIS LIKELY CAN BE REMOVED SINCE PARSING NOW SEPARATES ALL SELECTORS.
      // if (!result)
      // {
      //    for (const key of this.#sheetMap.keys())
      //    {
      //       if (key.includes(selector))
      //       {
      //          result = this.#sheetMap.get(key);
      //          break;
      //       }
      //    }
      // }

      if (typeof resolve === 'string' || Array.isArray(resolve))
      {
         this.#resolve(result, resolve);
      }

      return result;
   }

   /**
    *
    * @param {{ [key: string]: string }} result -
    *
    * @param {string | string[]} resolve -
    */
   static #resolve(result, resolve)
   {
      console.log(`!!! FoundryStyles - #resolve - 0 - result: \n${JSON.stringify(result, null, 2)}`);
      console.log(`!!! FoundryStyles - #resolve - 1 - resolve: ${JSON.stringify(resolve)}`);

      // Holds result entries that reference a CSS variable.
      const fields = new ResolveFields(result);

      if (fields.unresolvedCount)
      {
         console.log(`!!! FoundryStyles - #resolve - 2 - orig fields: \n${fields}`);

         const order = typeof resolve === 'string' ? [resolve] : resolve;

         for (const entry of order)
         {
            const parent = this.get(entry);

            if (!isObject(parent))
            {
               // TODO: GATE LOGGING
               console.warn(`!!! FoundryStyles - #resolve - Could not locate parent selector: '${entry}'`);
               continue;
            }

            console.log(`!!! FoundryStyles - #resolve - A0 - parent: \n${JSON.stringify(parent, null, 2)}`);

            for (const cssVar of fields.keysUnresolved())
            {
               if (cssVar in parent) { fields.set(cssVar, parent[cssVar]); }
            }

            console.log(`!!! FoundryStyles - #resolve - A1 - partial resolved fields: \n${fields}`);
         }
      }

      console.log(`!!! FoundryStyles - #resolve - 4 - final fields: \n${fields}`);

      console.log(`!!! FoundryStyles - #resolve - 4 - final resolved fields: \n${JSON.stringify(fields.resolved, null, 2)}`);

      result = Object.assign(result, fields.resolved);

      console.log(`!!! FoundryStyles - #resolve - B - resolve result: \n${JSON.stringify(result, null, 2)}`);
   }

   /**
    * Gets a specific property value from the given `selector` and `property` key. Try and use a direct selector
    * match otherwise all keys are iterated to find a selector string that includes `selector`.
    *
    * @param {string}   selector - Selector to find.
    *
    * @param {string}   property - Specific property to locate.
    *
    * @returns {string | undefined} Property value.
    */
   static getProperty(selector, property)
   {
      if (!this.#initialized) { this.#initialize(); }

      // If there is a direct selector match then return a value immediately.
      if (this.#sheetMap.has(selector))
      {
         const data = this.#sheetMap.get(selector);

         return isObject(data) && property in data ? data[property] : void 0;
      }

      // TODO: THIS LIKELY CAN BE REMOVED SINCE PARSING NOW SEPARATES ALL SELECTORS.
      // for (const key of this.#sheetMap.keys())
      // {
      //    if (key.includes(selector))
      //    {
      //       const data = this.#sheetMap.get(key);
      //       if (isObject(data) && property in data) { return data[property]; }
      //    }
      // }

      return void 0;
   }

   /**
    * @param {string}   selector - CSS selector to check.
    *
    * @returns {boolean} FoundryStyles tracks the given selector.
    */
   static has(selector)
   {
      if (!this.#initialized) { this.#initialize(); }

      return this.#sheetMap.has(selector);
   }

   /**
    * @returns {MapIterator<string>} Tracked CSS selector keys iterator.
    */
   static keys()
   {
      if (!this.#initialized) { this.#initialize(); }

      return this.#sheetMap.keys();
   }

   /**
    * @returns {CSSStyleSheet} Main Foundry stylesheet.
    */
   static get sheet()
   {
      if (!this.#initialized) { this.#initialize(); }

      return this.#sheet;
   }

   /**
    * @returns {number} Returns the size / count of selector properties tracked.
    */
   static get size()
   {
      if (!this.#initialized) { this.#initialize(); }

      return this.#sheetMap.size;
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Called once on initialization / first usage. Parses the core foundry style sheet.
    */
   static #initialize()
   {
      this.#initialized = true;

      const styleSheets = Array.from(document.styleSheets).filter((entry) => entry.href !== null);

      const foundryStyleSheet = getRoutePrefix('/css/foundry2.css');

      // Find the core Foundry stylesheet.
      for (const styleSheet of styleSheets)
      {
         let url;

         try
         {
            url = new URL(styleSheet.href);
         }
         catch (err) { continue; }

         if (typeof url.pathname === 'string' && url.pathname === foundryStyleSheet)
         {
            this.#sheet = styleSheet;
            break;
         }
      }

      // Quit now if the Foundry style sheet was not found.
      if (!this.#sheet) { return; }

      // Parse each CSSStyleRule and build the map of selectors to parsed properties.
      for (const layerRule of this.#sheet.cssRules)
      {
         if (!(layerRule instanceof CSSLayerBlockRule)) { continue; }
         if (!isObject(layerRule.cssRules)) { continue; }
         if (layerRule?.name === 'reset') { continue; }

         this.#processLayerBlockRule(layerRule);
      }
   }

   /**
    * @param {string}   cssText -
    *
    * @returns {{[p: string]: string}} Parsed `cssText`.
    */
   static #parseCssText(cssText)
   {
      const match = cssText.match(/{([^}]*)}/);
      if (!match) { return {}; }

      return Object.fromEntries(match[1]
         .split(';')
         .map((str) => str.trim())
         .filter(Boolean)
         .map((decl) =>
         {
            const [prop, ...rest] = decl.split(':');
            return [prop.trim(), rest.join(':').trim()];
         })
      );
   }

   static #processLayerBlockRule(blockRule, parentLayerName)
   {
      if (!(blockRule instanceof CSSLayerBlockRule)) { return; }
      if (!isObject(blockRule.cssRules)) { return; }

      const fullname = typeof parentLayerName === 'string' ? `${parentLayerName}.${blockRule.name}` : blockRule.name;

      const layerBlockRules = [];

      for (const rule of blockRule.cssRules)
      {
         if (rule instanceof CSSLayerBlockRule) { layerBlockRules.push(rule); }
         if (!(rule instanceof CSSStyleRule)) { continue; }

         if (this.#ALLOWED_LAYERS.has(fullname)) { this.#processStyleRule(rule); }
      }

      for (const rule of layerBlockRules)
      {
         if (rule instanceof CSSLayerBlockRule) { this.#processLayerBlockRule(rule, fullname); }
      }
   }

   /**
    * @param {CSSStyleRule} styleRule -
    */
   static #processStyleRule(styleRule)
   {
      if (typeof styleRule.selectorText !== 'string') { return; }

      const result = this.#parseCssText(styleRule.cssText);

      // Split selector parts and remove disallowed selector parts and empty strings.
      const selectorParts = styleRule.selectorText.split(',')
         .map((str) => str.trim())
         .filter((str) => !this.#DISALLOWED_PARTS_ANY.some((regex) => regex.test(str)))
         .filter(Boolean); // Remove empty parts.

      if (selectorParts.length)
      {
         for (const part of selectorParts)
         {
            const existing = this.#sheetMap.get(part);
            const update = Object.assign(existing ?? {}, result);
            this.#sheetMap.set(part, update);
         }
      }
   }
}

class ResolveFields
{
   /** @type {Map<string, ResolveEntry>} */
   #entries = new Map();

   static isCSSVar(key)
   {
      return (/^--[\w-]+$/).test(key);
   }

   /**
    * @param {{ [key: string]: string }} initial - Initial style entry to resolve.
    */
   constructor(initial)
   {
      for (const entry in initial)
      {
         const match = initial[entry].match(/^var\((--[\w-]+)\)$/);
         if (match)
         {
            this.#entries.set(match[1], { origKey: entry, cssVar: match[1], resolved: null });
         }
      }
   }

   /**
    * @returns {{ [key: string]: string }} All fields that have been resolved.
    */
   get resolved()
   {
      const result = {};

      for (const entry of this.#entries.values())
      {
         if (typeof entry.resolved === 'string') { result[entry.origKey] = entry.resolved; }
      }

      return result;
   }

   /**
    * @returns {number} Unresolved field count.
    */
   get unresolvedCount()
   {
      let count = 0;

      for (const entry of this.#entries.values())
      {
         if (entry.resolved === null) { count++; }
      }

      return count;
   }

   /**
    * @param {string}   key - Potential CSS var to check if tracked.
    *
    * @returns {boolean} Key is tracked.
    */
   has(key)
   {
      return this.#entries.has(key);
   }

   /**
    * @returns {IterableIterator<string>} Unresolved entry iterator.
    *
    * @yields
    */
   *keysUnresolved()
   {
      for (const entry of this.#entries.values())
      {
         if (entry.resolved === null) { yield entry.cssVar; }
      }
   }

   set(key, value)
   {
      if (typeof value !== 'string' || value.length === 0)
      {
         return;
      }

      const entry = this.#entries.get(key);
      if (entry) { entry.resolved = value; }
   }

   toString()
   {
      return `[\n${[...this.#entries.values()].map((entry) => `  ${JSON.stringify(entry)}`).join(',\n')}\n]`;
   }
}

/**
 * @typedef {object} ResolveEntry
 *
 * @property {string} origKey - Original style key.
 *
 * @property {string} cssVar - CSS variable to substitute.
 *
 * @property {string | null} resolved - Resolved value or null.
 */
