import { TJSDialog }                   from '#runtime/svelte/application';
import { isFolder }                    from '#runtime/types/fvtt-shim/guard';
import { localize }                    from '#runtime/util/i18n';
import { hasSetter }                   from '#runtime/util/object';

import { TJSFolderCreateUpdateComp }   from '#standard/component/fvtt-internal';

import type { SvelteApp }              from '#runtime/svelte/application';

/**
 * Provides a reactive dialog for modifying folders that by default is modal and not draggable. An additional set of
 * accessors for the folder assigned are available via the `this.reactive.document`. You may swap out the folder at
 * any time by setting it to a different folder document.
 */
export class TJSFolderCreateUpdate extends TJSDialog
{
   /**
    * @param document - Document to delete.
    *
    * @param [options] - TJSDialog / SvelteApp options.
    *
    * @param {TJSDialog.OptionsData} [dialogData] - Optional data to modify dialog.
    */
   private constructor(document: fvtt.Document, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {})
   {
      super({
         modal: typeof dialogData?.modal === 'boolean' ? dialogData.modal : true,
         draggable: typeof options?.draggable === 'boolean' ? options.draggable : false,
         focusFirst: true,
         focusKeep: true,
         minimizable: false,
         ...dialogData,
         content: {
            class: TJSFolderCreateUpdateComp,
            props: { document }
         },
         title: document.id ? `${localize('FOLDER.Update')}: ${document.name}` :
          localize('SIDEBAR.ACTIONS.CREATE.Folder'),
         buttons: {
            yes: {
               autoClose: false,
               icon: 'fa-solid fa-check',
               label: 'Yes',
               onPress: 'requestSubmit'
            },
            no: {
               icon: 'fa-solid fa-xmark',
               label: 'No',
               onPress: (): boolean => false
            }
         },
         default: 'no'
      }, { headerIcon: `fa-fw fa-solid ${document.id ? 'fas fa-edit' : 'fa-folder' }`, ...options });

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
    * Create a new Folder by rendering a dialog to provide basic creation details.
    *
    * @param {object} folderData - Initial data with which to populate the creation form.
    *
    * @param [options] - Options to pass to TJSDialog / SvelteApp.
    *
    * @param [dialogData] - Optional data to modify dialog.
    *
    * @returns The newly created Folder or null if the dialog is closed.
    */
   static async showCreate(folderData: { type: string }, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {}): Promise<fvtt.Folder | null>
   {
      // @ts-ignore
      if (!(folderData?.type in globalThis.CONFIG))
      {
         console.warn(
          `TJSFolderCreateUpdate - showCreate - warning: 'type' attribute of folderData is not a Document.`);
         return null;
      }

      // @ts-ignore
      const label: string = localize(foundry.documents.Folder.metadata.label);

      // @ts-ignore
      const data = globalThis.foundry.utils.mergeObject({
         name: localize('DOCUMENT.New', { type: label }),
         sorting: 'a',
      }, folderData);

      // @ts-ignore
      const document = new foundry.documents.Folder(data);

      return new TJSFolderCreateUpdate(document, options, dialogData).wait();
   }

   /**
    * Updates an existing Folder by rendering a dialog window with basic details.
    *
    * @param document - The folder to edit.
    *
    * @param [options] - Options to pass to TJSDialog / SvelteApp.
    *
    * @param [dialogData] - Optional data to modify dialog.
    *
    * @returns The modified Folder or null if the dialog is closed.
    */
   static async showUpdate(document: fvtt.Folder, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {}): Promise<fvtt.Folder | null>
   {
      if (!isFolder(document))
      {
         console.warn(`TJSFolderCreateUpdate - show - warning: 'document' is not a Folder.`);
         return null;
      }

      return new TJSFolderCreateUpdate(document, options, dialogData).wait();
   }
}
