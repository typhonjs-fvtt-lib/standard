export class ActiveTextState
{
   #activeKey;

   #activeState;

   #allState;

   #modeKeys;

   /**
    * Stores the subscribers.
    *
    * @type {(function(ActiveTextState): void)[]}
    */
   #subscriptions = [];

   constructor(allState)
   {
      this.#allState = allState;
      this.#modeKeys = Object.keys(allState);
      this.#activeKey = 'hex';
      this.#activeState = allState[this.#activeKey];
   }

   /**
    * @returns {object} Current active text mode configuration.
    */
   get active()
   {
      return this.#allState[this.#activeKey];
   }

   /**
    * Advances to the next color text mode.
    */
   next()
   {
      const currentIndex = this.#modeKeys.findIndex((entry) => entry === this.#activeKey);
      const newIndex = (currentIndex + 1) % this.#modeKeys.length;

      this.#activeKey = this.#modeKeys[newIndex];

      this.#updateSubscribers();
   }

   /**
    * Selects the previous color text mode.
    */
   previous()
   {
      const currentIndex = this.#modeKeys.findIndex((entry) => entry === this.#activeKey);
      const newIndex = currentIndex === 0 ? this.#modeKeys.length - 1 : currentIndex - 1;

      this.#activeKey = this.#modeKeys[newIndex];

      this.#updateSubscribers();
   }

   // Store subscriber implementation --------------------------------------------------------------------------------

   /**
    * @param {function(ActiveTextState): void} handler - Callback function that is invoked on update / changes.
    *
    * @returns {(function(): void)} Unsubscribe function.
    */
   subscribe(handler)
   {
      this.#subscriptions.push(handler); // add handler to the array of subscribers

      handler(this.#allState[this.#activeKey]);                     // call handler with current value

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
      // for (let cntr = 0; cntr < this.#subscriptions.length; cntr++) { this.#subscriptions[cntr](this); }
      for (let cntr = 0; cntr < this.#subscriptions.length; cntr++) { this.#subscriptions[cntr](this.#allState[this.#activeKey]); }
   }
}
