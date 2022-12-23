/**
 * Provides a wrapper around the browser EyeDropper API. The EyeDropper requires a secure context including `localhost`.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper_API
 */
export class EyeDropper
{
   /**
    * @returns {boolean} Is the EyeDropper API available?
    */
   static get isAvailable()
   {
      return globalThis.EyeDropper !== void 0;
   }

   /**
    * Defines the button data for TJSIconButton launching the EyeDropper API and assigning any result to
    * `colorState`.
    *
    * @param {{ setColor: Function }} colorState - Provides a callback function setting any user selected color.
    *
    * @returns {{onClick: ((function(): Promise<void>)|*), icon: string}} TJSIconButton data object.
    */
   static buttonData(colorState) {
      return {
         icon: 'fas fa-eye-dropper',
         keyCode: 'Space',
         onPress: async () =>
         {
            try
            {
               const eyeDropper = new globalThis.EyeDropper();

               const colorSelectionResult = await eyeDropper.open();

               if (typeof colorSelectionResult?.sRGBHex === 'string')
               {
                  colorState.setColor(colorSelectionResult.sRGBHex);
               }
            }
            catch (err) { /**/ }
         }
      }
   }
}
