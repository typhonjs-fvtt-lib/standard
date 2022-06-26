import { isWritableStore } from '@typhonjs-svelte/lib/store';

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
export function storeCallback(store, setCallback)
{
   if (!isWritableStore(store)) { throw new TypeError(`'store' is not a writable store.`); }
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
