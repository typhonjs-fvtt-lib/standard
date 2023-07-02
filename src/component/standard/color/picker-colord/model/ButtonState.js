import { isObject }  from '#runtime/util/object';

/**
 * Manages the addon button state allowing addons to add buttons to the button bar. When addons are removed
 * {@link AddOnState} invokes {@link ButtonState.removeById}.
 */
export class ButtonState
{
   /**
    * @type {object[]}
    */
   #buttonList = [];

   /**
    * @type {import('./').InternalState}
    */
   #internalState;

   /**
    * Stores the subscribers.
    *
    * @type {import('svelte/store').Subscriber<object[]>[]}
    */
   #subscriptions = [];

   /**
    * @param {import('./').InternalState}  internalState -
    */
   constructor(internalState)
   {
      this.#internalState = internalState;
   }

   /**
    * @returns {number} Number of addons.
    */
   get length()
   {
      return this.#buttonList.length;
   }

   /**
    * Adds a {@link TJSIconButton} or {@link TJSToggleIconButton} to the {@link ButtonBar}.
    *
    * @param {object}   button - Button data; optional `isToggle` boolean to indicate a toggle button.
    */
   add(button)
   {
      if (!isObject(button)) { throw new TypeError(`'button' is not an object.`); }

      if (typeof button.id !== 'string') { throw new TypeError(`'button.id' is not a string.`); }
      if (typeof button.icon !== 'string') { throw new TypeError(`'button.icon' is not a string.`); }
      if (typeof button.onClick !== 'function') { throw new TypeError(`'button.onClick' is not a function.`); }

      if (button.isToggle !== void 0 && typeof button.isToggle !== 'boolean')
      {
         throw new TypeError(`'button.isToggle' is not a boolean.`);
      }

      if (!this.#internalState.addOnState.has(button.id))
      {
         throw new Error(`'button.id' does not match any addon ID.`);
      }

      this.#buttonList.push(button);

      this.#updateSubscribers();
   }

   removeById(id)
   {
      let index;

      do
      {
         index = this.#buttonList.findIndex((button) => button.id === id);
         if (index >= 0) { this.#buttonList.splice(index, 1); }
      } while (index >= 0);

      this.#updateSubscribers();
   }

   // Store subscriber implementation --------------------------------------------------------------------------------

   /**
    * @param {import('svelte/store').Subscriber<object[]>} handler - Callback function that is invoked on update /
    * changes.
    *
    * @returns {import('svelte/store').Unsubscriber} Unsubscribe function.
    */
   subscribe(handler)
   {
      this.#subscriptions.push(handler); // add handler to the array of subscribers

      handler(this.#buttonList);         // call handler with current value

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
      for (let cntr = 0; cntr < this.#subscriptions.length; cntr++) { this.#subscriptions[cntr](this.#buttonList); }
   }
}
