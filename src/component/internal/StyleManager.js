/**
 * First pass at a system to create a unique style sheet for the UI library that loads default values for all CSS
 * variables.
 */
export class StyleManager
{
   #docKey;
   #selector;
   #styleElement;
   #cssRule;

   /**
    *
    * @param {object} opts - Options.
    *
    * @param {string} [opts.selector=:root] - Selector element.
    *
    * @param {string} docKey - Key
    *
    * @param {Document} [document] - Target document to load styles into.
    *
    */
   constructor({selector = ':root', docKey, document = globalThis.document} = {})
   {
      if (typeof selector !== 'string') { throw new TypeError(`StyleManager error: 'selector' is not a string.`); }
      if (typeof docKey !== 'string') { throw new TypeError(`StyleManager error: 'docKey' is not a string.`); }

      this.#selector = selector;
      this.#docKey = docKey;

      if (document[this.#docKey] === void 0)
      {
         this.#styleElement = document.createElement('style');

         document.head.append(this.#styleElement);

         this.#styleElement.sheet.insertRule(`${selector} {}`, 0);

         this.#cssRule = this.#styleElement.sheet.cssRules[0];

         document[docKey] = this.#styleElement;
      }
      else
      {
         this.#styleElement = document[docKey];
         this.#cssRule = this.#styleElement.sheet.cssRules[0];
      }
   }

   /**
    * Provides a copy constructor to duplicate an existing StyleManager instance into a new document.
    *
    * Note: This is used to support the `PopOut` module.
    *
    * @param [document] Target browser document to clone into.
    *
    * @returns {StyleManager} New style manager instance.
    */
   clone(document = globalThis.document)
   {
      const newStyleManager = new StyleManager({ selector: this.#selector, docKey: this.#docKey, document });

      newStyleManager.#cssRule.style.cssText = this.#cssRule.style.cssText;

      return newStyleManager;
   }

   /**
    * Set rules by property / value; useful for CSS variables.
    *
    * @param {Object<string, string>}  rules - An object with property / value string pairs to load.
    *
    * @param {boolean}                 [overwrite=false] - When true overwrites any existing values.
    */
   set(rules, overwrite = false)
   {
      if (overwrite)
      {
         for (const [key, value] of Object.entries(rules))
         {
            this.#cssRule.style.setProperty(key, value);
         }
      }
      else
      {
         // Only set property keys for entries that don't have an existing rule set.
         for (const [key, value] of Object.entries(rules))
         {
            if (this.#cssRule.style.getPropertyValue(key) === '')
            {
               this.#cssRule.style.setProperty(key, value);
            }
         }
      }
   }

   /**
    * Removes the property keys specified. If `keys` is a string a single property is removed. Or if `keys` is an
    * iterable list then all property keys in the list are removed.
    *
    * @param {string|Iterable<string>} keys - The property keys to remove.
    */
   remove(keys)
   {
      if (Array.isArray(keys))
      {
         for (const key of keys)
         {
            if (typeof key === 'string') { this.#cssRule.style.removeProperty(key); }
         }
      }
      else if (typeof keys === 'string')
      {
         this.#cssRule.style.removeProperty(keys);
      }
   }
}
