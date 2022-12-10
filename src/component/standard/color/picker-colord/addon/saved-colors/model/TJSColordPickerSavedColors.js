import { SavedColorsState }   from './SavedColorsState.js';

import SavedColors            from '../view/SavedColors.svelte';
import SavedColorsSummaryEnd  from '../view/SavedColorsSummaryEnd.svelte';

/**
 * Provides the main addon example for TJSColordPicker. Addons allow extension of the color picker. This addon provides
 * session storage for saving / restoring colors.
 *
 * An oddon for TJSColordPicker must provide a static accessor for a unique `id` and also provide a
 * {@link TJSFolderData} object via a `folderData` accessor.
 */
export class TJSColordPickerSavedColors
{
   static #id = 'saved-colors';

   /** @type {TJSFolderData} */
   #folderData;

   /** @type {SavedColorsState} */
   #savedColorsState;

   /**
    * @returns {string} ID of the addon.
    */
   static get id()
   {
      return TJSColordPickerSavedColors.#id;
   }

   // constructor({ internalState, label = 'Saved Colors Along test yepper even longer test' } = {})
   constructor({ internalState, label = 'Saved Colors' } = {})
   {
      /**
       * Defines the Svelte components to add to TJSSvgFolder.
       *
       * @type {TJSFolderData}
       */
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

      this.#savedColorsState = new SavedColorsState(internalState);
   }

   /**
    * @returns {SavedColorsState}
    */
   get savedColorsState()
   {
      return this.#savedColorsState;
   }

   /**
    * @returns {TJSFolderData} The TJSFolderData object to configure the TJSSvgFolder component the addon is installed
    * into.
    */
   get folderData()
   {
      return this.#folderData;
   }

   destroy()
   {
      this.#savedColorsState.destroy();
   }
}
