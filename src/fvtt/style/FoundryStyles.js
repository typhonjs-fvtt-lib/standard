import { isObject } from '#runtime/util/object';

/**
 * Parses the core Foundry style sheet creating an indexed object of properties by selector.
 */
export class FoundryStyles
{
   static #sheet = void 0;

   /** @type {Map<string, {[key: string]: string}>} */
   static #sheetMap = new Map();

   static #initialized = false;

   /**
    * Called once on initialization / first usage. Parses the core foundry style sheet.
    */
   static #initialize()
   {
      this.#initialized = true;

      const styleSheets = Array.from(document.styleSheets).filter((entry) => entry.href !== null);

      let sheet;

      const foundryStyleSheet = globalThis.foundry.utils.getRoute('/css/style.css');

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
      for (const rule of sheet.cssRules)
      {
         if (!(rule instanceof CSSStyleRule)) { continue; }

         const obj = {};

         // Parse `cssText` into an object of properties & values.
         for (const entry of rule.style.cssText.split(';'))
         {
            const parts = entry.split(':');

            // Sanity check.
            if (parts.length < 2) { continue; }

            obj[parts[0].trim()] = parts[1].trim();
         }

         this.#sheetMap.set(rule.selectorText, obj);
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

      // If there is a direct selector match then return a value immediately.
      if (this.#sheetMap.has(selector))
      {
         const data = this.#sheetMap.get(selector);
         return isObject(data) && property in data ? data[property] : void 0;
      }

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
