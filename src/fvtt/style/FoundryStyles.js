import { isObject } from '#runtime/util/object';

/**
 * Parses the core Foundry style sheet creating an indexed object of properties by selector parts.
 */
export class FoundryStyles
{
   static #ALLOWED_LAYERS = new Map([
      ['variables.base', []],
      ['variables.themes.general', []],
      ['variables.themes.specific', []],
      ['elements.forms', []]
   ]);

   static #DISALLOWED_PARTS_ANY = [
      />\s*[^ ]+/,            // Direct child selectors
      /(^|\s)\*/,             // Universal selectors
      /(^|\s)\.app(?![\w-])/, // AppV1 class
      /^\.application\.theme/,
      /^body\.auth/,
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

   static #logEnabledEntries = false;
   static #logEnabledKeys = false;
   static #logEnabledParts = false;

   static #sheet = void 0;

   /** @type {Map<string, {[key: string]: string}>} */
   static #sheetMap = new Map();

   static #initialized = false;

   // TODO REMOVE
   static init() { this.#initialize(); }

   /**
    * Called once on initialization / first usage. Parses the core foundry style sheet.
    */
   static #initialize()
   {
      this.#initialized = true;

      const styleSheets = Array.from(document.styleSheets).filter((entry) => entry.href !== null);

      let sheet;

      const foundryStyleSheet = globalThis.foundry.utils.getRoute('/css/foundry2.css');

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
            this.#sheet = sheet = styleSheet;
            break;
         }
      }

      // Quit now if the Foundry style sheet was not found.
      if (!sheet) { return; }

      // Parse each CSSStyleRule and build the map of selectors to parsed properties.
      for (const layerRule of sheet.cssRules)
      {
         if (!(layerRule instanceof CSSLayerBlockRule)) { continue; }
         if (!isObject(layerRule.cssRules)) { continue; }
         if (layerRule?.name === 'reset') { continue; }

         this.#processLayerBlockRule(layerRule);
      }

      if (this.#logEnabledKeys)
      {
         console.log(`!!! FoundryStyles - #initialize - 1 - this.#sheetMap keys:`);
         console.log(JSON.stringify(Array.from(this.#sheetMap.keys()), null, 2));
      }

      if (this.#logEnabledEntries)
      {
         console.log(`!!! FoundryStyles - #initialize - 1 - this.#sheetMap entries:`);
         console.log(JSON.stringify(Object.fromEntries(this.#sheetMap), null, 2));
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

      if (this.#logEnabledParts && this.#ALLOWED_LAYERS.has(fullname))
      {
         console.log(`\n\n!!! FoundryStyles - #processLayerBlockRule - fullname: `, fullname);
      }

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
      if (this.#logEnabledParts) { console.log(styleRule.selectorText); }


      if (typeof styleRule.selectorText === 'string')
      {
         const result = this.#parseCssText(styleRule.cssText);

         // Split selector parts and remove empty strings.
         const selectorParts = styleRule.selectorText.split(',')
            .map((str) => str.trim())
            .filter((str) => !this.#DISALLOWED_PARTS_ANY.some((regex) => regex.test(str)))
            .filter(Boolean); // Remove empty parts.

         if (this.#logEnabledParts)
         {
            for (const part of selectorParts) { console.log(`! P: ${part}`); }
         }

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

   /**
    * Gets the properties object associated with the selector. Try and use a direct match otherwise all keys
    * are iterated to find a selector string that includes the `selector`.
    *
    * @param {string}   selector - Selector to find.
    *
    * @returns { {[key: string]: string} } Properties object.
    */
   static getProperties(selector)
   {
      if (!this.#initialized) { this.#initialize(); }

      // If there is a direct selector match then return a value immediately.
      if (this.#sheetMap.has(selector))
      {
         return this.#sheetMap.get(selector);
      }

      for (const key of this.#sheetMap.keys())
      {
         if (key.includes(selector)) { return this.#sheetMap.get(key); }
      }

      return void 0;
   }

   /**
    * Gets a specific property value from the given `selector` and `property` key. Try and use a direct selector
    * match otherwise all keys are iterated to find a selector string that includes `selector`.
    *
    * @param {string}   selector - Selector to find.
    *
    * @param {string}   property - Specific property to locate.
    *
    * @returns {string|undefined} Property value.
    */
   static getProperty(selector, property)
   {
      if (!this.#initialized) { this.#initialize(); }

console.log(`!!! FoundryStyles - getProperty - 0 - selector: ${selector}; property: ${property}`)

      // If there is a direct selector match then return a value immediately.
      if (this.#sheetMap.has(selector))
      {
         const data = this.#sheetMap.get(selector);

console.log(`!!! FoundryStyles - getProperty - 1 - isObject(data): ${isObject(data)}; isObject(data) && property in data: ${isObject(data) && property in data}`);

         return isObject(data) && property in data ? data[property] : void 0;
      }

console.log(`!!! FoundryStyles - getProperty - 2`)

      for (const key of this.#sheetMap.keys())
      {
         if (key.includes(selector))
         {
            const data = this.#sheetMap.get(key);
            if (isObject(data) && property in data) { return data[property]; }
         }
      }

      return void 0;
   }
}
