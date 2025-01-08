import { TJSDialog }             from '#runtime/svelte/application';
import { localize }              from '#runtime/util/i18n';
import { hasSetter }             from '#runtime/util/object';

import { TJSFolderRolltable
    as TJSFolderRolltableImpl }  from '#standard/component/fvtt-internal';

/**
 * Provides a reactive dialog for creating a RollTable from a folder that by default is modal and not draggable. An
 * additional set of accessors for the folder assigned are available via the `this.reactive.document`. You may swap out
 * the folder at any time by setting it to a different folder document.
 */
export class TJSFolderRolltable extends TJSDialog
{
   /**
    * @param {fvtt.Folder} document - Folder to create roll table from...
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
            class: TJSFolderRolltableImpl,
            props: { document }
         },
         title: `${localize('FOLDER.CreateTable')}: ${document.name}`,
         buttons: {
            create: {
               icon: `${CONFIG.RollTable.sidebarIcon}`,
               label: 'FOLDER.CreateTable',
               onPress: 'createTable'
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
    * Create a RollTable from the contents of the Folder.
    *
    * @param {fvtt.Folder} document - Folder to create roll table from...
    *
    * @param {import('#runtime/svelte/application').SvelteApp.OptionsCore} [options] - Options to pass to TJSDialog /
    *        Application.
    *
    * @param {import('#runtime/svelte/application').TJSDialogOptions} [dialogData] - Optional data to modify dialog.
    *
    * @returns {Promise<globalThis.RollTable|boolean|null>} The newly created RollTable or a falsy value; either
    *          'false' for cancelling or 'null' if the user closed the dialog via `<Esc>` or the close header button.
    */
   static async show(document, options = {}, dialogData = {})
   {
      if (!(document instanceof Folder))
      {
         console.warn(`TJSFolderRolltable - show - warning: 'document' is not a Folder.`);
         return null;
      }

      return new TJSFolderRolltable(document, options, dialogData).wait();
   }
}
