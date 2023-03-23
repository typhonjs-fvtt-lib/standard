import { writable }        from 'svelte/store';

import { getFormat }       from '@typhonjs-fvtt/runtime/color/colord';

import { propertyStore }   from '@typhonjs-fvtt/svelte/store';

import {
   isIterable,
   isObject,
   StyleManager }          from '@typhonjs-fvtt/svelte/util';

import { DataValidator }   from './DataValidator.js';
import { TJSGameSettings } from '../TJSGameSettings.js';

/**
 * Must be constructed from a TJSGameSettings instance `init` / initialize method called from the `ready` Foundry VTT
 * hook.
 */
export class TJSThemeStore
{
   /** @type {object[]} */
   #components;

   #defaultThemeData;

   #initialThemeData;

   #settingsStoreHandler;

   #data = {};

   /**
    * Stores all CSS variable keys.
    *
    * @type {string[]}
    */
   #vars;

   /**
    * Stores the subscribers.
    *
    * @type {(function(data): void)[]}
    */
   #subscriptions = [];

   /**
    * @type {Object<string, import('svelte/store').Writable<string|null>>}
    */
   #stores = {};

   /**
    * @type {StyleManager}
    */
   #styleManager;

   /**
    * @param {object} options - Options
    *
    * @param {string} options.namespace - The world setting scope.
    *
    * @param {string} options.key - The world setting key.
    *
    * @param {TJSGameSettings} options.gameSettings - An associated TJSGameSettings instance.
    *
    * @param {StyleManager} options.styleManager - An associated StyleManager instance to manipulate CSS variables.
    *
    * @param {object[]} options.data - Data defining CSS theme variables.
    *
    */
   constructor(options)
   {
      if (!isObject(options)) { throw new TypeError(`'options' is not an object.`); }

      if (typeof options.namespace !== 'string') { throw new TypeError(`'namespace' is not a string.`); }

      if (typeof options.key !== 'string') { throw new TypeError(`'key' is not a string.`); }

      if (!(options.gameSettings instanceof TJSGameSettings))
      {
         throw new TypeError(`'gameSettings' is not an instance of TJSGameSettings.`);
      }

      if (!(options.styleManager instanceof StyleManager))
      {
         throw new TypeError(`'styleManager' is not an instance of StyleManager.`);
      }

      if (!isIterable(options.data)) { throw new TypeError(`'data' is not an iterable list. `); }

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
    * Parse `options.data` and initialize game setting for theme data.
    *
    * @param {object}   options -
    */
   #initialize(options)
   {
      this.#components = [];
      this.#vars = [];

      this.#defaultThemeData = {};
      this.#initialThemeData = Object.assign({}, this.#defaultThemeData);

      const data = options.data;

      let cntr = 0;

      // Process vars data.
      for (let entry of data)
      {
         // Validate entry, but also adds additional information based on data types; IE `format` for `color`.
         entry = DataValidator.dataEntry(entry, cntr);

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
