import { writable }        from 'svelte/store';

import { isIterable }      from '@typhonjs-svelte/lib/util';

import {
   isWritableStore,
   subscribeIgnoreFirst }  from '@typhonjs-svelte/lib/store';

import { UIControl }       from './UIControl.js';

/**
 * Registers game settings and creates a backing Svelte store for each setting. It is possible to add multiple
 * `onChange` callbacks on registration.
 */
export class TJSGameSettings
{
   /**
    * @type {string}
    */
   #namespace;

   #settings = [];

   /**
    * @type {Map<string, GSWritableStore>}
    */
   #stores = new Map();

   /** @type {UIControl} */
   #uiControl;

   constructor(namespace)
   {
      this.#namespace = namespace;
      this.#uiControl = new UIControl(this);
   }

   /**
    * Creates a new GSWritableStore for the given key.
    *
    * @param {string}   initialValue - An initial value to set to new stores.
    *
    * @returns {GSWritableStore} The new GSWritableStore.
    */
   static #createStore(initialValue)
   {
      return writable(initialValue);
   }

   /**
    * Provides a generator to return stored settings data.
    *
    * @returns {Generator<*, void, *>}
    */
   *[Symbol.iterator]()
   {
      for (const setting of this.#settings)
      {
         yield setting;
      }
   }

   /**
    * @returns {string} Returns namespace set in constructor.
    */
   get namespace()
   {
      return this.#namespace;
   }

   /**
    * @returns {UIControl}
    */
   get uiControl()
   {
      return this.#uiControl;
   }

   /**
    * Gets a store from the GSWritableStore Map or creates a new store for the key.
    *
    * @param {string}   key - Key to lookup in stores map.
    *
    * @param {string}   [initialValue] - An initial value to set to new stores.
    *
    * @returns {GSWritableStore} The store for the given key.
    */
   #getStore(key, initialValue)
   {
      let store = this.#stores.get(key);
      if (store === void 0)
      {
         store = TJSGameSettings.#createStore(initialValue);
         this.#stores.set(key, store);
      }

      return store;
   }

   /**
    * Returns a readable Game Settings store for the associated key.
    *
    * @param {string}   key - Game setting key.
    *
    * @returns {GSReadableStore|undefined} The associated store for the given game setting key.
    */
   getReadableStore(key)
   {
      if (!this.#stores.has(key))
      {
         console.warn(`TJSGameSettings - getReadableStore: '${key}' is not a registered setting.`);
         return;
      }

      const store = this.#getStore(key);

      return { subscribe: store.subscribe, get: store.get };
   }

   /**
    * Returns a writable Game Settings store for the associated key.
    *
    * @param {string}   key - Game setting key.
    *
    * @returns {GSWritableStore|undefined} The associated store for the given game setting key.
    */
   getStore(key)
   {
      return this.getWritableStore(key);
   }

   /**
    * Returns a writable Game Settings store for the associated key.
    *
    * @param {string}   key - Game setting key.
    *
    * @returns {GSWritableStore|undefined} The associated store for the given game setting key.
    */
   getWritableStore(key)
   {
      if (!this.#stores.has(key))
      {
         console.warn(`TJSGameSettings - getWritableStore: '${key}' is not a registered setting.`);
         return;
      }

      return this.#getStore(key);
   }

   /**
    * @param {GameSetting} setting - A GameSetting instance to set to Foundry game settings.
    *
    * @param {boolean}     coreConfig - When false this overrides the `setting.options.config` parameter when
    *                                   registering the setting with Foundry. This allows the settings to be displayed
    *                                   in the app itself, but removed from the standard Foundry configuration location.
    */
   register(setting, coreConfig = true)
   {
      if (typeof setting !== 'object')
      {
         throw new TypeError(`TJSGameSettings - register: setting is not an object.`);
      }

      if (typeof setting.options !== 'object')
      {
         throw new TypeError(`TJSGameSettings - register: 'setting.options' attribute is not an object.`);
      }

      if (typeof coreConfig !== 'boolean')
      {
         throw new TypeError(`TJSGameSettings - register: 'coreConfig' is not an boolean.`);
      }

      if (setting.store !== void 0 && !isWritableStore(setting.store))
      {
         throw new TypeError(
          `TJSGameSettings - register: 'setting.store' attribute is not a writable store.`);
      }

      // TODO: Remove deprecation warning and fully remove support for `moduleId` in a future TRL release.
      if (typeof setting.moduleId === 'string')
      {
         console.warn(
          `TJSGameSettings - register deprecation warning: 'moduleId' should be replaced with 'namespace'.`);
         console.warn(`'moduleId' will cease to work in a future update of TRL / TJSGameSettings.`);
      }

      // TODO: Remove nullish coalescing operator in a future TRL release.
      const namespace = setting.namespace ?? setting.moduleId;
      const key = setting.key;
      const folder = setting.folder;

      // The `config` parameter passed to Foundry core.
      const foundryConfig = coreConfig ? setting.options.config : false;

      if (typeof namespace !== 'string')
      {
         throw new TypeError(`TJSGameSettings - register: 'namespace' attribute is not a string.`);
      }

      if (typeof key !== 'string')
      {
         throw new TypeError(`TJSGameSettings - register: 'key' attribute is not a string.`);
      }

      if (folder !== void 0 && typeof folder !== 'string')
      {
         throw new TypeError(`TJSGameSettings - register: 'folder' attribute is not a string.`);
      }

      const store = setting.store;

      /**
       * @type {GameSettingOptions}
       */
      const options = setting.options;

      const onchangeFunctions = [];

      // When true prevents local store subscription from a loop when values are object data.
      let gateSet = false;

      // Provides an `onChange` callback to update the associated store.
      onchangeFunctions.push((value) =>
      {
         const callbackStore = this.#getStore(key);
         if (callbackStore && !gateSet)
         {
            gateSet = true;
            callbackStore.set(value);
            gateSet = false;
         }
      });

      // Handle loading any existing `onChange` callbacks.
      if (isIterable(options?.onChange))
      {
         for (const entry of options.onChange)
         {
            if (typeof entry === 'function') { onchangeFunctions.push(entry); }
         }
      }
      else if (typeof options.onChange === 'function')
      {
         onchangeFunctions.push(options.onChange);
      }

      // Provides the final onChange callback that iterates over all the stored onChange callbacks.
      const onChange = (value) =>
      {
         for (const entry of onchangeFunctions) { entry(value); }
      };

      game.settings.register(namespace, key, { ...options, config: foundryConfig, onChange });

      // Set new store value with existing setting or default value.
      const targetStore = store ? store : this.#getStore(key, game.settings.get(namespace, key));

      // If a store instance is passed into register then initialize it with game settings data.
      if (store)
      {
         this.#stores.set(key, targetStore);
         store.set(game.settings.get(namespace, key));
      }

      // Subscribe to self to set associated game setting on updates after verifying that the new value does not match
      // existing game setting.
      subscribeIgnoreFirst(targetStore, async (value) =>
      {
         if (!gateSet && game.settings.get(namespace, key) !== value)
         {
            gateSet = true;
            await game.settings.set(namespace, key, value);
         }

         gateSet = false;
      });

      this.#settings.push({
         namespace,
         key,
         folder,
         ...options
      });
   }

   /**
    * Registers multiple settings.
    *
    * @param {Iterable<GameSetting>} settings - An iterable list of game setting configurations to register.
    *
    * @param {boolean}     coreConfig - When false this overrides the `setting.options.config` parameter when
    *                                   registering the setting with Foundry. This allows the settings to be displayed
    *                                   in the app itself, but removed from the standard Foundry configuration location.
    */
   registerAll(settings, coreConfig)
   {
      if (!isIterable(settings)) { throw new TypeError(`TJSGameSettings - registerAll: settings is not iterable.`); }

      for (const entry of settings)
      {
         if (typeof entry !== 'object')
         {
            throw new TypeError(`TJSGameSettings - registerAll: entry in settings is not an object.`);
         }

         // TODO: Uncomment when deprecation for 'moduleId' is removed in future TRL release.
         // if (typeof entry.namespace !== 'string')
         // {
         //    throw new TypeError(`TJSGameSettings - registerAll: entry in settings missing 'namespace' attribute.`);
         // }

         if (typeof entry.key !== 'string')
         {
            throw new TypeError(`TJSGameSettings - registerAll: entry in settings missing 'key' attribute.`);
         }

         if (typeof entry.options !== 'object')
         {
            throw new TypeError(`TJSGameSettings - registerAll: entry in settings missing 'options' attribute.`);
         }

         this.register(entry, coreConfig);
      }
   }
}

/**
 * @typedef {object} GameSettingOptions
 *
 * @property {object} [choices] - If choices are defined, the resulting setting will be a select menu.
 *
 * @property {boolean} [config=true] - Specifies that the setting appears in the configuration view.
 *
 * @property {*} [default] - A default value for the setting.
 *
 * @property {string} [hint] - A description of the registered setting and its behavior.
 *
 * @property {string} name - The displayed name of the setting.
 *
 * @property {Function} [onChange] - An onChange callback to directly receive callbacks from Foundry on setting change.
 *
 * @property {{min: number, max: number, step: number}} [range] - If range is specified, the resulting setting will be a range slider.
 *
 * @property {boolean} [requiresReload=false] - If true then a prompt to reload after changes occurs.
 *
 * @property {('client' | 'world')} [scope='client'] - Scope for setting.
 *
 * @property {Object|Function} type - A constructable object or function.
 */

/**
 * @typedef {object} GameSetting - Defines a game setting.
 *
 * @property {string} namespace - The setting namespace; usually the ID of the module / system.
 *
 * @property {string} key - The setting key to register.
 *
 * @property {string} folder - The name of the TJSSvgFolder to put this setting in to group them.
 *
 * @property {import('svelte/store').Writable} [store] - An existing store instance to use.
 *
 * @property {GameSettingOptions} options - Configuration for setting data.
 */

/**
 * @typedef {import('svelte/store').Writable} GSWritableStore - The backing Svelte store; writable w/ get method attached.
 */

/**
 * @typedef {import('svelte/store').Readable} GSReadableStore - The backing Svelte store; readable w/ get method attached.
 */
