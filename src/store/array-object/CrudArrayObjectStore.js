import {
   isObject,
   uuidv4 }                   from '@typhonjs-svelte/lib/util';

import { ArrayObjectStore }   from './ArrayObjectStore.js';

/**
 * @template {BaseEntryStore} T
 */
export class CrudArrayObjectStore extends ArrayObjectStore
{
   /** @type {CrudDispatch} */
   #crudDispatch;

   /** @type {object} */
   #extraData;

   /**
    * @param {object}                  [opts] - Optional parameters.
    *
    * @param {CrudDispatch}            [opts.crudDispatch] -
    *
    * @param {object}                  [opts.extraData] -
    *
    * @param {ArrayObjectStoreParams}  [opts.rest] - Rest of ArrayObjectStore parameters.
    */
   constructor({ crudDispatch, extraData, ...rest })
   {
      // 'manualUpdate' is set to true if 'crudUpdate' is defined, but can be overridden by `...rest`.
      super({
         manualUpdate: typeof crudDispatch === 'function',
         ...rest,
      });

      if (crudDispatch !== void 0 && typeof crudDispatch !== 'function')
      {
         throw new TypeError(`'crudDispatch' is not a function.`);
      }

      if (extraData !== void 0 && !isObject(extraData))
      {
         throw new TypeError(`'extraData' is not an object.`);
      }

      this.#crudDispatch = crudDispatch;
      this.#extraData = extraData ?? {};
   }

   /**
    * Removes all child store entries.
    */
   clearEntries()
   {
      super.clearEntries();

      if (this.#crudDispatch)
      {
         this.#crudDispatch({ action: 'clear', ...this.#extraData });
      }
   }

   /**
    * Creates a new store from given data.
    *
    * @param {object}   entryData -
    *
    * @returns {T}
    */
   createEntry(entryData = {})
   {
      const store = super.createEntry(entryData);

      if (store && this.#crudDispatch)
      {
         this.#crudDispatch({
            action: 'create',
            ...this.#extraData,
            id: store.id,
            data: store.toJSON()
         });
      }
   }

   /**
    * Deletes a given entry store by ID from this world setting array store instance.
    *
    * @param {string}  id - ID of entry to delete.
    *
    * @returns {boolean} Delete operation successful.
    */
   deleteEntry(id)
   {
      const result = super.deleteEntry(id);

      if (result && this.#crudDispatch)
      {
         this.#crudDispatch({ action: 'delete', ...this.#extraData, id });
      }

      return result;
   }

   /**
    * Updates subscribers, but provides special handling when WorldSettingArrayStore has an `crudDispatch` function
    * attached. When the update is an object with a valid UUIDv4 string as the id property the `crudDispatch`
    * function is invoked with  along with the data payload
    *
    * @param {ArrayObjectUpdateData} [update] -
    */
   updateSubscribers(update)
   {
      if (this.#crudDispatch && isObject(update) && uuidv4.isValid(update.id))
      {
         const result = this.#crudDispatch({
            action: 'update',
            ...this.#extraData,
            id: update.id,
            data: update  // TODO: Consider using klona to clone data.
         });

         // If the crudDispatch function returns a boolean then invoke 'ArrayObjectStore.updateSubscribers' with it.
         super.updateSubscribers(typeof result === 'boolean' ? result : update);
      }
      else
      {
         super.updateSubscribers(update);
      }
   }
}

/**
 * @typedef {ArrayObjectStoreParams} CrudArrayObjectStoreParams
 *
 * @property {CrudDispatch}   [crudDispatch] -
 *
 * @property {object}         [extraData] -
 */

/**
 * @typedef {({ action: string, id?: string, data?: object }) => boolean} CrudDispatch
 *
 * A function that accepts an object w/ 'action', 'moduleId', 'key' properties and optional 'id' / UUIDv4 string and
 * 'data' property.
 */
