import { TJSDialog }          from '#runtime/svelte/application';
import { localize }           from '#runtime/util/i18n';
import { hasSetter }          from '#runtime/util/object';

import { TJSFolderDelete
    as TJSFolderDeleteImpl }  from '#standard/component/fvtt-internal';

/**
 * Provides a reactive dialog for deleting a folder that by default is modal and not draggable. An additional set of
 * accessors for the folder assigned are available via the `this.reactive.document`. You may swap out the folder at any
 * time by setting it to a different folder document.
 */
export class TJSFolderDelete extends TJSDialog
{
   /**
    * Deletes a folder and does delete sub-folders / documents.
    *
    * @param {fvtt.Folder} document - Folder to delete.
    *
    * @param {import('#runtime/svelte/application').SvelteApp.OptionsCore} [options] - Options to pass to TJSDialog /
    *        Application.
    *
    * @param {import('#runtime/svelte/application').TJSDialogOptions} [dialogData] - Optional data to modify dialog.
    *
    * @private
    */
   constructor(document, options = {}, dialogData = {})
   {
      super({
         modal: typeof dialogData?.modal === 'boolean' ? dialogData.modal : true,
         draggable: typeof options?.draggable === 'boolean' ? options.draggable : false,
         focusKeep: true,
         minimizable: false,
         ...dialogData,
         content: {
            class: TJSFolderDeleteImpl,
            props: { document }
         },
         title: `${localize('FOLDER.Delete')}: ${document.name}`,
         buttons: {
            delete: {
               icon: 'fas fa-dumpster',
               label: 'FOLDER.Delete',
               onPress: 'deleteFolder'
            },
            cancel: {
               icon: 'fas fa-times',
               label: 'Cancel',
               onPress: () => false
            }
         },
         default: 'cancel'
      }, options);

      /**
       * @member {object} document - Adds accessors to SvelteReactive to get / set the document associated with
       *                             Document.
       *
       * @memberof SvelteReactive#
       */
      Object.defineProperty(this.reactive, 'document', {
         get: () => this.svelte?.dialogComponent?.document,
         set: (document) =>
         {
            const dialogComponent = this.svelte.dialogComponent;
            if (hasSetter(dialogComponent, 'document')) { dialogComponent.document = document; }
         }
      });
   }

   /**
    * Deletes a folder and does delete sub-folders / documents.
    *
    * @param {fvtt.Folder} document - Folder to delete.
    *
    * @param {import('#runtime/svelte/application').SvelteApp.OptionsCore} [options] - Options to pass to TJSDialog /
    *        Application.
    *
    * @param {import('#runtime/svelte/application').TJSDialogOptions} [dialogData] - Optional data to modify dialog.
    *
    * @returns {Promise<fvtt.Folder | boolean | null>} The deleted Folder or a falsy value; either 'false' for
    *          cancelling or 'null' if the user closed the dialog via `<Esc>` or the close header button.
    */
   static async show(document, options = {}, dialogData = {})
   {
      if (!(document instanceof Folder))
      {
         console.warn(`TJSFolderDelete - show - warning: 'document' is not a Folder.`);
         return null;
      }

      return new TJSFolderDelete(document, options, dialogData).wait();
   }
}
