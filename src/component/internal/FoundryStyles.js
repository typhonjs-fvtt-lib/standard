import { isObject }        from '#runtime/util/object';
import { getRoutePrefix }  from '#runtime/util/path';

/**
 * Dynamically parses and indexes the core FVTT stylesheet at runtime, exposing a selector-to-style mapping by
 * individual selector parts that supports scoped CSS variable resolution. This enables the ability to flatten and
 * resolve complex nested `var(--...)` chains defined across multiple selectors and layers.
 *
 * When retrieving specific selector styles via {@link FoundryStyles.get} and {@link FoundryStyles.getProperty} it is
 * possible to provide additional parent selectors that may define scoped CSS variables. These parent variable
 * definitions will be substituted in the target selector data allowing specific element scoping of CSS variables to be
 * flattened.
 *
 * Core features:
 * - Parses only relevant `@layer` blocks based on `#ALLOWED_LAYERS`.
 * - Filters out selectors unlikely to impact element rendering.
 * - Enables resolution of scoped CSS variables using a parent-selector fallback chain.
 * - Provides both direct and resolved access to styles via `.get()` and `.getProperty()`.
 *
 * @example
 * ```js
 * import { FoundryStyles } from '#runtime/svelte/application';
 *
 * // The `props` object has styles w/ CSS variables resolved from `input[type="text"]` for the dark theme.
 * const props = FoundryStyles.get('input[type="text"]', { resolve: '.themed.theme-dark input' });
 * ```
 * 
 * @privateRemarks
 * TODO: Consider parsing all system / module stylesheets for exact overrides of selectors / styles captured in parsing
 * the core Foundry styles. This will potentially capture additional themes, but requires those theme modifications to
 * use the precise selectors that Foundry core does; sadly in practice it's not expected that the 3rd party dev
 * community will understand or properly target the core CSS selectors / variables correctly.
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

   /**
    * Parsed selector to associated style properties.
    *
    * @type {Map<string, { [key: string]: string }>}
    */
   static #sheetMap = new Map();

   static #initialized = false;

   /**
    * Entries iterator of selector / style properties objects.
    *
    * @returns {MapIterator<[string, { [p: string]: string }]>} Tracked CSS selector key / value iterator.
    */
   static entries()
   {
      if (!this.#initialized) { this.#initialize(); }

      return this.#sheetMap.entries();
   }

   /**
    * Gets all properties associated with the given selector(s). You may combine multiple selectors for a
    * combined result. You may also provide additional selectors as the `resolve` option to substitute any CSS variables
    * in the target selector(s).
    *
    * @param {string | string[]}   selector - A selector or array of selectors to retrieve.
    *
    * @param {object}   [opts] - Options.
    *
    * @param {string | string[]} [opts.resolve] - Additional selectors as CSS variable resolution sources.
    *
    * @returns {{ [key: string]: string } | undefined} Style properties object.
    */
   static get(selector, { resolve } = {})
   {
      if (!this.#initialized) { this.#initialize(); }

      if (typeof selector !== 'string' && !Array.isArray(selector))
      {
         throw new TypeError(`'selector' must be a string or an array.`);
      }

      if (resolve !== void 0 && typeof resolve !== 'string' && !Array.isArray(resolve))
      {
         throw new TypeError(`'resolve' must be a string or an array.`);
      }

      let result = void 0;

      if (Array.isArray(selector))
      {
         for (const entry of selector)
         {
            // If there is a direct selector match, then return a value immediately.
            if (this.#sheetMap.has(entry)) { result = Object.assign(result ?? {}, this.#sheetMap.get(entry)); }
         }
      }
      else
      {
         // If there is a direct selector match, then return a value immediately.
         if (this.#sheetMap.has(selector)) { result = Object.assign(result ?? {}, this.#sheetMap.get(selector)); }
      }

      if (result && typeof resolve === 'string' || Array.isArray(resolve))
      {
         this.#resolve(result, resolve);
      }

      return result;
   }

   /**
    * Gets a specific property value from the given `selector` and `property` key. Try and use a direct selector
    * match otherwise all keys are iterated to find a selector string that includes `selector`.
    *
    * @param {string | string[]}   selector - Selector to find.
    *
    * @param {string}   property - Specific property to locate.
    *
    * @param {object}   [opts] - Options.
    *
    * @param {string | string[]} [opts.resolve] - Additional selectors as CSS variable resolution sources.
    *
    * @returns {string | undefined} Style property value.
    */
   static getProperty(selector, property, { resolve } = {})
   {
      if (!this.#initialized) { this.#initialize(); }

      // If there is a direct selector match, then return a value immediately.
      const data = this.get(selector, { resolve });

      return isObject(data) && property in data ? data[property] : void 0;
   }

   /**
    * Test if `FoundryStyles` tracks the given selector.
    *
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
    * @param {string}   cssText - CSS text to parse from `CSSStyleRule`.
    *
    * @returns {{ [key: string]: string }} Parsed `cssText`.
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

   /**
    * Recursively parses / processes a CSSLayerBlockRule and encountered CSSStyleRule entries.
    *
    * @param {CSSLayerBlockRule} blockRule - The `CSSLayerBlockRule` to parse.
    *
    * @param {string}   parentLayerName - Name of parent CSS layer.
    */
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
    * Processes a `CSSStyleRule`.
    *
    * @param {CSSStyleRule} styleRule - Style rule to parse.
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

   /**
    * Resolves intermediate CSS variables defined in the `result` style properties object with data from the given
    * `resolve` selector(s).
    *
    * @param {{ [key: string]: string }} result - Copy of source selector style properties to resolve.
    *
    * @param {string | string[]} resolve -
    */
   static #resolve(result, resolve)
   {
      // Holds result entries that reference a CSS variable.
      const cssVars = new ResolveVars(result);

      if (cssVars.unresolvedCount)
      {
         const order = typeof resolve === 'string' ? [resolve] : resolve;

         for (const entry of order)
         {
            const parent = this.get(entry);

            if (!isObject(parent))
            {
               console.warn(
                `[TyphonJS Runtime] FoundryStyles - #resolve - Could not locate parent selector for resolution: '${
                 entry}'`);

               continue;
            }

            for (const cssVar of cssVars.keysUnresolved())
            {
               if (cssVar in parent) { cssVars.set(cssVar, parent[cssVar]); }
            }
         }
      }

      Object.assign(result, cssVars.resolved);
   }
}

/**
 * Encapsulates CSS variable resolution logic and data.
 */
class ResolveVars
{
   /**
    * Initial style properties w/ CSS variables to track.
    *
    * @type {Map<string, string>}
    */
   #propMap = new Map();

   /**
    * Reverse lookup for CSS variable name to associated property.
    *
    * @type {Map<string, Set<string>>}
    */
   #varToProp = new Map();

   /**
    * Resolved CSS variable from parent selector properties.
    *
    * @type {Map<string, string>}
    */
   #varResolved = new Map();

   /**
    * @param {{ [key: string]: string }} initial - Initial style entry to resolve.
    */
   constructor(initial)
   {
      for (const [prop, value] of Object.entries(initial))
      {
         const vars = [...value.matchAll(/var\((--[\w-]+)\)/g)].map((match) => match[1]);

         if (vars.length > 0)
         {
            this.#propMap.set(prop, value);

            for (const entry of vars)
            {
               if (!this.#varToProp.has(entry)) { this.#varToProp.set(entry, new Set()); }
               this.#varToProp.get(entry).add(prop);
            }
         }
      }
   }

   /**
    * @returns {{ [key: string]: string }} All fields that have been resolved.
    */
   get resolved()
   {
      const result = {};

      for (const entry of this.#varToProp.keys())
      {
         if (this.#varResolved.has(entry))
         {
            const props = this.#varToProp.get(entry);

            for (const prop of props)
            {
               const value = this.#propMap.get(prop);
               const varResolved = this.#varResolved.get(entry);

               if (value && varResolved)
               {
                  const replacement = value.replaceAll(`var(${entry})`, varResolved);

                  this.#propMap.set(prop, replacement);
                  result[prop] = replacement;
               }
            }
         }
      }

      return result;
   }

   /**
    * @returns {number} Unresolved field count.
    */
   get unresolvedCount()
   {
      let count = 0;

      for (const entry of this.#varToProp.keys())
      {
         if (!this.#varResolved.has(entry)) { count++; }
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
      return this.#varToProp.has(key);
   }

   /**
    * @returns {IterableIterator<string>} Unresolved entry iterator.
    *
    * @yields
    */
   *keysUnresolved()
   {
      for (const entry of this.#varToProp.keys())
      {
         if (!this.#varResolved.has(entry)) { yield entry; }
      }
   }

   /**
    * Sets the parent selector defined CSS variable for resolution.
    *
    * @param {string}   name - CSS variable name
    *
    * @param {string}   value - Value of target CSS variable.
    */
   set(name, value)
   {
      if (typeof value !== 'string' || value.length === 0) { return; }

      if (this.#varToProp.has(name) && !this.#varResolved.has(name)) { this.#varResolved.set(name, value); }
   }
}
