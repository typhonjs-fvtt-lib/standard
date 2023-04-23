import {
   isObject,
   uuidv4 }    from '#runtime/svelte/util';

/**
 * Provides a base implementation for store entries in {@link ArrayObjectStore}.
 *
 * In particular providing the required getting / accessor for the 'id' property.
 */
export class ObjectEntryStore
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

      if (!uuidv4.isValid(data.id)) { throw new Error(`'data.id' (${data.id}) is not a valid UUIDv4 string.`); }
   }

   /**
    * Invoked by ArrayObjectStore to provide custom duplication. Override this static method in your entry store.
    *
    * @param {object}   data - A copy of local data w/ new ID already set.
    *
    * @param {import('./ArrayObjectStore').ArrayObjectStore} arrayStore - The source ArrayObjectStore instance.
    * @internal
    */
   static duplicate(data, arrayStore) {}  // eslint-disable-line no-unused-vars

   /**
    * @returns {object}
    * @protected
    * @internal
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
