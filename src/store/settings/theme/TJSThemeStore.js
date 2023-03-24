import { writable }        from 'svelte/store';

import { getFormat }       from '@typhonjs-fvtt/runtime/color/colord';

import { propertyStore }   from '@typhonjs-fvtt/svelte/store';

import {
   isIterable,
   isObject,
   StyleManager }          from '@typhonjs-fvtt/svelte/util';

import {
   DataValidator,
   SemVer }                from './DataValidator.js';

import { TJSGameSettings } from '../TJSGameSettings.js';

/**
 * Must be constructed from a TJSGameSettings instance `init` / initialize method called from the `ready` Foundry VTT
 * hook.
 */
export class TJSThemeStore
{
   /** @type {object[]} */
   #components;

   #data = {};

   #defaultThemeData;

   #initialThemeData;

   #settingsStoreHandler;

   /**
    * @type {Object<string, import('svelte/store').Writable<string|null>>}
    */
   #stores = {};

   /**
    * @type {StyleManager}
    */
   #styleManager;

   /**
    * Stores the subscribers.
    *
    * @type {(function(data): void)[]}
    */
   #subscriptions = [];

   /**
    * Stores all CSS variable keys.
    *
    * @type {string[]}
    */
   #vars;

   /**
    * @type {SemVerData}
    */
   #version;

   /**
    * @param {TJSThemeStoreOptions} options - Options
    */
   constructor(options)
   {
      if (!isObject(options)) { throw new TypeError(`'options' is not an object.`); }

      if (typeof options.namespace !== 'string') { throw new TypeError(`'namespace' attribute is not a string.`); }

      if (typeof options.key !== 'string') { throw new TypeError(`'key' attribute is not a string.`); }

      if (!(options.gameSettings instanceof TJSGameSettings))
      {
         throw new TypeError(`'gameSettings' attribute is not an instance of TJSGameSettings.`);
      }

      if (!(options.styleManager instanceof StyleManager))
      {
         throw new TypeError(`'styleManager' attribute is not an instance of StyleManager.`);
      }

      if (!isObject(options.config)) { throw new TypeError(`'config' attribute is not an object. `); }

      if (typeof options.config.version !== 'string')
      {
         throw new TypeError(`'config.version' attribute is not a string`);
      }

      this.#version = SemVer.parseSemVer(options.config.version);

      if (!isObject(this.#version))
      {
         throw new Error(`'config.version' attribute is not a valid semantic version string.`);
      }

      if (!isIterable(options.config.components))
      {
         throw new TypeError(`'config.components' attribute is not an iterable list. `);
      }

      this.#styleManager = options.styleManager;

      this.#initialize(options);
   }

   /**
    * @returns {Object<string, import('svelte/store').Writable<string|null>>} All stores.
    */
   get stores()
   {
      return this.#stores;
   }

   /**
    * Parse `options.config` and initialize game setting for theme data.
    *
    * @param {TJSThemeStoreOptions}   options -
    */
   #initialize(options)
   {
      this.#components = [];
      this.#vars = [];

      this.#defaultThemeData = {};
      this.#initialThemeData = Object.assign({}, this.#defaultThemeData);

      let cntr = 0;

      // Process component / vars data.
      for (let entry of options.config.components)
      {
         // Validate entry, but also adds additional information based on data types; IE `format` for `color`.
         entry = DataValidator.componentEntry(entry, cntr);

         // Add var key if defined.
         if (typeof entry.var === 'string')
         {
            const key = entry.var;

            this.#vars.push(key);
            this.#stores[key] = propertyStore(this, key);
            this.#components.push(Object.assign({}, entry, { store: this.#stores[key] }));
            this.#defaultThemeData[key] = entry.default;
         }
         else
         {
            this.#components.push(Object.assign({}, entry));
         }

         cntr++;
      }

      // Create a store for TJSThemeEditor of all component data / definitions.
      this.#stores.components = writable(this.#components);

      // Set initial data to default here just in case the game setting entry is invalid upon registration / IE null.
      this.#initialThemeData = Object.assign({}, this.#defaultThemeData);

      this.#settingsStoreHandler = options.gameSettings.register({
         namespace: options.namespace,
         key: options.key,
         store: this,
         options: {
            scope: 'world',
            config: false,
            default: Object.assign({}, this.#defaultThemeData),
            type: Object
         }
      });

      // Retrieve existing data from stored word setting.
      this.#initialThemeData = game.settings.get(options.namespace, options.key);

      // Validate initial theme data and set to default if it fails to validate.
      if (!this.#validateThemeData(this.#initialThemeData, false))
      {
         console.warn(
          `TJSThemeStore warning: Initial theme data invalid. Setting to default data.`);

         this.#initialThemeData = Object.assign({}, this.#defaultThemeData);

         this.set(Object.assign({}, this.#initialThemeData));
      }
   }

   /**
    * Sets the theme store with new data.
    *
    * @param {object}   themeData -
    *
    * @returns {TJSThemeStore} This theme store instance.
    */
   set(themeData)
   {
      if (!this.#validateThemeData(themeData))
      {
         themeData = Object.assign({}, this.#initialThemeData);
      }

      for (const key of this.#vars)
      {
         if (key in themeData)
         {
            const keyData = themeData[key];

            this.#data[key] = keyData;
            this.#styleManager.setProperty(key, keyData);
         }
      }

      this.#updateSubscribers();

      return this;
   }

   /**
    * Validates the given theme data object ensuring that all parameters are found and are correct HSVA values.
    *
    * @param {object}   themeData -
    *
    * @param {boolean}  warn - When true post warning message.
    *
    * @returns {boolean} Validation status.
    */
   #validateThemeData(themeData, warn = true)
   {
      if (typeof themeData !== 'object' || themeData === null)
      {
         if (warn)
         {
            console.warn(`TJSThemeStore warning: 'theme' data is not an object resetting to initial data.`);
         }

         return false;
      }

      for (const key of this.#vars)
      {
         const data = themeData[key];

         if (getFormat(data) !== 'hsl')
         {
            if (warn)
            {
               console.warn(`TJSThemeStore warning: data for property '${
                key}' is not a HSL color string. Resetting to initial data.`);
            }

            return false;
         }
      }

      return true;
   }

   // ------------

   /**
    * Updates all subscribers
    */
   #updateSubscribers()
   {
      const data = Object.assign({}, this.#data);

      // Early out if there are no subscribers.
      if (this.#subscriptions.length > 0)
      {
         for (let cntr = 0; cntr < this.#subscriptions.length; cntr++) { this.#subscriptions[cntr](data); }
      }
   }

   /**
    * @param {function(data): void} handler - Callback function that is invoked on update / changes.
    * Receives copy of the theme data.
    *
    * @returns {(function(data): void)} Unsubscribe function.
    */
   subscribe(handler)
   {
      this.#subscriptions.push(handler); // add handler to the array of subscribers

      handler(Object.assign({}, this.#data));                     // call handler with current value

      // Return unsubscribe function.
      return () =>
      {
         const index = this.#subscriptions.findIndex((sub) => sub === handler);
         if (index >= 0) { this.#subscriptions.splice(index, 1); }
      };
   }
}

/**
 * @typedef {object} TJSThemeStoreConfig
 *
 * @property {string} version - A semantic version string.
 *
 * @property {Iterable<TJSThemeStoreComponent>} components - An iterable list of theme store component data.
 */

/**
 * @typedef {object} TJSThemeStoreComponent
 *
 * @property {string} type - Type of component / variable.
 *
 * @property {string} [default] - An optional default value for a CSS variable.
 *
 * @property {string} [label] - An optional label for any variable / setting related component.
 *
 * @property {string} [var] - A CSS variable name.
 */

/**
 * @typedef {object} TJSThemeStoreOptions
 *
 * @property {string} namespace - The world setting namespace.
 *
 * @property {string} key - The world setting key.
 *
 * @property {TJSGameSettings} gameSettings - An associated TJSGameSettings instance.
 *
 * @property {StyleManager} styleManager - An associated StyleManager instance to manipulate CSS variables.
 *
 * @property {TJSThemeStoreConfig} config - Data defining CSS theme store components and variables.
 */
