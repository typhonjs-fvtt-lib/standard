import { TJSDialog }             from '#runtime/svelte/application';

import {
   isDocument,
   isFolder }                    from '#runtime/types/fvtt-shim/guard';

import { localize }              from '#runtime/util/i18n';
import { hasSetter }             from '#runtime/util/object';

import { TJSDocumentImport
    as TJSDocumentImportImpl }   from '#standard/component/fvtt-internal';

import type { SvelteApp }        from '#runtime/svelte/application';

/**
 * Provides a reactive dialog for importing documents that by default is modal and not draggable. An additional set of
 * accessors for the document assigned are available via the `this.reactive.document`. You may swap out the document at
 * any time by setting it to a different document.
 */
export class TJSDocumentImport extends TJSDialog
{
   /**
    * Render an import dialog for updating the data related to this Document through an exported JSON file
    *
    * @param document - The document to import JSON to...
    *
    * @param [options] - Options to pass to TJSDialog /
    *        Application.
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
         title: `${localize('DOCUMENT.ImportData')}: ${document.name}`,
         content: {
            class: TJSDocumentImportImpl,
            props: { document }
         },
         buttons: {
            import: {
               autoClose: false, // Don't automatically close on button onclick.
               icon: 'fas fa-file-import',
               label: 'Import',
               onPress: 'requestSubmit'
            },
            cancel: {
               icon: 'fas fa-times',
               label: 'Cancel',
               onPress: (): boolean => false
            }
         },
         default: 'cancel'
      }, { width: 400, ...options });

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
    * Render an import dialog for updating the data related to this Document through an exported JSON file
    *
    * @param document - The document to import JSON to...
    *
    * @param [options] - Options to pass to TJSDialog / SvelteApp.
    *
    * @param [dialogData] - Optional data to modify dialog.
    *
    * @returns The document after import completes or a falsy value; either 'false' for cancelling or 'null' if the
    *          user closed the dialog via `<Esc>` or the close header button.
    */
   static async show<D extends fvtt.Document>(document: D, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {}): Promise<D | false | null>
   {
      if (!isDocument(document))
      {
         console.warn(`TJSDocumentImport - show - warning: 'document' is not a Document.`);
         return null;
      }

      if (isFolder(document))
      {
         console.warn(`TJSDocumentImport - show - warning: 'document' is a Folder; unsupported operation'.`);
         return null;
      }

      return new TJSDocumentImport(document, options, dialogData).wait();
   }
}
