<script>
   import { getContext }   from '#svelte';

   import { TJSDocument }  from '#runtime/svelte/store/fvtt/document';
   import { isDocument }   from '#runtime/types/fvtt-shim/guard';
   import { localize }     from '#runtime/util/i18n';

   /** @type {fvtt.ClientDocument} */
   export let document = void 0;

   const application = getContext('#external')?.application;

   const managedPromise = getContext('#managedPromise');

   if (!isDocument(document))
   {
      throw new TypeError(`TJSDocumentImport error: 'document' is not an instance of Document.`);
   }

   const doc = new TJSDocument(document, { delete: application.close.bind(application) });

   let form;

   let hint1 = localize('DOCUMENT.ImportDataHint1', { document: document.documentName });
   let hint2 = localize('DOCUMENT.ImportDataHint2', { name: document.name });

   $: if ($doc !== document)
   {
      if (!isDocument(document))
      {
         throw new TypeError(`TJSDocumentImport error: 'document' is not an instance of Document.`);
      }

      doc.set(document);

      hint1 = localize('DOCUMENT.ImportDataHint1', { document: document.documentName });
      hint2 = localize('DOCUMENT.ImportDataHint2', { name: document.name });

      application.data.set('title', `${localize('DOCUMENT.ImportData')}: ${document.name}`);
   }

   async function handleImport()
   {
      if (!form.data.files.length) { return globalThis.ui.notifications.error('You did not upload a data file!'); }

      const json = await readTextFromFile(form.data.files[0]);

      const importedDoc = await document.importFromJSON(json);

      managedPromise.resolve(importedDoc);
      application.close();
   }

   export function requestSubmit()
   {
      form.requestSubmit();
   }
</script>

<svelte:options accessors={true}/>

<form bind:this={form}
      class="dialog-form standard-form"
      on:submit|preventDefault={handleImport}
      autocomplete=off>

   <div class="dialog-content standard-form">
      <p class=hint>{hint1}</p>
      <p class=hint>{hint2}</p>
      <div class=form-group>
         <label for=data>{localize('DOCUMENT.ImportSource')}</label>
         <div class=form-fields>
            <input type=file name=data required>
         </div>
      </div>
   </div>
</form>
