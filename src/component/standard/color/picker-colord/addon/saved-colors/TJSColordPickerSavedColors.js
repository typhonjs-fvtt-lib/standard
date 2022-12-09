import SavedColors from "./SavedColors.svelte";
import SavedColorsSummaryEnd from "./SavedColorsSummaryEnd.svelte";

/**
 * Provides the main addon example for TJSColordPicker. Addons allow extension of the color picker. This addon provides
 * session storage for saving / restoring colors.
 *
 * An oddon for TJSColordPicker must provide a static accessor for a unique `id` and also provide a
 * {@link TJSFolderData} object via a `folderData` accessor.
 */
export class TJSColordPickerSavedColors
{
   /** @type {TJSFolderData} */
   #folderData;

   static #id = 'saved-colors';

   /**
    * @returns {string} ID of the addon.
    */
   static get id()
   {
      return TJSColordPickerSavedColors.#id;
   }

   constructor({ label = 'Saved Colors' } = {})
   {
      this.#folderData = {
         id: TJSColordPickerSavedColors.#id,
         label,
         slotDefault: {
            class: SavedColors
         },
         slotSummaryEnd: {
            class: SavedColorsSummaryEnd
         }
      }
   }

   /**
    * @returns {TJSFolderData} The TJSFolderData object to configure the TJSSvgFolder component the addon is installed
    * into.
    */
   get folderData()
   {
      return this.#folderData;
   }
}
