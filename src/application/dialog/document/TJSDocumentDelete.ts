import { TJSDialog }             from '#runtime/svelte/application';

import {
   isDocument,
   isFolder }                    from '#runtime/types/fvtt-shim/guard';

import { localize }              from '#runtime/util/i18n';
import { hasSetter }             from '#runtime/util/object';

import { TJSDocumentDelete
    as TJSDocumentDeleteImpl }   from '#standard/component/fvtt-internal';

import type { SvelteApp }        from '#runtime/svelte/application';

/**
 * Provides a reactive dialog for deleting documents that by default is modal and not draggable. An additional set of
 * accessors for the document assigned are available via the `this.reactive.document`. You may swap out the document at
 * any time by setting it to a different document.
 */
export class TJSDocumentDelete extends TJSDialog
{
   /**
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
            class: TJSDocumentDeleteImpl,
            props: { document }
         },
         title: `${localize('DOCUMENT.Delete', { type: localize(document.constructor.metadata.label) })}: ${
          document.name}`,
         buttons: {
            delete: {
               icon: 'fas fa-trash',
               label: localize('DOCUMENT.Delete', { type: localize(document.constructor.metadata.label) }),
               onPress: 'deleteDocument'
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
    * Shows a modal / non-draggable dialog to delete a document.
    *
    * @param document - Document to delete.
    *
    * @param [options] - TJSDialog / SvelteApp options.
    *
    * @param [dialogData] - Optional data to modify dialog.
    *
    * @returns The document if deleted or a falsy value; either 'false' for cancelling or 'null' if the user closed the
    *          dialog via `<Esc>` or the close header button.
    */
   static async show<D extends fvtt.Document>(document: D, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {}): Promise<D | false | null>
   {
      if (!isDocument(document))
      {
         console.warn(`TJSDocumentDelete - show - warning: 'document' is not a Document.`);
         return null;
      }

      if (isFolder(document))
      {
         console.warn(`TJSDocumentDelete - show - warning: 'document' is a Folder.`);
         return null;
      }

      return new TJSDocumentDelete(document, options, dialogData).wait();
   }
}
