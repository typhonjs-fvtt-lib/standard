import { TJSGameSettings }       from '@typhonjs-fvtt/svelte/store';

import { CrudArrayObjectStore }  from '../array-object';

/**
 * @template {BaseEntryStore} T
 */
export class WorldSettingArrayStore extends CrudArrayObjectStore
{
   /** @type {string} */
   #key;

   /** @type {string} */
   #moduleId;

   /**
    *
    * @param {object}            [opts] - Optional parameters.
    *
    * @param {TJSGameSettings}   [opts.gameSettings] - An instance of TJSGameSettings.
    *
    * @param {string}            [opts.moduleId] - Game setting 'moduleId' field.
    *
    * @param {string}            [opts.key] - Game setting 'key' field.
    *
    * @param {CrudArrayObjectStoreParams} [opts.rest] - Rest of CrudArrayObjectStore parameters.
    */
   constructor({ gameSettings, moduleId, key, ...rest })
   {
      super({
         ...rest,
         extraData: { moduleId, key }
      });

      if (gameSettings !== void 0 && !(gameSettings instanceof TJSGameSettings))
      {
         throw new TypeError(`'gameSettings' is not an instance of TJSGameSettings.`);
      }

      if (typeof key !== 'string') { throw new TypeError(`'key' is not a string.`); }
      if (typeof moduleId !== 'string') { throw new TypeError(`'moduleId' is not a string.`); }

      this.#moduleId = moduleId;
      this.#key = key;

      if (gameSettings)
      {
         gameSettings.register({
            moduleId,
            key,
            store: this,
            options: {
               scope: 'world',
               config: false,
               default: Array.isArray(rest.defaultData) ? rest.defaultData : [],
               type: Array
            }
         });
      }
   }

   /**
    * @returns {string}
    */
   get key() { return this.#key; }

   /**
    * @returns {string}
    */
   get moduleId() { return this.#moduleId; }
}
