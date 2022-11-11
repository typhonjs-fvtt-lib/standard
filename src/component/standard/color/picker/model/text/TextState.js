import { HsvState }  from './HsvState.js';
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

   /**
    * @type {{hsv: HsvState, rgb: RgbState}}
    */
   #modes;

   /**
    * @param {ColorState}                 colorState - ColorState instance.
    *
    * @param {ColorStateInternalUpdate}   internalUpdate - ColorState internal store update data.
    */
   constructor(colorState, internalUpdate)
   {
      /** @type {ColorStateAccess} */
      const colorStateAccess = {
         stores: colorState.stores,
         internalUpdate
      }

      /** @type {TextStateAccess} */
      const textStateUpdate = {
         updateColorInternal: this.#updateColorInternal.bind(this)
      }

      this.#modes = {
         hsv: new HsvState(colorStateAccess, textStateUpdate),
         rgb: new RgbState(colorStateAccess, textStateUpdate)
      }
   }

   /**
    * @returns {HsvState}
    */
   get hsv()
   {
      return this.#modes.hsv;
   }

   /**
    * @returns {RgbState}
    */
   get rgb()
   {
      return this.#modes.rgb;
   }

   /**
    * Updates all text state for supported formats from the given color.
    *
    * @param {{h: number, s: number, v: number}}  color - A supported ColorD color format.
    */
   updateColor(color)
   {
      this.#modes.hsv._updateColor(color);
      this.#modes.rgb._updateColor(color);

      this.#updateSubscribers();
   }

   #updateColorInternal(color, skipMode)
   {
      for (const key in this.#modes)
      {
         if (key === skipMode) { continue; }

         this.#modes[key]._updateColor(color);
      }

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

/**
 * @typedef {object} ColorStateAccess
 *
 * @property {ColorStateStores} stores - The stores from {@link ColorState}.
 *
 * @property {ColorStateInternalUpdate} internalUpdate - The internal tracking state from {@link ColorState}.
 */

/**
 * @typedef {object} TextStateAccess
 *
 * @property {Function} updateColorInternal - Provides access to the #updateColorInternal method.
 */
