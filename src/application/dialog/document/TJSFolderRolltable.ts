import { TJSDialog }                from '#runtime/svelte/application';
import { isFolder }                 from '#runtime/types/fvtt-shim/guard';
import { localize }                 from '#runtime/util/i18n';
import { hasSetter }                from '#runtime/util/object';

import { TJSFolderRolltableComp }   from '#standard/component/fvtt-internal';

import type { SvelteApp }           from '#runtime/svelte/application';

/**
 * Provides a reactive dialog for creating a RollTable from a folder that by default is modal and not draggable. An
 * additional set of accessors for the folder assigned are available via the `this.reactive.document`. You may swap out
 * the folder at any time by setting it to a different folder document.
 */
export class TJSFolderRolltable extends TJSDialog
{
   /**
    * @param document - Folder to create roll table from...
    *
    * @param [options] - Options to pass to TJSDialog / SvelteApp.
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
            class: TJSFolderRolltableComp,
            props: { document }
         },
         title: `${localize('FOLDER.CreateTable')}: ${document.name}`,
         buttons: {
            create: {
               // @ts-ignore
               icon: `${CONFIG.RollTable.sidebarIcon}`,
               label: 'FOLDER.CreateTable',
               onPress: 'createTable'
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
    * Create a RollTable from the contents of the Folder.
    *
    * @param document - Folder to create roll table from...
    *
    * @param [options] - Options to pass to TJSDialog / SvelteApp.
    *
    * @param [dialogData] - Optional data to modify dialog.
    *
    * @returns The newly created RollTable or a falsy value; either 'false' for cancelling or 'null' if the user closed
    *          the dialog via `<Esc>` or the close header button.
    */
   static async show(document: fvtt.Folder, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {}): Promise<fvtt.RollTable | false | null>
   {
      if (!isFolder(document))
      {
         console.warn(`TJSFolderRolltable - show - warning: 'document' is not a Folder.`);
         return null;
      }

      return new TJSFolderRolltable(document, options, dialogData).wait();
   }
}
