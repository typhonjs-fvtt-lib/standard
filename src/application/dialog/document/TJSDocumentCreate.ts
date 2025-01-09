import { TJSDialog }             from '#runtime/svelte/application';

import {
   isDocumentClass,
   isFolderClass }               from '#runtime/types/fvtt-shim/guard';

import { localize }              from '#runtime/util/i18n';

import { TJSDocumentCreate
    as TJSDocumentCreateImpl }   from '#standard/component/fvtt-internal';

import type { SvelteApp }        from '#runtime/svelte/application';

/**
 * Provides a dialog for creating documents that by default is modal and not draggable.
 */
export class TJSDocumentCreate extends TJSDialog
{
   /**
    * Create a new Document of the type specified by `documentCls` by rendering a dialog window to provide basic
    * creation details.
    *
    * @param documentCls - Document class to create.
    *
    * @param [data] - Document data.
    *
    * @param [context] - Additional context options or dialog positioning options.
    *
    * @param [context.parent] - A parent Document within which these Documents should be embedded.
    *
    * @param [context.pack] - A Compendium pack identifier within which the Documents should be modified.
    *
    * @param [context.renderSheet] - Render the sheet for the new document.
    *
    * @param [context.options] - Rest of options to pass to TJSDialog / Application.
    *
    * @param [dialogData] - Optional data to modify dialog.
    */
   private constructor(documentCls: fvtt.DocumentConstructor, data: object = {}, { parent = null, pack = null,
    renderSheet = true, ...options }: { parent?: object | null, pack?: string | null, renderSheet?: boolean } &
     SvelteApp.OptionsCore = {}, dialogData: TJSDialog.OptionsData = {})
   {
      super({
         modal: typeof dialogData?.modal === 'boolean' ? dialogData.modal : true,
         draggable: typeof options?.draggable === 'boolean' ? options.draggable : false,
         focusFirst: true,
         focusKeep: true,
         minimizable: false,
         ...dialogData,
         content: {
            class: TJSDocumentCreateImpl,
            props: {
               documentCls,
               data,
               parent,
               pack,
               renderSheet
            }
         },
         title: localize('DOCUMENT.Create', { type: localize(documentCls?.metadata?.label) }),
         buttons: {
            create: {
               autoClose: false,
               icon: 'fas fa-check',
               label: localize('DOCUMENT.Create', { type: localize(documentCls?.metadata?.label) }),
               onPress: 'requestSubmit'
            }
         },
         default: 'create'
      }, { width: 320, ...options });
   }

   /**
    * Create a new Document of the type specified by `documentCls` by rendering a dialog window to provide basic
    * creation details.
    *
    * @param documentCls - Document class to create.
    *
    * @param [data] - Document data.
    *
    * @param [context={}] - Additional context options or dialog positioning options.
    *
    * @param [context.parent] - A parent Document within which these Documents should be embedded.
    *
    * @param [context.pack] - A Compendium pack identifier within which the Documents should be modified.
    *
    * @param [context.renderSheet] - Render the sheet for the new document.
    *
    * @param [context.options] - Rest of options to pass to TJSDialog / SvelteApp.
    *
    * @param [dialogData] - Optional data to modify dialog.
    *
    * @returns The newly created document or a falsy value; either 'false' for
    *          cancelling or 'null' if the user closed the dialog via `<Esc>` or the close header button.
    */
   static async show<D extends fvtt.DocumentConstructor>(documentCls: D, data: object = {}, { parent = null,
    pack = null, renderSheet = true, ...options }: { parent?: fvtt.Document | null, pack?: string | null,
     renderSheet?: boolean } & Partial<SvelteApp.OptionsCore> = {}, dialogData: TJSDialog.OptionsData = {}):
      Promise<InstanceType<D> | false | null>
   {
      if (!isDocumentClass(documentCls))
      {
         console.warn(`TJSDocumentCreate - show - warning: 'documentCls' is not a Document.`);
         return null;
      }

      if (isFolderClass(documentCls))
      {
         console.warn(`TJSDocumentCreate - show - warning: 'documentCls' is a Folder.`);
         return null;
      }

      return new TJSDocumentCreate(documentCls, data, { parent, pack, renderSheet, ...options }, dialogData).wait();
   }
}
