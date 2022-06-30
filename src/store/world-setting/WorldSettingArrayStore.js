import { TJSGameSettings }    from '@typhonjs-fvtt/svelte/store';

import { ArrayObjectStore }   from './ArrayObjectStore.js';

/**
 * @typedef {typeof import('svelte/store').Writable & { get id: string }} BaseEntryStore
 */

/**
 * @template {BaseEntryStore} T
 */
export class WorldSettingArrayStore extends ArrayObjectStore
{
   /** @type {string} */
   #key;

   /**
    *
    * @param {object}            params - Required parameters.
    *
    * @param {TJSGameSettings}   params.gameSettings - An instance of TJSGameSettings.
    *
    * @param {string}            params.moduleId - Game setting 'moduleId' field.
    *
    * @param {string}            params.key - Game setting 'key' field.
    *
    * @param {ArrayObjectStoreParams} params.rest - Rest of ArrayObjectStore parameters.
    *
    */
   constructor({ gameSettings, moduleId, key, ...rest })
   {
      super(rest);

      if (gameSettings !== void 0)
      {
         if (!(gameSettings instanceof TJSGameSettings))
         {
            throw new TypeError(`'gameSettings' is not an instance of TJSGameSettings.`);
         }

         if (typeof key !== 'string') { throw new TypeError(`'key' is not a string.`); }
         if (typeof moduleId !== 'string') { throw new TypeError(`'moduleId' is not a string.`); }
      }

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
               default: Array.isArray(rest.defaultData) ?? [],
               type: Array
            }
         });
      }
   }

   /**
    * @returns {string}
    */
   get key() { return this.#key; }
}
