<script>
   import { getContext }      from '#svelte';

   import { isDocumentClass } from '#runtime/types/fvtt-shim/guard';
   import { localize }        from '#runtime/util/i18n';

   import { selectOptions }   from './util.js';

   export let documentCls = void 0;
   export let data = {};
   export let parent = null;
   export let pack = null;
   export let renderSheet = true;

   const application = getContext('#external')?.application;

   const managedPromise = getContext('#managedPromise');

   let form;
   let defaultName, name, folderSelect, folders, hasTypes, type, types;

   if (!isDocumentClass(documentCls))
   {
      throw new TypeError(`TJSCreateDocument error: 'documentCls' is not a Document.`);
   }

   // Collect data
   const documentName = documentCls.metadata.name;
   const label = localize(documentCls.metadata.label);
   const allTypes = game.documentTypes[documentName].filter((t) => t !== globalThis.CONST?.BASE_DOCUMENT_TYPE);

   let collection;
   if (!parent)
   {
      collection = pack ? globalThis.game.packs.get(pack) : globalThis.game.collections.get(documentName);
   }

   folderSelect = data.folder || '';

   folders ??= collection?._formatFolderSelectOptions() ?? [];

   hasTypes = allTypes.length > 1;

   defaultName = documentCls.defaultName({ type, parent, pack });
   name = data.name || '';
   type = data.type || allTypes[0];

   types = allTypes.reduce((obj, t) =>
   {
      const typeLabel = globalThis.CONFIG[documentName]?.typeLabels?.[t] ?? t;
      obj[t] = globalThis.game.i18n.has(typeLabel) ? localize(typeLabel) : t;
      return obj;
   }, {});

   export function requestSubmit()
   {
      form.requestSubmit();
   }

   /**
    * Creates a new document from the form data.
    *
    * @returns {Promise<void>}
    */
   async function saveData(event)
   {
      const fd = new foundry.applications.ux.FormDataExtended(event.target);

      globalThis.foundry.utils.mergeObject(data, fd.object, { inplace: true });

      if (!data.folder) { delete data['folder']; }
      if (types.length === 1) { data.type = types[0]; }

      const document = await documentCls.create(data, { parent, pack, renderSheet });

      managedPromise.resolve(document);
      application.close();
   }
</script>

<svelte:options accessors={true}/>

<form bind:this={form}
      class="dialog-form standard-form"
      on:submit|preventDefault={saveData}
      autocomplete="off">
   <div class="form-group">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label>{localize('Name')}</label>
      <div class="form-fields">
         <input type="text" name="name" placeholder={defaultName} value={name} required/>
      </div>
   </div>

   {#if hasTypes}
      <div class="form-group">
         <!-- svelte-ignore a11y-label-has-associated-control -->
         <label>{localize('Type')}</label>
         <div class="form-fields">
            <select name="type">
               {@html selectOptions(types, {selected: type})}
            </select>
         </div>
      </div>
   {/if}

   {#if folders.length >= 1}
      <div class="form-group">
         <!-- svelte-ignore a11y-label-has-associated-control -->
         <label>{localize('DOCUMENT.Folder')}</label>
         <div class="form-fields">
            <select name="folder" bind:value={folderSelect}>
               <option value=""></option>
               {#each folders as folder}
                  <option value={folder.id}>{folder.name}</option>
               {/each}
            </select>
         </div>
      </div>
   {/if}
</form>
