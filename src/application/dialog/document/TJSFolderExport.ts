import { TJSDialog }             from '#runtime/svelte/application';
import { isFolder }              from '#runtime/types/fvtt-shim/guard';
import { localize }              from '#runtime/util/i18n';

import { TJSFolderExportComp }   from '#standard/component/fvtt-internal';

import type { SvelteApp }        from '#runtime/svelte/application';

/**
 * Provides a reactive dialog for exporting folders to a compendium that by default is modal and not draggable.
 */
export class TJSFolderExport extends TJSDialog
{
   /**
    * Shows a modal / non-draggable dialog to export a folder to an eligible compendium pack.
    *
    * @param document - Folder to export.
    *
    * @param [opts] - Additional options.
    *
    * @param [opts.pack] - The name of the compendium pack to provide an initial selection value in the dialog.
    *
    * @param [opts.merge=true] - Update existing entries in the Compendium pack, matching by name
    *
    * @param [opts.keepId=true] - Keep document IDs.
    *
    * @param [opts.options] - Rest of options to pass to TJSDialog / SvelteApp.
    *
    * @param {TJSDialog.OptionsData} [dialogData] - Optional data to modify dialog.
    */
   private constructor(document: fvtt.Folder, { pack, merge, keepId, ...options }:
    { pack?: string, merge?: boolean, keepId?: boolean } & Partial<SvelteApp.OptionsCore> = {},
     dialogData: TJSDialog.OptionsData = {})
   {
      super({}, options);

      // Get eligible pack destinations
      // @ts-ignore
      const packs = globalThis.game.packs.filter((p) => (p.documentName === document.type) &&
       !p.locked);

      if (!packs.length)
      {
         this.managedPromise.resolve(null);
         // @ts-ignore
         return globalThis.ui.notifications.warn(localize("FOLDER.ExportWarningNone", { type: document.type }));
      }

      this.data.replace({
         modal: typeof dialogData?.modal === 'boolean' ? dialogData.modal : true,
         draggable: typeof options?.draggable === 'boolean' ? options.draggable : false,
         focusKeep: true,
         minimizable: false,
         ...dialogData,
         content: {
            class: TJSFolderExportComp,
            props: {
               document,
               packName: pack,
               merge,
               keepId
            }
         },
         title: `${localize('FOLDER.ExportTitle')}: ${document.name}`,
         buttons: {
            export: {
               autoClose: false,
               icon: 'fas fa-atlas',
               label: 'FOLDER.ExportTitle',
               onPress: 'exportData'
            },
            cancel: {
               icon: 'fas fa-times',
               label: 'Cancel',
               onPress: (): boolean => false
            }
         },
         default: 'cancel'
      });
   }

   /**
    * Shows a modal / non-draggable dialog to export a folder to an eligible compendium pack.
    *
    * @param document - Folder to export.
    *
    * @param [opts] - Additional options.
    *
    * @param [opts.pack] - The name of the compendium pack to provide an initial selection value in the dialog.
    *
    * @param [opts.merge=true] - Update existing entries in the Compendium pack, matching by name
    *
    * @param [opts.keepId=true] - Keep document IDs.
    *
    * @param [opts.options] - Rest of options to pass to TJSDialog / SvelteApp.
    *
    * @param [dialogData] - Optional data to modify dialog.
    *
    * @returns The compendium collection the folder is exported to or a falsy value; either 'false' for cancelling or
    *          'null' if the user closed the dialog via `<Esc>` or the close header button.
    */
   static async show(document: fvtt.Folder, { pack, merge, keepId, ...options }:
    { pack?: string, merge?: boolean, keepId?: boolean } & Partial<SvelteApp.OptionsCore> = {},
     dialogData: TJSDialog.OptionsData = {}): Promise<fvtt.CompendiumCollection | false | null>
   {
      if (!isFolder(document))
      {
         console.warn(`TJSFolderExport - show - warning: 'document' is not a Folder.`);
         return null;
      }

      // Get eligible pack destinations if there are none then post a warning.
      // @ts-ignore
      const packs = globalThis.game.packs.filter((p) => (p.documentName === document.type) && !p.locked);
      if (!packs.length)
      {
         // @ts-ignore
         globalThis.ui.notifications.warn(localize('FOLDER.ExportWarningNone', { type: document.type }));
         return null;
      }

      return new TJSFolderExport(document, { pack, merge, keepId, ...options }, dialogData).wait();
   }
}
