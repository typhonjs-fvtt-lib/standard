import { isIterable } from '@typhonjs-svelte/lib/util';

/**
 * First pass at a system to create a unique style sheet for the UI library that loads default values for all CSS
 * variables.
 */
export class StyleManager
{
   /** @type {string} */
   #docKey;

   /** @type {string} */
   #selector;

   /** @type {HTMLStyleElement} */
   #styleElement;

   /** @type {CSSStyleRule} */
   #cssRule;

   /**
    *
    * @param {object}   opts - Options.
    *
    * @param {string}   opts.docKey - Required key providing a link to a specific style sheet element.
    *
    * @param {string}   [opts.selector=:root] - Selector element.
    *
    * @param {Document} [opts.document] - Target document to load styles into.
    *
    */
   constructor({ docKey, selector = ':root', document = globalThis.document } = {})
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
    * Provides an accessor to get the `cssText` for the style sheet.
    *
    * @returns {string}
    */
   get cssText()
   {
      return this.#cssRule.style.cssText;
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

   get()
   {
      const cssText = this.#cssRule.style.cssText;

      const result = {};

      if (cssText !== '')
      {
         for (const entry of cssText.split(';'))
         {
            if (entry !== '')
            {
               const values = entry.split(':');
               result[values[0].trim()] = values[1];
            }
         }
      }

      return result;
   }

   /**
    * Gets a particular CSS variable.
    *
    * @param {string}   key - CSS variable property key.
    *
    * @returns {string} Returns CSS variable value.
    */
   getProperty(key)
   {
      return this.#cssRule.style.getPropertyValue(key);
   }

   /**
    * Set rules by property / value; useful for CSS variables.
    *
    * @param {Object<string, string>}  rules - An object with property / value string pairs to load.
    *
    * @param {boolean}                 [overwrite=true] - When true overwrites any existing values.
    */
   setProperties(rules, overwrite = true)
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
    * Sets a particular property.
    *
    * @param {string}   key - CSS variable property key.
    *
    * @param {string}   value - CSS variable value.
    *
    * @param {boolean}  [overwrite=true] - Overwrite any existing value.
    */
   setProperty(key, value, overwrite = true)
   {
      if (overwrite)
      {
         this.#cssRule.style.setProperty(key, value);
      }
      else
      {
         if (this.#cssRule.style.getPropertyValue(key) === '')
         {
            this.#cssRule.style.setProperty(key, value);
         }
      }
   }

   /**
    * Removes the property keys specified. If `keys` is a string a single property is removed. Or if `keys` is an
    * iterable list then all property keys in the list are removed.
    *
    * @param {string|Iterable<string>} keys - The property keys to remove.
    */
   removeProperties(keys)
   {
      if (isIterable(keys))
      {
         for (const key of keys)
         {
            if (typeof key === 'string') { this.#cssRule.style.removeProperty(key); }
         }
      }
   }

   /**
    * Removes a particular CSS variable.
    *
    * @param {string}   key - CSS variable property key.
    *
    * @returns {string} CSS variable value when removed.
    */
   removeProperty(key)
   {
      return this.#cssRule.style.removeProperty(key);
   }
}
