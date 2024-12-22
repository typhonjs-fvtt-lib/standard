import { TJSDialog }             from '#runtime/svelte/application';
import { localize }              from '#runtime/util/i18n';
import { hasSetter }             from '#runtime/util/object';

import { TJSDocumentDelete
    as TJSDocumentDeleteImpl }   from '#standard/component/fvtt-internal';

/**
 * Provides a reactive dialog for deleting documents that by default is modal and not draggable. An additional set of
 * accessors for the document assigned are available via the `this.reactive.document`. You may swap out the document at
 * any time by setting it to a different document.
 */
export class TJSDocumentDelete extends TJSDialog
{
   /**
    * @param {foundry.abstract.Document} document - Document to delete.
    *
    * @param {object} [opts] - Additional context options or dialog positioning options.
    *
    * @param {object} [opts.context] - DocumentModificationContext.
    *
    * @param {import('#runtime/svelte/application').SvelteApp.OptionsCore} [opts.options] - Rest of options to pass to TJSDialog / Application.
    *
    * @param {import('#runtime/svelte/application').TJSDialogOptions} [dialogData] - Optional data to modify dialog.
    * 
    * @private
    */
   constructor(document, { context = {}, ...options } = {}, dialogData = {})
   {
      super({
         modal: typeof dialogData?.modal === 'boolean' ? dialogData.modal : true,
         draggable: typeof options?.draggable === 'boolean' ? options.draggable : false,
         focusKeep: true,
         minimizable: false,
         ...dialogData,
         content: {
            class: TJSDocumentDeleteImpl,
            props: { document, context }
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

      /**
       * @member {object} context - Adds accessors to SvelteReactive to get / set the DocumentModificationContext
       *                            associated with Document.
       *
       * @memberof SvelteReactive#
       */
      Object.defineProperty(this.reactive, 'context', {
         get: () => this.svelte?.dialogComponent?.context,
         set: (context) => // eslint-disable-line no-shadow
         {
            const dialogComponent = this.svelte.dialogComponent;
            if (hasSetter(dialogComponent, 'context')) { dialogComponent.context = context; }
         }
      });
   }

   /**
    * Shows a modal / non-draggable dialog to delete a document.
    *
    * @param {foundry.abstract.Document} document - Document to delete.
    *
    * @param {object} [opts] - Additional context options or dialog positioning options.
    *
    * @param {object} [opts.context] - DocumentModificationContext.
    *
    * @param {import('#runtime/svelte/application').SvelteApp.OptionsCore} [opts.options] - Rest of options to pass to
    *        TJSDialog / Application.
    *
    * @param {import('#runtime/svelte/application').TJSDialogOptions} [dialogData] - Optional data to modify dialog.
    *
    * @returns {Promise<foundry.abstract.Document|boolean|null>} The document if deleted or a falsy value; either
    *          'false' for cancelling or 'null' if the user closed the dialog via `<Esc>` or the close header button.
    */
   static async show(document, { context = {}, ...options } = {}, dialogData = {})
   {
      if (!(document instanceof globalThis.foundry.abstract.Document))
      {
         console.warn(`TJSDocumentDelete - show - warning: 'document' is not a Document.`);
         return null;
      }

      if (document instanceof Folder)
      {
         console.warn(`TJSDocumentDelete - show - warning: 'document' is a Folder.`);
         return null;
      }

      return new TJSDocumentDelete(document, { context, ...options }, dialogData).wait();
   }
}
