<script>
   import { getContext }   from '#svelte';

   import { TJSDocument }  from '#runtime/svelte/store/fvtt/document';
   import { isFolder }     from '#runtime/types/fvtt-shim/guard';
   import { localize }     from '#runtime/util/i18n';

   export let document = void 0;

   const application = getContext('#external')?.application;

   if (!isFolder(document))
   {
      throw new TypeError(`TJSFolderDelete error: 'document' is not an instance of Folder.`);
   }

   const doc = new TJSDocument(document, { delete: application.close.bind(application) });

   $: if ($doc !== document)
   {
      if (!isFolder(document))
      {
         throw new TypeError(`TJSFolderDelete error: 'document' is not an instance of Folder.`);
      }

      doc.set(document);

      application.data.set('title', `${localize('FOLDER.Delete')}: ${document.name}`);
   }

   /**
    * Removes a folder with deleting documents.
    *
    * @returns {Promise<fvtt.Folder>}
    */
   export async function deleteFolder()
   {
      // Remove the delete Document function callback as we are intentionally deleting below.
      doc.setOptions({ delete: void 0 });

      return document.delete({ deleteSubfolders: true, deleteContents: true });
   }
</script>

<svelte:options accessors={true}/>

<h4>{localize('AreYouSure')}</h4>
<p>{localize('FOLDER.DeleteWarning')}</p>
