import {
   DynArrayReducer,
   isWritableStore,
   subscribeIgnoreFirst }     from '#runtime/svelte/store';

import {
   debounce,
   isObject,
   klona,
   uuidv4 }                   from '#runtime/svelte/util';

import { ObjectEntryStore }   from './ObjectEntryStore.js';

/**
 * @typedef {import('#svelte/store').Writable & { get id: string }} BaseEntryStore
 */

/**
 * @template [T=BaseEntryStore]
 */
export class ArrayObjectStore
{
   /** @type {T[]} */
   #data = [];

   /**
    * @type {Map<string, { store: T, unsubscribe: Function}>}
    */
   #dataMap = new Map();

   /**
    * @type {DynArrayReducer<T>}
    */
   #dataReducer;

   /**
    * @type {boolean}
    */
   #manualUpdate;

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
    * @returns {ObjectEntryStore}
    */
   static get EntryStore() { return ObjectEntryStore; }

   /**
    * @param {ArrayObjectStoreParams} params -
    */
   constructor({ StoreClass, defaultData = [], childDebounce = 250, dataReducer = false, manualUpdate = false } = {})
   {
      if (!Number.isInteger(childDebounce) || childDebounce < 0 || childDebounce > 1000)
      {
         throw new TypeError(`'childDebounce' must be an integer between and including 0 - 1000.`);
      }

      if (typeof manualUpdate !== 'boolean') { throw new TypeError(`'manualUpdate' is not a boolean.`); }

      if (!isWritableStore(StoreClass.prototype))
      {
         throw new TypeError(`'StoreClass' is not a writable store constructor.`);
      }

      let hasIDGetter = false;

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

      this.#manualUpdate = manualUpdate;

      this.#StoreClass = StoreClass;

      if (dataReducer) { this.#dataReducer = new DynArrayReducer({ data: this.#data }); }

      // Prepare a debounced callback that is used for all child store entry subscriptions.
      this.#updateSubscribersBound = childDebounce === 0 ? this.updateSubscribers.bind(this) :
       debounce((data) => this.updateSubscribers(data), childDebounce);
   }

   /**
    * Provide an iterator for public access to entry stores.
    *
    * @returns {Generator<T | void>}
    * @yields {T|void}
    */
   *[Symbol.iterator]()
   {
      if (this.#data.length === 0) { return; }

      for (const entryStore of this.#data) { yield entryStore; }
   }

   /**
    * @returns {T[]}
    * @protected
    */
   get _data() { return this.#data; }

   /**
    * @returns {DynArrayReducer<T>}
    */
   get dataReducer()
   {
      if (!this.#dataReducer)
      {
         throw new Error(
          `'dataReducer' is not initialized; did you forget to specify 'dataReducer' as true in constructor options?`);
      }

      return this.#dataReducer;
   }

   /**
    * @returns {number}
    */
   get length() { return this.#data.length; }

   /**
    * Removes all child store entries.
    */
   clearEntries()
   {
      for (const storeEntryData of this.#dataMap.values()) { storeEntryData.unsubscribe(); }

      this.#dataMap.clear();
      this.#data.length = 0;

      this.updateSubscribers();
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
      if (!isObject(entryData)) { throw new TypeError(`'entryData' is not an object.`); }

      if (typeof entryData.id !== 'string') { entryData.id = uuidv4(); }

      if (this.#data.findIndex((entry) => entry.id === entryData.id) >= 0)
      {
         throw new Error(`'entryData.id' (${entryData.id}) already in this ArrayObjectStore instance.`);
      }

      const store = this.#createStore(entryData);

      this.updateSubscribers();

      return store;
   }

   /**
    * Add a new store entry from the given data.
    *
    * @param {object}   entryData -
    *
    * @returns {T} New store entry instance.
    */
   #createStore(entryData)
   {
      const store = new this.#StoreClass(entryData, this);

      if (!uuidv4.isValid(store.id))
      {
         throw new Error(`'store.id' (${store.id}) is not a UUIDv4 compliant string.`);
      }

      const unsubscribe = subscribeIgnoreFirst(store, this.#updateSubscribersBound);

      this.#data.push(store);
      this.#dataMap.set(entryData.id, { store, unsubscribe });

      return store;
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
      const result = this.#deleteStore(id);

      if (result) { this.updateSubscribers(); }

      return result;
   }

   #deleteStore(id)
   {
      if (typeof id !== 'string') { throw new TypeError(`'id' is not a string.`); }

      const storeEntryData = this.#dataMap.get(id);
      if (storeEntryData)
      {
         storeEntryData.unsubscribe();

         this.#dataMap.delete(id);

         const index = this.#data.findIndex((entry) => entry.id === id);
         if (index >= 0) { this.#data.splice(index, 1); }

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
   duplicateEntry(id)
   {
      if (typeof id !== 'string') { throw new TypeError(`'id' is not a string.`); }

      const storeEntryData = this.#dataMap.get(id);

      if (storeEntryData)
      {
         const data = klona(storeEntryData.store.toJSON());
         data.id = uuidv4();

         // Allow StoreClass to statically perform any specialized duplication.
         this.#StoreClass?.duplicate?.(data, this);

         return this.createEntry(data);
      }

      return void 0;
   }

   /**
    * Find an entry in the backing child store array.
    *
    * @param {function(T): T|void}  predicate - A predicate function
    *
    * @returns {T|void} Found entry in array or undefined.
    */
   findEntry(predicate)
   {
      return this.#data.find(predicate);
   }

   /**
    * Finds an entry store instance by 'id' / UUIDv4.
    *
    * @param {string}   id - A UUIDv4 string.
    *
    * @returns {T|void} Entry store instance.
    */
   getEntry(id)
   {
      const storeEntryData = this.#dataMap.get(id);
      return storeEntryData ? storeEntryData.store : void 0;
   }

   /**
    * Sets the children store data by 'id', adds new entry store instances, or removes entries that are no longer in the
    * update list.
    *
    * @param {T[]}   updateList -
    */
   set(updateList)
   {
      if (!Array.isArray(updateList))
      {
         console.warn(`ArrayObjectStore.set warning: aborting set operation as 'updateList' is not an array.`);
         return;
      }

      const data = this.#data;
      const dataMap = this.#dataMap;

      // Create a set of all current entry IDs.
      const removeIDSet = new Set(dataMap.keys());

      let rebuildIndex = false;

      for (let updateIndex = 0; updateIndex < updateList.length; updateIndex++)
      {
         const updateData = updateList[updateIndex];

         const id = updateData.id;

         if (typeof id !== 'string') { throw new Error(`'updateData.id' is not a string.`); }

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
            this.#createStore(updateData);
         }
      }

      if (rebuildIndex)
      {
         // Must invoke unsubscribe for all child stores.
         for (const storeEntryData of dataMap.values()) { storeEntryData.unsubscribe(); }

         data.length = 0;
         dataMap.clear();

         for (const updateData of updateList) { this.#createStore(updateData); }
      }
      else
      {
         // Remove entries that are no longer in data.
         for (const id of removeIDSet) { this.#deleteStore(id); }
      }

      this.updateSubscribers();
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
    * Updates subscribers.
    *
    * @param {ArrayObjectUpdateData}  [update] -
    */
   updateSubscribers(update)
   {
      const updateGate = typeof update === 'boolean' ? update : !this.#manualUpdate;

      if (updateGate)
      {
         const subscriptions = this.#subscriptions;

         const data = this.#data;

         for (let cntr = 0; cntr < subscriptions.length; cntr++) { subscriptions[cntr](data); }
      }

      // This will update the filtered data and `dataReducer` store and forces an update to subscribers.
      if (this.#dataReducer) { this.#dataReducer.index.update(true); }
   }
}

/**
 * @typedef {object} ArrayObjectStoreParams
 *
 * @property {BaseEntryStore} StoreClass - The entry store class that is instantiated.
 *
 * @property {object[]}       [defaultData=[]] - An array of default data objects.
 *
 * @property {number}         [childDebounce=250] - An integer between and including 0 - 1000; a debounce time in
 *                            milliseconds for child store subscriptions to invoke
 *                            {@link ArrayObjectStore.updateSubscribers} notifying subscribers to this array
 *                            store.
 *
 * @property {boolean}        [dataReducer=false] - When true a DynArrayReducer will be instantiated wrapping store
 *                                                  data and accessible from {@link ArrayObjectStore.dataReducer}.
 *
 * @property {boolean}        [manualUpdate=false] - When true {@link ArrayObjectStore.updateSubscribers} must be
 *                            invoked with a single boolean parameter for subscribers to be updated.
 */

/**
 * @typedef {boolean|object|undefined} ArrayObjectUpdateData
 */
