import { TJSDialog }             from '#runtime/svelte/application';
import { isFolder }              from '#runtime/types/fvtt-shim/guard';
import { localize }              from '#runtime/util/i18n';
import { hasSetter }             from '#runtime/util/object';

import { TJSFolderRemoveComp }   from '#standard/component/fvtt-internal';

import type { SvelteApp }        from '#runtime/svelte/application';

/**
 * Provides a reactive dialog for removing a folder that by default is modal and not draggable. An additional set of
 * accessors for the folder assigned are available via the `this.reactive.document`. You may swap out the folder at any
 * time by setting it to a different folder document.
 */
export class TJSFolderRemove extends TJSDialog
{
   /**
    * @param document - Folder to remove.
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
            class: TJSFolderRemoveComp,
            props: { document }
         },
         title: `${localize('FOLDER.Remove')}: ${document.name}`,
         buttons: {
            remove: {
               icon: 'fas fa-trash',
               label: 'FOLDER.Remove',
               onPress: 'removeFolder'
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
         get: (): fvtt.Document => this.svelte?.appShell?.dialogComponent?.document,
         set: (document: fvtt.Document): void =>
         {
            const dialogComponent = this.svelte?.appShell?.dialogComponent;
            if (hasSetter(dialogComponent, 'document')) { dialogComponent.document = document; }
         }
      });
   }

   /**
    * Removes a folder, but does not delete / remove subfolders / documents.
    *
    * @param document - The folder to remove.
    *
    * @param [options] - Options to pass to TJSDialog / SvelteApp.
    *
    * @param [dialogData] - Optional data to modify dialog.
    *
    * @returns The removed Folder or a falsy value; either 'false' for cancelling or 'null' if the user closed the
    *          dialog via `<Esc>` or the close header button.
    */
   static async show(document: fvtt.Folder, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {}): Promise<fvtt.Folder | false | null>
   {
      if (!isFolder(document))
      {
         console.warn(`TJSFolderRemove - show - warning: 'document' is not a Folder.`);
         return null;
      }

      return new TJSFolderRemove(document, options, dialogData).wait();
   }
}
