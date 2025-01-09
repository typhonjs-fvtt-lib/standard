import { TJSDialog }          from '#runtime/svelte/application';
import { isFolder }           from '#runtime/types/fvtt-shim/guard';
import { localize }           from '#runtime/util/i18n';
import { hasSetter }          from '#runtime/util/object';

import { TJSFolderDelete
    as TJSFolderDeleteImpl }  from '#standard/component/fvtt-internal';

import type { SvelteApp }     from '#runtime/svelte/application';

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
    * @param document - Document to delete.
    *
    * @param [options] - TJSDialog / SvelteApp options.
    *
    * @param [dialogData] - Optional data to modify dialog.
    */
   private constructor(document: fvtt.Document, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {})
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
               onPress: (): boolean => false
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
         get: (): fvtt.Document => this.svelte?.appShell?.dialogComponent?.document,
         set: (document: fvtt.Document): void =>
         {
            const dialogComponent = this.svelte?.appShell?.dialogComponent;
            if (hasSetter(dialogComponent, 'document')) { dialogComponent.document = document; }
         }
      });
   }

   /**
    * Deletes a folder and does delete sub-folders / documents.
    *
    * @param document - Folder to delete.
    *
    * @param [options] - Options to pass to TJSDialog / SvelteApp.
    *
    * @param [dialogData] - Optional data to modify dialog.
    *
    * @returns The deleted Folder or a falsy value; either 'false' for cancelling or 'null' if the user closed the
    *          dialog via `<Esc>` or the close header button.
    */
   static async show(document: fvtt.Folder, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {}): Promise<fvtt.Folder | false | null>
   {
      if (!isFolder(document))
      {
         console.warn(`TJSFolderDelete - show - warning: 'document' is not a Folder.`);
         return null;
      }

      return new TJSFolderDelete(document, options, dialogData).wait();
   }
}
