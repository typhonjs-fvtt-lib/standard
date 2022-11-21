import { textInputModes } from '../../../base/text/index.js';

export class ActiveTextMode
{
   #activeKey;

   #activeMode;

   #modeKeys;

   /**
    * Stores the subscribers.
    *
    * @type {(function(ActiveTextMode): void)[]}
    */
   #subscriptions = [];

   constructor()
   {
      this.#modeKeys = Object.keys(textInputModes);
      this.#activeKey = 'hex';
      this.#activeMode = textInputModes[this.#activeKey];
   }

   /**
    * @returns {object} Current active text mode configuration.
    */
   get mode()
   {
      return this.#activeMode;
   }

   /**
    * Advances to the next color text mode.
    */
   nextMode()
   {
      const currentIndex = this.#modeKeys.findIndex((entry) => entry === this.#activeKey);
      const newIndex = (currentIndex + 1) % this.#modeKeys.length;

      this.#activeKey = this.#modeKeys[newIndex];
      this.#activeMode = textInputModes[this.#activeKey];

      this.#updateSubscribers();
   }

   /**
    * Selects the previous color text mode.
    */
   prevMode()
   {
      const currentIndex = this.#modeKeys.findIndex((entry) => entry === this.#activeKey);
      const newIndex = currentIndex === 0 ? this.#modeKeys.length - 1 : currentIndex - 1;

      this.#activeKey = this.#modeKeys[newIndex];
      this.#activeMode = textInputModes[this.#activeKey];

      this.#updateSubscribers();
   }

   // Store subscriber implementation --------------------------------------------------------------------------------

   /**
    * @param {function(ActiveTextMode): void} handler - Callback function that is invoked on update / changes.
    *
    * @returns {(function(): void)} Unsubscribe function.
    */
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

   /**
    * Updates subscribers.
    */
   #updateSubscribers()
   {
      for (let cntr = 0; cntr < this.#subscriptions.length; cntr++) { this.#subscriptions[cntr](this); }
   }
}
