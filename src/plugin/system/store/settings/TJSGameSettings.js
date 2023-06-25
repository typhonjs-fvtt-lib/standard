import {
   isIterable,
   isObject }                    from '#runtime/util/object';

import { TJSGameSettings as GS } from '#standard/store';

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
    * @param {import('#standard/store').GameSetting} setting - A GameSetting instance to set to Foundry game settings.
    *
    * @param {boolean}     coreConfig - When false this overrides the `setting.options.config` parameter when
    *                                   registering the setting with Foundry. This allows the settings to be displayed
    *                                   in the app itself, but removed from the standard Foundry configuration location.
    *
    * @returns {Function} The specific store subscription handler assigned to the passed in store.
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
    * @param {Iterable<import('#standard/store').GameSetting>} settings - An iterable list of game setting
    *        configurations to register.
    *
    * @param {boolean}  coreConfig - When false this overrides the `setting.options.config` parameter when
    *        registering the setting with Foundry. This allows the settings to be displayed in the app itself, but
    *        removed from the standard Foundry configuration location.
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
