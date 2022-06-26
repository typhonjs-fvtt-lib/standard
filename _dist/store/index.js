import { writable } from 'svelte/store';
import { normalizeString } from '@typhonjs-fvtt/runtime/svelte/util';
import { DynArrayReducer, TJSGameSettings, isWritableStore, subscribeIgnoreFirst } from '@typhonjs-fvtt/runtime/svelte/store';
import { debounce, isObject, uuidv4, klona } from '@typhonjs-fvtt/runtime/svelte/util';
import { isWritableStore as isWritableStore$1 } from '@typhonjs-fvtt/runtime/svelte/store';

/**
 * Creates a filter function to compare objects by a give property key against a regex test. The returned function
 * is also a writable Svelte store that builds a regex from the stores value.
 *
 * This filter function can be used w/ DynArrayReducer and bound as a store to input elements.
 *
 * @param {string}   property - Property key to compare.
 *
 * @param {object}   [opts] - Optional parameters.
 *
 * @param {boolean}  [opts.caseSensitive=false] - When true regex test is case-sensitive.
 *
 * @returns {(data: object) => boolean} The query string filter.
 */
function createFilterQuery(property, { caseSensitive = false } = {})
{
   let keyword = '';
   let regex;
   const storeKeyword = writable(keyword);

   /**
    * If there is no filter keyword / regex then do not filter otherwise filter based on the regex
    * created from the search input element.
    *
    * @param {object} data - Data object to test against regex.
    *
    * @returns {boolean} AnimationStore filter state.
    */
   function filterQuery(data)
   {
      return keyword === '' || !regex ? true : regex.test(normalizeString(data?.[property]));
   }

   /**
    * Create a custom store that changes when the search keyword changes.
    *
    * @param {(string) => void} handler - A callback function that accepts strings.
    *
    * @returns {import('svelte/store').Unsubscriber}
    */
   filterQuery.subscribe = (handler) =>
   {
      return storeKeyword.subscribe(handler);
   };

   /**
    * Set
    *
    * @param {string}   value - A new value for the keyword / regex test.
    */
   filterQuery.set = (value) =>
   {
      if (typeof value === 'string')
      {
         keyword = normalizeString(value);
         regex = new RegExp(RegExp.escape(keyword), caseSensitive ? '' : 'i');
         storeKeyword.set(keyword);
      }
   };

   return filterQuery;
}

/**
 * @typedef {typeof import('svelte/store').Writable & { get id: string }} BaseEntryStore
 */

/**
 * @template {BaseEntryStore} T
 */
class WorldSettingArrayStore {
   /** @type {T[]} */
   #data = [];

   /**
    * @type {Map<string, { store: T, unsubscribe: Function}>}
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
    * @param {object[]}          [defaultData=[]] - An array of default data objects.
    *
    * @param {number}            [childDebounce=250] - An integer between and including 0 - 1000; a debounce time in
    *                            milliseconds for child store subscriptions to invoke
    *                            {@link WorldSettingArrayStore._updateSubscribers} notifying subscribers to this array
    *                            store.
    */
   constructor({ gameSettings, moduleId, key, StoreClass, defaultData = [], childDebounce = 250 } = {})
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

      if (!Number.isInteger(childDebounce) || childDebounce < 0 || childDebounce > 1000)
      {
         throw new TypeError(`'childDebounce' must be an integer between and including 0 - 1000.`);
      }

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

      this.#key = key;
      this.#StoreClass = StoreClass;

      // Prepare a debounced callback that is used for all child store entry subscriptions.
      this.#updateSubscribersBound = childDebounce === 0 ? this._updateSubscribers.bind(this) :
       debounce(() => this._updateSubscribers(), childDebounce);

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
   get dataReducer() { return this.#dataReducer; }

   /**
    * @returns {string}
    */
   get key() { return this.#key; }

   /**
    * @returns {number}
    */
   get length() { return this.#data.length; }

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
   delete(id)
   {
      const result = this.#deleteStore(id);

      this._updateSubscribers();

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
   duplicate(id)
   {
      if (typeof id !== 'string') { throw new TypeError(`'id' is not a string.`); }

      const storeEntryData = this.#dataMap.get(id);

      if (storeEntryData)
      {
         const data = klona(storeEntryData.store.toJSON());
         data.id = uuidv4();

         // Allow StoreClass to statically perform any specialized duplication.
         this.#StoreClass?.duplicate?.(data, this);

         return this.add(data);
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
   find(predicate)
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
   get(id)
   {
      const storeEntryData = this.#dataMap.get(id);
      return storeEntryData ? storeEntryData.store : void 0;
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
         // Must invoke unsubscribe for all child stores.
         for (const storeEntryData of dataMap.values()) { storeEntryData.unsubscribe(); }

         data.length = 0;
         dataMap.clear();

         for (const updateData of updateList) { this.#addStore(updateData); }
      }
      else
      {
         // Remove entries that are no longer in data.
         for (const id of removeIDSet) { this.#deleteStore(id); }
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

/**
 * Provides a base implementation for store entries in {@link WorldSettingArrayStore}.
 *
 * In particular providing the required getting / accessor for the 'id' property.
 */
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
    * Invoked by WorldSettingArrayStore to provide custom duplication. Override this static method in your entry store.
    *
    * @param {object}   data - A copy of local data w/ new ID already set.
    *
    * @param {WorldSettingArrayStore} arrayStore - The source WorldSettingArrayStore instance.
    */
   static duplicate(data, arrayStore) {}

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

/**
 * Wraps a writable stores set method invoking a callback after the store is set. This allows parent / child
 * relationships between stores to update directly without having to subscribe to the child store. This is a particular
 * powerful pattern when the `setCallback` is a debounced function that syncs a parent store and / or serializes data.
 *
 * @param {import('svelte/store').Writable} store - A store to wrap.
 *
 * @param {(store?: import('svelte/store').Writable, value?: *) => void} setCallback - A callback to invoke after store
 *                                                                                     set.
 *
 * @returns {import('svelte/store').Writable} Wrapped store.
 */
function storeCallback(store, setCallback)
{
   if (!isWritableStore$1(store)) { throw new TypeError(`'store' is not a writable store.`); }
   if (typeof setCallback !== 'function') { throw new TypeError(`'setCallback' is not a function.`); }

   /** @type {import('svelte/store').Writable} */
   const wrapper = {
      set: (value) => {
         store.set(value);
         setCallback(store, value);
      },

      subscribe: store.subscribe,

      update: typeof store.update === 'function' ? store.update : void 0
   };

   Object.freeze(wrapper);

   return wrapper;
}

export { WorldSettingArrayStore, createFilterQuery, storeCallback };
//# sourceMappingURL=index.js.map
