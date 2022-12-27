import { isIterable }            from '@typhonjs-fvtt/svelte/util';

import { TJSGameSettings as GS } from '@typhonjs-fvtt/svelte-standard/store';

/**
 * Provides a TyphonJS plugin to add TJSGameSettings to the plugin eventbus.
 *
 * The following events are available for registration:
 *
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
   #gameSettings = new GS();

   /**
    * @param {GameSetting} setting - A GameSetting instance to set to Foundry game settings.
    */
   register(setting)
   {
      if (typeof setting !== 'object') { throw new TypeError(`TJSGameSettings - register: setting is not an object.`); }

      // TODO: Remove deprecation warning and fully remove support for `moduleId` in a future TRL release.
      if (typeof setting.moduleId === 'string')
      {
         console.warn(
          `TJSGameSettings - register deprecation warning: 'moduleId' should be replaced with 'namespace'.`);
         console.warn(`'moduleId' will cease to work in a future update of TRL / TJSGameSettings.`);
      }

      if (typeof setting.key !== 'string')
      {
         throw new TypeError(`TJSGameSettings - register: 'key' attribute is not a string.`);
      }

      if (typeof setting.options !== 'object')
      {
         throw new TypeError(`TJSGameSettings - register: 'options' attribute is not an object.`);
      }

      // TODO: Remove nullish coalescing operator in a future TRL release.
      const namespace = setting.namespace ?? setting.moduleId;
      const key = setting.key;

      if (typeof namespace !== 'string')
      {
         throw new TypeError(`TJSGameSettings - register: 'namespace' attribute is not a string.`);
      }

      /**
       * @type {GameSettingOptions}
       */
      const options = setting.options;

      const onChange = typeof options?.onChange === 'function' ? [options.onChange] : [];

      onChange.push((value) =>
      {
         if (this._eventbus)
         {
            this._eventbus.trigger(`tjs:system:game:settings:change:any`, { setting: key, value });
            this._eventbus.trigger(`tjs:system:game:settings:change:${key}`, value);
         }
      });

      this.#gameSettings.register({ namespace, key, options: { ...options, onChange } });
   }

   /**
    * Registers multiple settings.
    *
    * @param {Iterable<GameSetting>} settings - An iterable list of game setting configurations to register.
    */
   registerAll(settings)
   {
      if (!isIterable(settings)) { throw new TypeError(`TJSGameSettings - registerAll: settings is not iterable.`); }

      for (const entry of settings) { this.register(entry); }
   }

   onPluginLoad(ev)
   {
      this._eventbus = ev.eventbus;

      const opts = { guard: true };

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
 * @property {string} [hint] - A description of the registered setting and its behavior.
 *
 * @property {string} name - The displayed name of the setting.
 *
 * @property {Function} [onChange] - An onChange callback to directly receive callbacks from Foundry on setting change.
 *
 * @property {object} [range] - If range is specified, the resulting setting will be a range slider.
 *
 * @property {('client' | 'world')} [scope='client'] - Scope for setting.
 *
 * @property {Object|Function} type - A constructable object or function.
 */

/**
 * @typedef {object} GameSetting - Defines a game setting.
 *
 * @property {string} namespace - The setting namespoce; usually the ID of the module / system.
 *
 * @property {string} key - The setting key to register.
 *
 * @property {GameSettingOptions} options - Configuration for setting data.
 */
