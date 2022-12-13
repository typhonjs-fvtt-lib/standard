/**
 * Manages the addon state instantiating external user defined addons storing the model and providing a readable store
 * of all addons for {@link AddOnPanel}.
 */
export class AddOnState
{
   #addOnMap = new Map();

   #addOnArray = [];

   /**
    * @type {InternalState}
    */
   #internalState;

   /**
    * Stores the subscribers.
    *
    * @type {(function(TJSFolderData[]): void)[]}
    */
   #subscriptions = [];

   /**
    * @param {InternalState}  internalState -
    */
   constructor(internalState)
   {
      this.#internalState = internalState;
   }

   /**
    * @returns {number} Number of addons.
    */
   get size()
   {
      return this.#addOnMap.size;
   }

   /**
    * @param {string}   key - Addon ID.
    *
    * @returns {object} The model instance for any associated addon.
    */
   get(key)
   {
      return this.#addOnMap.get(key);
   }

   /**
    * @param {string}   key - Addon ID.
    *
    * @returns {boolean} Is an addon with the given ID found?
    */
   has(key)
   {
      return this.#addOnMap.has(key);
   }

   /**
    * Invoked from {@link InternalState} to update addon state.
    *
    * @param {Iterable<Function>}   addonOptions - `options.addons` iterable list of addon constructor functions.
    */
   updateOptions(addonOptions)
   {
      // Store all existing addon IDs / keys and any not maintained in the initial loop through `addOnOptions` are
      // removed.
      const removeKeys = new Set(this.#addOnMap.keys());

      for (const AddOn of addonOptions)
      {
         if (typeof AddOn?.id !== 'string')
         {
            throw new TypeError(`'options.addons' missing static 'id' accessor.`);
         }

         const hasId = this.#addOnMap.has(AddOn.id);

         if (!hasId)
         {
            const addOnInstance = new AddOn({ internalState: this.#internalState });
            this.#addOnMap.set(AddOn.id, addOnInstance);
         }
         else
         {
            // ID for addon maintained and removed from removeKeys
            removeKeys.delete(AddOn.id);
         }
      }

      for (const key of removeKeys)
      {
         const addon = this.#addOnMap.get(key);
         this.#addOnMap.delete(key);

         // Invoke any destroy function allowing the addon model to cleanup / do any housekeeping.
         if (typeof addon?.destroy === 'function') { addon.destroy(); }
      }

      const duplicateSet = new Set();

      this.#addOnArray = [];

      // Create new addon array from the order of the given `options.addons` iterable removing any duplicates.
      for (const AddOn of addonOptions)
      {
         if (!duplicateSet.has(AddOn.id)) { this.#addOnArray.push(this.#addOnMap.get(AddOn.id)); }
         duplicateSet.add(AddOn.id);
      }

      this.#updateSubscribers();
   }

   // Store subscriber implementation --------------------------------------------------------------------------------

   /**
    * @param {function(TJSFolderData[]): void} handler - Callback function that is invoked on update / changes.
    *
    * @returns {(function(): void)} Unsubscribe function.
    */
   subscribe(handler)
   {
      this.#subscriptions.push(handler); // add handler to the array of subscribers

      handler(this.#addOnArray);         // call handler with current value

      // Return unsubscribe function.
      return () =>
      {
         const index = this.#subscriptions.findIndex((sub) => sub === handler);
         if (index >= 0) { this.#subscriptions.splice(index, 1); }
      };
   }

   /**
    * Updates subscribers.
    */
   #updateSubscribers()
   {
      for (let cntr = 0; cntr < this.#subscriptions.length; cntr++) { this.#subscriptions[cntr](this.#addOnArray); }
   }
}
