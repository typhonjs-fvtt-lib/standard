class AdapterFilters
{
   #filtersAdapter;
   #indexUpdate;
   #mapUnsubscribe = new Map();

   constructor(indexUpdate)
   {
      this.#indexUpdate = indexUpdate;

      this.#filtersAdapter = { filters: [] };

      Object.seal(this);

      return [this, this.#filtersAdapter];
   }

   get length() { return this.#filtersAdapter.filters ? this.#filtersAdapter.filters.length : 0; }

   add(...filters)
   {
      for (const filter of filters)
      {
         if (typeof filter !== 'function' && typeof filter !== 'object')
         {
            throw new TypeError(`DynamicReducer error: 'filter' is not a function or object.`);
         }

         if (!this.#filtersAdapter.filters) { this.#filtersAdapter.filters = []; }

         let data = void 0;

         switch (typeof filter)
         {
            case 'function':
               data = {
                  id: void 0,
                  filter,
                  weight: 1
               };
               break;

            case 'object':
               if (filter.id !== void 0 && typeof filter.id !== 'string')
               {
                  throw new TypeError(`DynamicReducer error: 'id' attribute is not undefined or a string.`);
               }

               if (typeof filter.filter !== 'function')
               {
                  throw new TypeError(`DynamicReducer error: 'filter' attribute is not a function.`);
               }

               if (filter.weight !== void 0 && typeof filter.weight !== 'number' &&
                (filter.weight < 0 || filter.weight > 1))
               {
                  throw new TypeError(
                   `DynamicReducer error: 'weight' attribute is not a number between '0 - 1' inclusive.`);
               }

               data = {
                  id: filter.id || void 0,
                  filter: filter.filter,
                  weight: filter.weight || 1
               };
               break;
         }

         // Find the index to insert where data.weight is less than existing values weight.
         const index = this.#filtersAdapter.filters.findIndex((value) =>
         {
            return data.weight < value.weight;
         });

         // If an index was found insert at that location.
         if (index >= 0)
         {
            this.#filtersAdapter.filters.splice(index, 0, data);
         }
         else // push to end of filters.
         {
            this.#filtersAdapter.filters.push(data);
         }

         if (typeof data.filter.subscribe === 'function')
         {
            const unsubscribe = data.filter.subscribe(this.#indexUpdate);

            // Ensure that unsubscribe is a function.
            if (typeof unsubscribe !== 'function')
            {
               throw new Error(
                'DynArrayReducer error: Filter has subscribe function, but no unsubscribe function is returned.');
            }

            // Ensure that the same filter is not subscribed to multiple times.
            if (this.#mapUnsubscribe.has(filter))
            {
               throw new Error(
                'DynArrayReducer error: Filter added already has an unsubscribe function registered.');
            }

            this.#mapUnsubscribe.set(filter, unsubscribe);
         }
      }

      this.#indexUpdate();
   }

   clear()
   {
      this.#filtersAdapter.filters.length = 0;

      // Unsubscribe from all filters with subscription support.
      for (const unsubscribe of this.#mapUnsubscribe.values())
      {
         unsubscribe();
      }

      this.#mapUnsubscribe.clear();

      this.#indexUpdate();
   }

   *iterator()
   {
      if (this.#filtersAdapter.filters.length === 0) { return; }

      for (const entry of this.#filtersAdapter.filters)
      {
         yield { ...entry };
      }
   }

   remove(...filters)
   {
      if (this.#filtersAdapter.filters.length === 0) { return; }

      const length = this.#filtersAdapter.filters.length;

      for (const data of filters)
      {
         // Handle the case that the filter may either be a function or a filter entry / object.
         const actualFilter = typeof data === 'function' ? data : data !== null && typeof data === 'object' ?
          data.filter : void 0;

         if (!actualFilter) { continue; }

         for (let cntr = this.#filtersAdapter.filters.length; --cntr >= 0;)
         {
            if (this.#filtersAdapter.filters[cntr].filter === actualFilter)
            {
               this.#filtersAdapter.filters.splice(cntr, 1);

               // Invoke any unsubscribe function for given filter then remove from tracking.
               let unsubscribe = void 0;
               if (typeof (unsubscribe = this.#mapUnsubscribe.get(actualFilter)) === 'function')
               {
                  unsubscribe();
                  this.#mapUnsubscribe.delete(actualFilter);
               }
            }
         }
      }

      if (length !== this.#filtersAdapter.filters.length) { this.#indexUpdate(); }
   }

   /**
    * Remove filters by the provided callback. The callback takes 3 parameters: `id`, `filter`, and `weight`.
    * Any truthy value returned will remove that filter.
    *
    * @param {Function} callback - Callback function to evaluate each filter entry.
    */
   removeBy(callback)
   {
      if (!this.#filtersAdapter.filters) { return; }

      const length = this.#filtersAdapter.filters.length;

      this.#filtersAdapter.filters = this.#filtersAdapter.filters.filter((data) =>
      {
         const keep = !callback.call(callback, data.id, data.filter, data.weight);

         // If not keeping invoke any unsubscribe function for given filter then remove from tracking.
         if (!keep)
         {
            let unsubscribe;
            if (typeof (unsubscribe = this.#mapUnsubscribe.get(data.filter)) === 'function')
            {
               unsubscribe();
               this.#mapUnsubscribe.delete(data.filter);
            }
         }

         return keep;
      });

      if (length !== this.#filtersAdapter.filters.length) { this.#indexUpdate(); }
   }

   removeById(...ids)
   {
      if (!this.#filtersAdapter.filters) { return; }

      const length = this.#filtersAdapter.filters.length;

      this.#filtersAdapter.filters = this.#filtersAdapter.filters.filter((data) =>
      {
         let remove = false;

         for (const id of ids) { remove |= data.id === id; }

         // If not keeping invoke any unsubscribe function for given filter then remove from tracking.
         if (remove)
         {
            let unsubscribe;
            if (typeof (unsubscribe = this.#mapUnsubscribe.get(data.filter)) === 'function')
            {
               unsubscribe();
               this.#mapUnsubscribe.delete(data.filter);
            }
         }

         return !remove; // Swap here to actually remove the item via array filter method.
      });

      if (length !== this.#filtersAdapter.filters.length) { this.#indexUpdate(); }
   }
}

class AdapterSort
{
   #sortAdapter;
   #indexUpdate;
   #unsubscribe;

   constructor(indexUpdate)
   {
      this.#indexUpdate = indexUpdate;

      this.#sortAdapter = { sort: null };

      Object.seal(this);

      return [this, this.#sortAdapter];
   }

   set(sort)
   {
      if (typeof this.#unsubscribe === 'function')
      {
         this.#unsubscribe();
         this.#unsubscribe = void 0;
      }

      this.#sortAdapter.sort = sort;

      if (typeof sort.subscribe === 'function')
      {
         this.#unsubscribe = sort.subscribe(this.#indexUpdate);

         // Ensure that unsubscribe is a function.
         if (typeof this.#unsubscribe !== 'function')
         {
            throw new Error(
             'DynArrayReducer error: Sort has subscribe function, but no unsubscribe function is returned.');
         }
      }

      this.#indexUpdate();
   }

   reset()
   {
      this.#sortAdapter.sort = null;

      if (typeof this.#unsubscribe === 'function')
      {
         this.#unsubscribe();
         this.#unsubscribe = void 0;
      }

      this.#indexUpdate();
   }
}

class Indexer
{
   constructor(hostItems, hostUpdate)
   {
      this.hostItems = hostItems;
      this.hostUpdate = hostUpdate;

      const indexAdapter = { index: null };

      const publicAPI = {
         update: this.update.bind(this),

         [Symbol.iterator]: function *()
         {
            if (!indexAdapter.index) { return; }

            for (const index of indexAdapter.index) { yield index; }
         }
      };

      // Define a getter on the public API to get the length / count of index array.
      Object.defineProperties(publicAPI, {
         'length': { get: function() { return Array.isArray(indexAdapter.index) ? indexAdapter.index.length : 0; } }
      });

      Object.freeze(publicAPI);

      indexAdapter.publicAPI = publicAPI;

      this.indexAdapter = indexAdapter;

      return [this, indexAdapter];
   }

   initAdapters(filtersAdapter, sortAdapter)
   {
      this.filtersAdapter = filtersAdapter;
      this.sortAdapter = sortAdapter;

      this.reduceFn = function(newIndex, current, currentIndex)
      {
         let include = true;

         for (const filter of filtersAdapter.filters) { include = include && filter.filter(current); }

         if (include) { newIndex.push(currentIndex); }

         return newIndex;
      };

      this.sortFn = (a, b) =>
      {
         const actualA = this.hostItems[a];
         const actualB = this.hostItems[b];

         return this.sortAdapter.sort(actualA, actualB);
      };
   }

   isActive()
   {
      return this.filtersAdapter.filters.length > 0 || this.sortAdapter.sort ;
   }

   /**
    * Provides an iterator over the index array.
    *
    * @returns {Generator<any, void, *>} Iterator.
    * @yields
    */
   *iterator()
   {
      if (!this.indexAdapter.index) { return; }

      for (const index of this.indexAdapter.index) { yield index; }
   }

   update()
   {
// console.log(`! DynArrayReducer - update - 0`);

      // Clear index if there are no filters or the index length doesn't match the items length.
      if ((this.filtersAdapter.filters.length === 0 && !this.sortAdapter.sort) ||
       (this.indexAdapter.index && this.hostItems.length !== this.indexAdapter.index.length))
      {
         this.indexAdapter.index = null;
      }

      // If there are filters build new index.
      if (this.filtersAdapter.filters)
      {
// console.log(`! DynArrayReducer - update (filter) - 0`);
         this.indexAdapter.index = this.hostItems.reduce(this.reduceFn, []);
      }

      if (this.sortAdapter.sort)
      {
         // If there is no index then create one with keys matching host item length.
         if (!this.indexAdapter.index) { this.indexAdapter.index = [...Array(this.hostItems.length).keys()]; }

// console.log(`! DynArrayReducer - update (sort) - 1`);

         this.indexAdapter.index.sort(this.sortFn);
      }

      this.hostUpdate();
   }
}

/**
 * Provides a managed array with non-destructive reducing / filtering / sorting capabilities with subscription /
 * Svelte store support.
 */
class DynArrayReducer
{
   #items;

   #index;
   #indexAdapter;

   #filters;
   #filtersAdapter;

   #sort;
   #sortAdapter;

   #subscriptions = [];

   /**
    * Initializes DynArrayReducer. Any iterable is supported for initial data. Take note that if `data` is an array it
    * will be used as the host array and not copied. All non-array iterables otherwise create a new array / copy.
    *
    * @param {Iterable<*>}   data - Data iterable to store or copy.
    */
   constructor(data = void 0)
   {
      if (data === null || data === void 0 || typeof data !== 'object' || typeof data[Symbol.iterator] !== 'function')
      {
         throw new TypeError(`DynArrayReducer error: 'data' is not iterable.`);
      }

      this.#items = Array.isArray(data) ? data : [...data];

      [this.#index, this.#indexAdapter] = new Indexer(this.#items, this.#updated.bind(this));

      [this.#filters, this.#filtersAdapter] = new AdapterFilters(this.#indexAdapter.publicAPI.update);
      [this.#sort, this.#sortAdapter] = new AdapterSort(this.#indexAdapter.publicAPI.update);

      this.#index.initAdapters(this.#filtersAdapter, this.#sortAdapter);
   }

   get filters() { return this.#filters; }

   get index() { return this.#indexAdapter.publicAPI; }

   get length() { return this.#items.length; }

   get sort() { return this.#sort; }

   subscribe(handler)
   {
      this.#subscriptions.push(handler); // add handler to the array of subscribers

      handler(this);                     // call handler with current value

      // Return unsubscribe function.
      return () =>
      {
         const index = this.#subscriptions.findIndex((sub) => sub === handler);
         if (index >= 0) { this.#subscriptions.splice(index, 1); }
      };
   }

   #updated()
   {
      // Subscriptions are stored locally as on the browser Babel is still used for private class fields / Babel
      // support until 2023. IE not doing this will require several extra method calls otherwise.
      const subscriptions = this.#subscriptions;
      for (let cntr = 0; cntr < subscriptions.length; cntr++) { subscriptions[cntr](this); }
   }

   *[Symbol.iterator]()
   {
      const items = this.#items;

      if (items.length === 0) { return; }

      if (this.#index.isActive())
      {
          for (const entry of this.#indexAdapter.publicAPI) { yield items[entry]; }
      }
      else
      {
          for (const entry of items) { yield entry; }
      }
   }
}

export { DynArrayReducer };
//# sourceMappingURL=index.js.map
