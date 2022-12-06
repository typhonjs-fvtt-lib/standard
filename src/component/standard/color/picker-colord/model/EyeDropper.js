export class EyeDropper
{
   static get isAvailable()
   {
      return globalThis.EyeDropper !== void 0;
   }

   static buttonData(colorState) {
      return {
         icon: 'fas fa-eye-dropper',
         onClick: async () =>
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
