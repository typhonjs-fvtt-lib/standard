import { CrudArrayObjectStore }  from '../array-object/index.js';

/**
 * @template [T=import('../array-object').BaseEntryStore]
 * @extends {CrudArrayObjectStore<T>}
 */
export class WorldSettingArrayStore extends CrudArrayObjectStore
{
   /** @type {string} */
   #key;

   /** @type {string} */
   #namespace;

   /**
    *
    * @param {object}            [opts] - Optional parameters.
    *
    * @param {import('../settings/TJSGameSettings').TJSGameSettings}   [opts.gameSettings] - An instance of
    *        TJSGameSettings.
    *
    * @param {string}            [opts.namespace] - Game setting 'namespace' field.
    *
    * @param {string}            [opts.key] - Game setting 'key' field.
    *
    * @param {import('../array-object').CrudArrayObjectStoreParams} [opts.rest] - Rest of CrudArrayObjectStore parameters.
    */
   constructor({ gameSettings, namespace, key, ...rest })
   {
      super({
         ...rest,
         extraData: { namespace, key }
      });

      if (typeof key !== 'string') { throw new TypeError(`'key' is not a string.`); }
      if (typeof namespace !== 'string') { throw new TypeError(`'namespace' is not a string.`); }

      this.#namespace = namespace;
      this.#key = key;

      if (gameSettings)
      {
         gameSettings.register({
            namespace,
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
   get namespace() { return this.#namespace; }
}
