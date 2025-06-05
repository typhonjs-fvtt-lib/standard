import { TJSDocumentCreate }     from './TJSDocumentCreate';
import { TJSDocumentDelete }     from './TJSDocumentDelete';
import { TJSDocumentImport }     from './TJSDocumentImport';
import { TJSDocumentOwnership }  from './TJSDocumentOwnership';
import { TJSFolderCreateUpdate } from './TJSFolderCreateUpdate';
import { TJSFolderDelete }       from './TJSFolderDelete';
import { TJSFolderExport }       from './TJSFolderExport';
import { TJSFolderRemove }       from './TJSFolderRemove';
import { TJSFolderRolltable }    from './TJSFolderRolltable';

import type {
   SvelteApp,
   TJSDialog }                   from '#runtime/svelte/application';

/**
 * Provides several methods to create documents, folders, and modify them through use of TJSDialog and a modal and
 * non-draggable by default user experience.
 */
export class TJSDocumentDialog
{
   private constructor() {}

   /**
    * Change ownership of a document by rendering a dialog to alter the default and all user / player ownership.
    *
    * @param document - Document instance to modify.
    *
    * @param [options] - Rest of options to pass to TJSDialog / SvelteApp.
    *
    * @param [dialogData] - Optional data to modify dialog.
    *
    * @returns The modified document or 'null' if the user closed the dialog via `<Esc>` or the close header button.
    */
   static async configureOwnership<D extends fvtt.Document>(document: D, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {}): Promise<D | null>
   {
      return TJSDocumentOwnership.show<D>(document, options, dialogData);
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
    * @returns The newly created document or a falsy value; either 'false' for cancelling or 'null' if the user closed
    *          the dialog via `<Esc>` or the close header button.
    */
   static async documentCreate<D extends fvtt.DocumentConstructor>(documentCls: D, data: object = {}, { parent = null,
    pack = null, renderSheet = true, ...options }: { parent?: fvtt.Document | null, pack?: string | null,
     renderSheet?: boolean } & Partial<SvelteApp.OptionsCore> = {}, dialogData: TJSDialog.OptionsData = {}):
      Promise<InstanceType<D> | false | null>
   {
      return TJSDocumentCreate.show<D>(documentCls, data, { parent, pack, renderSheet, ...options }, dialogData);
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
   static async documentDelete<D extends fvtt.Document>(document: D, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {}): Promise<D | false | null>
   {
      return TJSDocumentDelete.show<D>(document, options, dialogData);
   }

   /**
    * Create a new Folder by rendering a dialog to provide basic creation details.
    *
    * @param folderData - Initial data with which to populate the creation form.
    *
    * @param [options] - Options to pass to TJSDialog / SvelteApp.
    *
    * @param [dialogData] - Optional data to modify dialog.
    *
    * @returns The newly created Folder or null if the dialog is closed.
    */
   static async folderCreate(folderData: { folder?: string, type: string }, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {}): Promise<fvtt.Folder | null>
   {
      return TJSFolderCreateUpdate.showCreate(folderData, options, dialogData);
   }

   /**
    * Deletes a folder and does delete subfolders / documents.
    *
    * @param document - Folder to delete.
    *
    * @param [options] - Options to pass to TJSDialog / SvelteApp.
    *
    * @param [dialogData] - Optional data to modify dialog.
    *
    * @returns The deleted Folder or a falsy value; either 'false' for cancelling or 'null' if the user closed the
    *          dialog via `<Esc>` or the close header button.
    */
   static async folderDelete(document: fvtt.Folder, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {}): Promise<fvtt.Folder | null>
   {
      return TJSFolderDelete.show(document, options, dialogData);
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
   static async folderExport(document: fvtt.Folder, { pack, merge, keepId, ...options }:
    { pack?: string, merge?: boolean, keepId?: boolean } & Partial<SvelteApp.OptionsCore> = {},
     dialogData: TJSDialog.OptionsData = {}): Promise<fvtt.CompendiumCollection | false | null>
   {
      return TJSFolderExport.show(document, { pack, merge, keepId, ...options }, dialogData);
   }

   /**
    * Removes a folder, but does not delete / remove sub-folders / documents.
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
   static async folderRemove(document: fvtt.Folder, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {}): Promise<fvtt.Folder | false | null>
   {
      return TJSFolderRemove.show(document, options, dialogData);
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
   static async folderRolltable(document: fvtt.Folder, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {}): Promise<fvtt.RollTable | false | null>
   {
      return TJSFolderRolltable.show(document, options, dialogData);
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
   static async folderUpdate(document: fvtt.Folder, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {}): Promise<fvtt.Folder | null>
   {
      return TJSFolderCreateUpdate.showUpdate(document, options, dialogData);
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
   static async importFromJSON<D extends fvtt.Document>(document: D, options: SvelteApp.OptionsCore = {},
    dialogData: TJSDialog.OptionsData = {}): Promise<D | false | null>
   {
      return TJSDocumentImport.show<D>(document, options, dialogData);
   }
}
