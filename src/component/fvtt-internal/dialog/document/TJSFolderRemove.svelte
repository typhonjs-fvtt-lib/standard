<script>
   import { getContext }    from '#svelte';

   import { TJSDocument }   from '#runtime/svelte/store/fvtt/document';
   import { localize }      from '#runtime/util/i18n';

   export let document = void 0;

   const application = getContext('#external')?.application;

   if (!(document instanceof Folder))
   {
      throw new TypeError(`TJSFolderRemove error: 'document' is not an instance of Folder.`);
   }

   const doc = new TJSDocument(document, { delete: application.close.bind(application) });

   $: if ($doc !== document)
   {
      if (!(document instanceof Folder))
      {
         throw new TypeError(`TJSFolderRemove error: 'document' is not an instance of Folder.`);
      }

      doc.set(document);

      application.data.set('title', `${localize('FOLDER.Remove')}: ${document.name}`);
   }

   /**
    * Removes a folder without deleting documents.
    *
    * @returns {Promise<globalThis.Folder>}
    */
   export async function removeFolder()
   {
      // Remove the delete Document function callback as we are intentionally deleting below.
      doc.setOptions({ delete: void 0 });

      return document.delete({ deleteSubfolders: false, deleteContents: false });
   }
</script>

<svelte:options accessors={true}/>

<h4>{localize('AreYouSure')}</h4>
<p>{localize('FOLDER.RemoveWarning')}</p>
