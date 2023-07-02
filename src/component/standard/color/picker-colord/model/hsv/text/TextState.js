import { AlphaState }      from './AlphaState.js';
import { HexState }        from './HexState.js';
import { HslState }        from './HslState.js';
import { HsvState }        from './HsvState.js';
import { RgbState }        from './RgbState.js';

import { ActiveTextState } from './ActiveTextState.js';

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
   /** @type {{ hex: HexState, hsl: HslState, hsv: HsvState, rgb: RgbState }} */
   #allState;

   /** @type {AlphaState} */
   #alphaState;

   /**
    * Stores the subscribers.
    *
    * @type {import('svelte/store').Subscriber<TextState>[]}
    */
   #subscriptions = [];

   #activeTextState;

   /**
    * @param {import('../').ColorState}                 colorState - ColorState instance.
    *
    * @param {import('../').ColorStateInternalUpdate}   internalUpdate - ColorState internal store update data.
    */
   constructor(colorState, internalUpdate)
   {
      /** @type {import('./').ColorStateAccess} */
      const colorStateAccess = {
         stores: colorState.stores,
         internalUpdate
      };

      /** @type {import('./').TextStateAccess} */
      const textStateAccess = {
         updateColorInternal: this.#updateColorInternal.bind(this)
      };

      this.#alphaState = new AlphaState(colorStateAccess, textStateAccess);

      this.#allState = {
         hex: new HexState(colorStateAccess, textStateAccess),
         hsl: new HslState(colorStateAccess, textStateAccess),
         hsv: new HsvState(colorStateAccess, textStateAccess),
         rgb: new RgbState(colorStateAccess, textStateAccess)
      };

      this.#activeTextState = new ActiveTextState(this.#allState, colorState.format);

      this.updateColor(colorState.hsv);
   }

   /**
    * @returns {ActiveTextState} Current active text state.
    */
   get activeState()
   {
      return this.#activeTextState;
   }

   /**
    * @returns {AlphaState} Alpha text state.
    */
   get alpha()
   {
      return this.#alphaState;
   }

   /**
    * @returns {HexState} Hex text state.
    */
   get hex()
   {
      return this.#allState.hex;
   }

   /**
    * @returns {HslState} HSL text state.
    */
   get hsl()
   {
      return this.#allState.hsl;
   }

   /**
    * @returns {HsvState} HSV text state.
    */
   get hsv()
   {
      return this.#allState.hsv;
   }

   /**
    * @returns {RgbState} RGB text state.
    */
   get rgb()
   {
      return this.#allState.rgb;
   }

   /**
    * Updates all text state for supported formats from the given color.
    *
    * @param {object}  color - A supported ColorD color format.
    */
   updateColor(color)
   {
      this.#alphaState._updateColor(color);

      this.#allState.hex._updateColor(color);
      this.#allState.hsl._updateColor(color);
      this.#allState.hsv._updateColor(color);
      this.#allState.rgb._updateColor(color);

      this.#updateSubscribers();
   }

   /**
    * Updates active text state format when format option changes.
    *
    * @param {string} format -
    */
   updateFormat(format)
   {
      this.#activeTextState.setFormat(format);
   }

   /**
    * Provides a mechanism for the various color modes to update the other modes on changes to internal state.
    *
    * @param {object}   color - Color object from the source mode.
    *
    * @param {string}   skipMode - Mode index to skip; IE when invoked from a given mode that mode is skipped.
    */
   #updateColorInternal(color, skipMode)
   {
      for (const key in this.#allState)
      {
         if (key === skipMode) { continue; }

         this.#allState[key]._updateColor(color);
      }

      this.#updateSubscribers();
   }

   // Store subscriber implementation --------------------------------------------------------------------------------

   /**
    * @param {import('svelte/store').Subscriber<TextState>} handler - Callback function that is invoked on update /
    * changes.
    *
    * @returns {import('svelte/store').Unsubscriber} Unsubscribe function.
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
