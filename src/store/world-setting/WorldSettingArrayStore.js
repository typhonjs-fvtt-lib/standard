import {
   DynArrayReducer,
   isWritableStore,
   TJSGameSettings } from '@typhonjs-fvtt/svelte/store';

import {
   debounce,
   isObject,
   klona,
   uuidv4 }          from '@typhonjs-fvtt/svelte/util';

/**
 * @typedef {typeof import('svelte/store').Writable & { get id: string }} BaseEntryStore
 */

/**
 * @template {BaseEntryStore} T
 */
export class WorldSettingArrayStore {
   /** @type {T[]} */
   #data = [];

   /**
    * @type {Map<string, T>}
    */
   #dataMap = new Map();

   /**
    * @type {DynArrayReducer<T>}
    */
   #dataReducer = new DynArrayReducer({ data: this.#data });

   /** @type {string} */
   #key;

   #StoreClass;

   /**
    * Stores the subscribers.
    *
    * @type {(function(T[]): void)[]}
    */
   #subscriptions = [];

   /**
    * @type {Function}
    */
   #updateSubscribersBound;

   /**
    * @returns {WorldSettingEntryStore}
    * @constructor
    */
   static get EntryStore() { return WorldSettingEntryStore; }

   /**
    *
    * @param {TJSGameSettings}   gameSettings - An instance of TJSGameSettings.
    *
    * @param {string}            moduleId - Game setting 'moduleId' field.
    *
    * @param {string}            key - Game setting 'key' field.
    *
    * @param {BaseEntryStore}    StoreClass - The entry store class that is instantiated.
    *
    * @param {object[]}          defaultData - An array of default data objects.
    */
   constructor({ gameSettings, moduleId, key, StoreClass, defaultData = [] } = {})
   {
      if (gameSettings !== void 0)
      {
         if (!(gameSettings instanceof TJSGameSettings))
         {
            throw new TypeError(`'gameSettings' is not an instance of TJSGameSettings.`);
         }

         if (typeof key !== 'string') { throw new TypeError(`'key' is not a string.`); }
         if (typeof moduleId !== 'string') { throw new TypeError(`'moduleId' is not a string.`); }
      }

      if (!isWritableStore(StoreClass.prototype))
      {
         throw new TypeError(`'StoreClass' is not a writable store constructor.`);
      }

      let hasIDGetter = false

      // Walk parent prototype chain. Check for descriptor at each prototype level.
      for (let o = StoreClass.prototype; o; o = Object.getPrototypeOf(o))
      {
         const descriptor = Object.getOwnPropertyDescriptor(o, 'id');
         if (descriptor !== void 0 && descriptor.get !== void 0)
         {
            hasIDGetter = true;
            break;
         }
      }

      if (!hasIDGetter)
      {
         throw new TypeError(`'StoreClass' does not have a getter accessor for 'id' property.`);
      }

      if (!Array.isArray(defaultData)) { throw new TypeError(`'defaultData' is not an array.`); }

      this.#key = key;
      this.#StoreClass = StoreClass;

      this.#updateSubscribersBound = debounce(this._updateSubscribers.bind(this), 500);

      for (let cntr = 0; cntr < defaultData.length; cntr++)
      {
         const entryData = defaultData[cntr];

         if (!isObject(entryData)) { throw new TypeError(`'defaultData[${cntr}] is not an object.`); }

         if (typeof entryData.id !== 'string') { throw new TypeError(`'defaultData[${cntr}].id' is not a string.`); }

         this.#addStore(entryData);
      }

      if (gameSettings)
      {
         gameSettings.register({
            moduleId,
            key,
            store: this,
            options: {
               scope: 'world',
               config: false,
               default: defaultData,
               type: Array
            }
         });
      }
   }

   /**
    * @returns {T[]}
    * @protected
    */
   get _data() { return this.#data; }

   /**
    * @returns {DynArrayReducer<T>}
    */
   get dataReducer() { return this.#dataReducer; }

   /**
    * @returns {string}
    */
   get key() { return this.#key; }

   /**
    * Adds a new store from given data.
    *
    * @param {object}   entryData -
    *
    * @returns {*}
    */
   add(entryData = {})
   {
      if (!isObject(entryData)) { throw new TypeError(`'entryData' is not an object.`); }

      if (typeof entryData.id !== 'string') { entryData.id = uuidv4(); }

      if (this.#data.findIndex((entry) => entry.id === entryData.id) >= 0)
      {
         throw new Error(`'entryData.id' (${entryData.id}) already in this WorldSettingArrayStore instance.`)
      }

      const store = this.#addStore(entryData);

      this._updateSubscribers();

      return store;
   }

   /**
    * Add a new store entry from the given data.
    *
    * @param {object}   entryData
    *
    * @returns {T} New store entry instance.
    */
   #addStore(entryData)
   {
      const store = new this.#StoreClass(entryData, this);

      if (!uuidv4.isValid(store.id))
      {
         throw new Error(`'store.id' (${store.id}) is not a UUIDv4 compliant string.`);
      }

      this.#data.push(store);
      this.#dataMap.set(entryData.id, store);

      return store;
   }

   /**
    * Deletes a given entry store by ID from this world setting array store instance.
    *
    * @param {string}  id - ID of entry to delete.
    *
    * @returns {boolean} Delete operation successful.
    */
   delete(id) {
      if (typeof id !== 'string') { throw new TypeError(`'id' is not a string.`); }

      const index = this.#data.findIndex((entry) => entry.id === id);

      if (index >= 0)
      {
         const store = this.#data[index];

         store?.destroy?.(); // TODO: Figure out if there is a way to create clean entry stores.

         this.#data.splice(index, 1);
         this.#dataMap.delete(store.id);

         this._updateSubscribers();

         return true;
      }

      return false;
   }

   /**
    * Duplicates an entry store by the given ID.
    *
    * @param {string}   id - UUIDv4 string.
    *
    * @returns {*} Instance of StoreClass.
    */
   duplicate(id)
   {
      if (typeof id !== 'string') { throw new TypeError(`'id' is not a string.`); }

      const index = this.#data.findIndex((entry) => entry.id === id);

      if (index >= 0)
      {
         const entryStore = this.#data[index];

         const data = klona(entryStore.toJSON());
         data.id = uuidv4();

         if (typeof data?.name === 'string')
         {
            let cntr = 1;
            const baseName = data.name ?? '';

            do
            {
               data.name = `${baseName}-${cntr++}`;
            } while (this.#data.findIndex((entry) => entry.name === data.name) >= 0);
         }

         return this.add(data);
      }

      return void 0;
   }

   /**
    * Finds an entry store instance by 'id' / UUIDv4.
    *
    * @param {string}   id - A UUIDv4 string.
    *
    * @returns {T|void} Entry store instance.
    */
   find(id)
   {
      return this.#dataMap.get(id);
   }

   /**
    * Sets the children store data by 'id', adds new entry store instances, or removes entries that are no longer in the
    * update list.
    *
    * @param {T[]}   updateList
    */
   set(updateList)
   {
      if (!Array.isArray(updateList)) { throw new TypeError(`'updateList' is not an Array.`); }

      const data = this.#data;
      const dataMap = this.#dataMap;

      // Create a set of all current entry IDs.
      const removeIDSet = new Set(dataMap.keys());

      let rebuildIndex = false;

      for (let updateIndex = 0; updateIndex < updateList.length; updateIndex++)
      {
         const updateData = updateList[updateIndex];

         const id = updateData.id;

         if (typeof id !== 'string') { throw new Error(`'updateData.id' is not a string.`)}

         const localIndex = data.findIndex((entry) => entry.id === id);

         if (localIndex >= 0)
         {
            const localEntry = data[localIndex];

            // Update the entry data.
            localEntry.set(updateData);

            // Must move to correct position
            if (localIndex !== updateIndex)
            {
               // Remove from current location.
               data.splice(localIndex, 1);

               if (updateIndex < data.length)
               {
                  // Insert at new location.
                  data.splice(updateIndex, 0, localEntry);
               }
               else
               {
                  // Local data length is less than update data index; rebuild index.
                  rebuildIndex = true;
               }
            }

            // Delete from removeIDSet as entry is still in local data.
            removeIDSet.delete(id);
         }
         else
         {
            this.#addStore(updateData);
         }
      }

      if (rebuildIndex)
      {
         data.length = 0;
         dataMap.clear();

         for (const updateData of updateList) { this.#addStore(updateData); }
      }
      else
      {
         // Remove entries that are no longer in data.
         for (const id of removeIDSet)
         {
            const index = data.findIndex((entry) => entry.id === id);
            if (index >= 0)
            {
               data[index].destroy();
               data.splice(index, 1);
               dataMap.delete(id);
            }
         }
      }

      this._updateSubscribers();
   }

   toJSON()
   {
      return this.#data;
   }

// -------------------------------------------------------------------------------------------------------------------

   /**
    * @param {function(T[]): void} handler - Callback function that is invoked on update / changes.
    *
    * @returns {(function(): void)} Unsubscribe function.
    */
   subscribe(handler)
   {
      this.#subscriptions.push(handler); // add handler to the array of subscribers

      handler(this.#data);                     // call handler with current value

      // Return unsubscribe function.
      return () =>
      {
         const index = this.#subscriptions.findIndex((sub) => sub === handler);
         if (index >= 0) { this.#subscriptions.splice(index, 1); }
      };
   }

   /**
    * @package
    */
   _updateSubscribers()
   {
      const subscriptions = this.#subscriptions;

      const data = this.#data;

      for (let cntr = 0; cntr < subscriptions.length; cntr++) { subscriptions[cntr](data); }

      // This will update the filtered data and `dataReducer` store and forces an update to subscribers.
      this.#dataReducer.index.update(true);
   }
}

class WorldSettingEntryStore
{
   /**
    * @type {object}
    */
   #data;

   /**
    * Stores the subscribers.
    *
    * @type {(function(object): void)[]}
    */
   #subscriptions = [];

   /**
    * @param {object}   data -
    */
   constructor(data = {})
   {
      if (!isObject(data)) { throw new TypeError(`'data' is not an object.`); }

      this.#data = data;

      // If an id is missing then add it.
      if (typeof data.id !== 'string') { this.#data.id = uuidv4(); }

      if (!uuidv4.isValid(data.id)) { throw new Error(`'data.id' (${data.id}) is not a valid UUIDv4 string.`)}
   }

   /**
    * @returns {object}
    * @protected
    */
   get _data() { return this.#data; }

   // ----------------------------------------------------------------------------------------------------------------

   /**
    * @returns {string}
    */
   get id() { return this.#data.id; }

   toJSON()
   {
      return this.#data;
   }

   /**
    * @param {function(object): void} handler - Callback function that is invoked on update / changes.
    *
    * @returns {(function(): void)} Unsubscribe function.
    */
   subscribe(handler)
   {
      this.#subscriptions.push(handler);  // add handler to the array of subscribers

      handler(this.#data);                // call handler with current value

      // Return unsubscribe function.
      return () =>
      {
         const index = this.#subscriptions.findIndex((sub) => sub === handler);
         if (index >= 0) { this.#subscriptions.splice(index, 1); }
      };
   }

   /**
    * @protected
    */
   _updateSubscribers()
   {
      const subscriptions = this.#subscriptions;

      const data = this.#data;

      for (let cntr = 0; cntr < subscriptions.length; cntr++) { subscriptions[cntr](data); }
   }
}
