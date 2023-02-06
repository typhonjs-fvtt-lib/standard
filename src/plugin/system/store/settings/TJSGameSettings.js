import {
   isIterable,
   isObject }                    from '@typhonjs-fvtt/svelte/util';

import { TJSGameSettings as GS } from '@typhonjs-fvtt/svelte-standard/store';

/**
 * Provides a TyphonJS plugin to add TJSGameSettings to the plugin eventbus.
 *
 * The following events are available for registration:
 *
 * `tjs:system:game:settings:get`                - Returns the backing TJSGameSettings instance / is an iterator.
 * `tjs:system:game:settings:store:get`          - Invokes `getWritableStore` from backing TJSGameSettings instance.
 * `tjs:system:game:settings:store:writable:get` - Invokes `getWritableStore` from backing TJSGameSettings instance.
 * `tjs:system:game:settings:store:readable:get` - Invokes `getReadableStore` from backing TJSGameSettings instance.
 * `tjs:system:game:settings:register`           - Registers a setting adding a callback to fire an event on change.
 * `tjs:system:game:settings:register:all`       - Registers multiple settings.
 *
 * The following events are triggered on change of a game setting.
 *
 * `tjs:system:game:settings:change:any`           - Provides an object containing the setting and value.
 * `tjs:system:game:settings:change:<SETTING KEY>` - Provides the value of the keyed event.
 */
export class TJSGameSettings
{
   #gameSettings;

   /**
    * Creates the TJSGameSettings instance.
    *
    * @param {string}   namespace - The namespace for all settings.
    */
   constructor(namespace)
   {
      this.#gameSettings = new GS(namespace);
   }

   /**
    * Registers a setting with TJSGameSettings and Foundry core.
    *
    * Note: The specific store subscription handler assigned to the passed in store or store created for the setting
    * internally is returned from this function. In some cases when setting up custom stores particularly of object
    * types with several child property stores (`propertyStore`) it is necessary to only update the setting store and
    * not all subscribers to the custom store as the `propertyStore` instances are also subscribers to the custom store.
    *
    * This allows the custom store in the `set` implementation to mainly only trigger the TJSGameSettings subscriber
    * handler on updates and not all the connected `propertyStore` instances.
    *
    * @param {GameSetting} setting - A GameSetting instance to set to Foundry game settings.
    *
    * @param {boolean}     coreConfig - When false this overrides the `setting.options.config` parameter when
    *                                   registering the setting with Foundry. This allows the settings to be displayed
    *                                   in the app itself, but removed from the standard Foundry configuration location.
    */
   register(setting, coreConfig = true)
   {
      if (!isObject(setting))
      {
         throw new TypeError(`TJSGameSettings - register: setting is not an object.`);
      }

      if (!isObject(setting.options))
      {
         throw new TypeError(`TJSGameSettings - register: 'setting.options' attribute is not an object.`);
      }

      if (typeof setting.key !== 'string')
      {
         throw new TypeError(`TJSGameSettings - register: 'key' attribute is not a string.`);
      }

      const key = setting.key;

      const existingOnChange = setting.options?.onChange;

      // Convert an existing `onChange` functions into an array / list.
      const onChange = Array.isArray(existingOnChange) ? existingOnChange :
       typeof existingOnChange === 'function' ? [existingOnChange] : [];

      // Push an additional `onChange` callback to trigger eventbus events on change.
      onChange.push((value) =>
      {
         if (this._eventbus)
         {
            this._eventbus.trigger(`tjs:system:game:settings:change:any`, { setting: key, value });
            this._eventbus.trigger(`tjs:system:game:settings:change:${key}`, value);
         }
      });

      setting.options.onChange = onChange;

      return this.#gameSettings.register(setting, coreConfig);
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
   registerAll(settings, coreConfig = true)
   {
      if (!isIterable(settings)) { throw new TypeError(`TJSGameSettings - registerAll: settings is not iterable.`); }

      for (const entry of settings) { this.register(entry, coreConfig); }
   }

   onPluginLoad(ev)
   {
      this._eventbus = ev.eventbus;

      const opts = { guard: true };

      ev.eventbus.on(`tjs:system:game:settings:get`, () => this.#gameSettings, this.#gameSettings, opts);

      ev.eventbus.on(`tjs:system:game:settings:store:get`, this.#gameSettings.getWritableStore, this.#gameSettings,
       opts);

      ev.eventbus.on(`tjs:system:game:settings:store:readable:get`, this.#gameSettings.getReadableStore,
       this.#gameSettings, opts);

      ev.eventbus.on(`tjs:system:game:settings:store:writable:get`, this.#gameSettings.getWritableStore,
       this.#gameSettings, opts);

      ev.eventbus.on(`tjs:system:game:settings:register`, this.register, this, opts);

      ev.eventbus.on(`tjs:system:game:settings:register:all`, this.registerAll, this, opts);
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
 * @property {Function|Function[]} [onChange] - An onChange callback function or array of callbacks to directly receive
 *                                              callbacks from Foundry on setting change.
 *
 * @property {{min: number, max: number, step: number}} [range] - If range is specified, the resulting setting will be
 *                                                                a range slider.
 *
 * @property {boolean} [requiresReload=false] - If true then a prompt to reload after changes occurs.
 *
 * @property {('client' | 'world')} [scope='client'] - Scope for setting.
 *
 * @property {object|Function} type - A constructable object or function.
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
