import { TJSDialog }                from '#runtime/svelte/application';
import { isDocument }               from '#runtime/types/fvtt-shim/guard';
import { localize }                 from '#runtime/util/i18n';
import { hasSetter }                from '#runtime/util/object';

import { TJSDocumentOwnershipComp } from '#standard/component/fvtt-internal';

import type { SvelteApp }           from '#runtime/svelte/application';

/**
 * Provides a reactive dialog for permission control that by default is modal and not draggable. An additional set of
 * accessors for the document assigned are available via the `this.reactive.document`. You may swap out the document at
 * any time by setting it to a different document.
 */
export class TJSDocumentOwnership extends TJSDialog
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
         focusFirst: true,
         focusKeep: true,
         minimizable: false,
         ...dialogData,
         content: {
            class: TJSDocumentOwnershipComp,
            props: { document }
         },
         title: `${localize('OWNERSHIP.Title', { object: document.name })}`,
         buttons: {
            save: {
               autoClose: false,
               icon: 'fa-solid fa-floppy-disk',
               label: 'Save Changes',
               onPress: 'requestSubmit'
            }
         },
         default: 'save'
      }, { headerIcon: 'fa-fw fa-solid fa-file-lock', ...options });

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
    * Change permissions of a document by rendering a dialog to alter the default and all user / player permissions.
    *
    * @param document - Document instance to modify.
    *
    * @param [options] - Options to pass to TJSDialog / Application.
    *
    * @param [dialogData] - Optional data to modify dialog.
    *
    * @returns The modified document or 'null' if the user closed the dialog via `<Esc>` or the close header button.
    */
   static async show<D extends fvtt.Document>(document: D, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {}): Promise<D | null>
   {
      if (!isDocument(document))
      {
         console.warn(`TJSDocumentOwnership - show - warning: 'document' is not a Document.`);
         return null;
      }

      return new TJSDocumentOwnership(document, options, dialogData).wait();
   }
}
