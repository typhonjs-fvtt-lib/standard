import { colord }    from '@typhonjs-fvtt/runtime/color/colord';

import { RgbState }  from './RgbState.js';

/**
 * Manages the text state for all supported color formats such as `rgb` and `hex` formats. The internal storage format
 * is HSV and the conversions between floating point and integer representation in the text input GUI is lossy.
 * TextState provides a store that tracks the text representations like `rgb` component values (0 - 255). Changes from
 * the text input component are converted into internal HSV representation and set the `hue` and `sv` stores setting
 * the #interalUpdate `textUpdate` flag so that {@link ColorState.#updateCurrentColor} doesn't update TextState. This
 * makes it possible to support a single internal color representation in HSV and not have independent variables for
 * each type.
 */
export class TextState
{
   /**
    * Stores the subscribers.
    *
    * @type {(function(TextState): void)[]}
    */
   #subscriptions = [];

   /** @type {RgbState} */
   #rgb;

   constructor(colorState, internalUpdate)
   {
      const updateSubscribers = this.#updateSubscribers.bind(this);

      this.#rgb = new RgbState(colorState, internalUpdate, updateSubscribers);
   }

   /**
    * @returns {RgbState}
    */
   get rgb()
   {
      return this.#rgb;
   }

   /**
    * Updates all text state for supported formats from the given color.
    *
    * @param {object|string}  color - A supported ColorD color format.
    */
   updateColor(color)
   {
      const colordInstance = colord(color);

      if (!colordInstance.isValid()) { throw new Error(`TextState updateColor error: 'color' is not valid'.`); }

      this.#rgb._updateColor(colordInstance);

      this.#updateSubscribers();
   }

   // Store subscriber implementation --------------------------------------------------------------------------------

   /**
    * @param {function(TextState): void} handler - Callback function that is invoked on update / changes.
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
