<script>
   import { getContext }   from '#svelte';

   import { TJSDocument }  from '#runtime/svelte/store/fvtt/document';
   import { localize }     from '#runtime/util/i18n';

   /** @type {foundry.abstract.Document} */
   export let document = void 0;

   const application = getContext('#external')?.application;

   if (!(document instanceof globalThis.foundry.abstract.Document))
   {
      throw new TypeError(`TJSDocumentDelete error: 'document' is not an instance of Document.`);
   }

   const doc = new TJSDocument(document, { delete: application.close.bind(application) });

   let type = localize(document.constructor.metadata.label);

   $: if ($doc !== document)
   {
      if (!(document instanceof globalThis.foundry.abstract.Document))
      {
         throw new TypeError(`TJSDocumentDelete error: 'document' is not an instance of Document.`);
      }

      doc.set(document);

      const name = document?.id ? document.name : '';
      type = localize(document.constructor.metadata.label);

      application.data.set('title', `${localize('DOCUMENT.Delete', { type })}: ${name}`);
   }

   /**
    * Handles the button click for 'Yes'.
    *
    * @returns {Promise<void>}
    */
   export async function deleteDocument()
   {
      // Remove the delete Document function callback as we are intentionally deleting below.
      doc.setOptions({ delete: void 0 });

      return document.delete();
   }
</script>

<svelte:options accessors={true}/>

<h4>{localize('AreYouSure')}</h4>
<p>{localize('SIDEBAR.DeleteWarning', { type })}</p>
