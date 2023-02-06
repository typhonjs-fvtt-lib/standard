/**
 * Provides management of all saved colors in a session storage store.
 *
 * Note:
 */
export class SavedColorsState
{
   static #sessionKey = 'trl:svelte-standard:tjs-colord-picker:addon:saved-colors:state';

   #colorArray = [];

   /** @type {InternalState} */
   #internalState;

   #sessionStore;

   /**
    * Stores the subscribers.
    *
    * @type {(function(string[]): void)[]}
    */
   #subscriptions = [];

   /**
    * Stores the unsubscribe function from the session storage store.
    *
    * @type {Function}
    */
   #unsubscribe;

   constructor(internalState)
   {
      this.#internalState = internalState;

      const storage = internalState.sessionStorage;

      this.#sessionStore = storage.getStore(SavedColorsState.#sessionKey, []);

      this.#unsubscribe = this.#sessionStore.subscribe(this.#sessionUpdate.bind(this));
   }

   destroy()
   {
      this.#unsubscribe();

      this.#internalState = void 0;
      this.#sessionStore = void 0;
      this.#unsubscribe = void 0;
   }


   addColor()
   {
      const color = this.#internalState.colorState.getColor({ format: 'hsl', formatType: 'string' });

      const currentIndex = this.#colorArray.findIndex((elem) => elem === color);

      // Move color to front of array as applicable.
      if (currentIndex > 0)
      {
         this.#colorArray.splice(currentIndex, 1);
         this.#colorArray.unshift(color);

         // Remove last color if list length is greater than 16.
         if (this.#colorArray.length > 16) { this.#colorArray.pop(); }

         this.#sessionStore.set(this.#colorArray);
      }
      else if (currentIndex === -1)
      {
         this.#colorArray.unshift(color);

         // Remove last color if list length is greater than 16.
         if (this.#colorArray.length > 16) { this.#colorArray.pop(); }

         this.#sessionStore.set(this.#colorArray);
      }
   }

   deleteColor(color)
   {
      const currentIndex = this.#colorArray.findIndex((elem) => elem === color);

      if (currentIndex >= 0)
      {
         this.#colorArray.splice(currentIndex, 1);
         this.#sessionStore.set(this.#colorArray);
      }
   }

   deleteAll()
   {
      this.#sessionStore.set([]);
   }

   /**
    * Invoked when the session storage store changes.
    *
    * @param {string[]} colorArray -
    */
   #sessionUpdate(colorArray)
   {
      this.#colorArray = colorArray;
      this.#updateSubscribers();
   }

   // Store subscriber implementation --------------------------------------------------------------------------------

   /**
    * @param {function(string[]): void} handler - Callback function that is invoked on update / changes.
    *
    * @returns {(function(): void)} Unsubscribe function.
    */
   subscribe(handler)
   {
      this.#subscriptions.push(handler); // add handler to the array of subscribers

      handler(this.#colorArray);         // call handler with current value

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
      for (let cntr = 0; cntr < this.#subscriptions.length; cntr++) { this.#subscriptions[cntr](this.#colorArray); }
   }
}
