<script>
   import { getContext }   from '#svelte';

   import { TJSDocument }  from '#runtime/svelte/store/fvtt/document';
   import { isFolder }     from '#runtime/types/fvtt-shim/guard';
   import { localize }     from '#runtime/util/i18n';

   export let document = void 0;

   export let packName = void 0;
   export let merge = void 0;
   export let keepId = void 0;
   export let keepFolders = void 0;

   // Selected pack ID.
   let selectedPackId;

   // Any associated folder ID of the selected pack.
   let selectFolderId;

   $: packName = typeof packName === 'string' ? packName : void 0;
   $: merge = typeof merge === 'boolean' ? merge : true;
   $: keepId = typeof keepId === 'boolean' ? keepId : true;
   $: keepFolders = typeof keepFolders === 'boolean' ? keepFolders : true;

   const application = getContext('#external')?.application;

   const managedPromise = getContext('#managedPromise');

   if (!isFolder(document))
   {
      throw new TypeError(`TJSFolderExport error: 'document' is not an instance of Folder.`);
   }

   const doc = new TJSDocument(document, { delete: application.close.bind(application) });

   // Get eligible pack destinations.
   let packs = getPacks();

   /**
    * Stores the folder data of the selected pack.
    *
    * @type {{ id: string, name: string }[]}
    */
   let folders = [];

   // Automatically select first pack.
   selectedPackId = packs[0].collection;

   // Configure any default selected pack by name search.
   for (const pack of packs)
   {
      if (pack.title === packName) { selectedPackId = pack.collection; }
   }

   $:
   {
      // Update the title if document name changes
      application.data.set('title', `${localize('FOLDER.Export')}: ${$doc.name}`);
   }

   $:
   {
      // When selected pack changes retrieve folder data formatted for select options.
      folders = globalThis.game.packs.get(selectedPackId)?._formatFolderSelectOptions() ?? [];

      if (folders.length)
      {
         // Add empty entry with no folder ID.
         folders.unshift({ id: void 0, name: `<${localize('TYPES.Base')}>` });
      }

      // Reset selected folder ID.
      selectFolderId = void 0;
   }

   /**
    * Retrieves all unlocked world collection / packs that match the given `document` type. If there are no valid
    * packs, post UI warning and close dialog.
    */
   function getPacks()
   {
      const unlockedPacks = globalThis.game.packs.filter((p) => (p.documentName === document.type) && !p.locked);

      // Abort if no valid packs exist.
      if (!unlockedPacks.length)
      {
         globalThis.ui.notifications.warn(localize('FOLDER.ExportWarningNone', { type: document.type }));
         managedPromise.resolve(null);
         application.close();
      }

      return unlockedPacks;
   }

   /**
    * Export folder documents to compendium.
    *
    * @returns {Promise<globalThis.CompendiumCollection | boolean>}
    */
   export async function exportData()
   {
      const pack = globalThis.game.packs.get(selectedPackId);

      if (!pack?.locked)
      {
         await document.exportToCompendium(pack, {
            updateByName: merge,
            keepId,
            keepFolders,
            folder: selectFolderId
         });

         managedPromise.resolve(pack);
      }
      else
      {
         managedPromise.resolve(false);
      }

      application.close();
   }
</script>

<svelte:options accessors={true}/>

<form class="dialog-form standard-form"
      on:submit|preventDefault={exportData}
      autocomplete=off>
   <p class=hint>{localize('FOLDER.ExportHint')}</p>
   <div class=form-group>
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label>{localize('FOLDER.ExportDestination')}</label>
      <select bind:value={selectedPackId}>
         {#each packs as pack (pack.collection)}
            <option value={pack.collection}>{pack.title}</option>
         {/each}
      </select>
   </div>

   {#if folders.length}
   <div class=form-group>
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label>{localize('DOCUMENT.Folder')}</label>
      <!-- change event for non-reactive setting of folder ID -->
      <select on:change={(event) => selectFolderId = event.target.value}>
         {#each folders as folder (folder.id)}
            <option value={folder.id}>{folder.name}</option>
         {/each}
      </select>
   </div>
   {/if}

   <fieldset>
      <legend>{localize('FOLDER.ExportOptions')}</legend>
      <div class=form-group>
         <!-- svelte-ignore a11y-label-has-associated-control -->
         <label>{localize('FOLDER.ExportMerge')}</label>
         <input type=checkbox name=merge bind:checked={merge}/>
      </div>
      <div class=form-group>
         <!-- svelte-ignore a11y-label-has-associated-control -->
         <label>{localize('FOLDER.ExportKeepId')}</label>
         <input type=checkbox name=keepId bind:checked={keepId}/>
      </div>
      <div class="form-group">
         <!-- svelte-ignore a11y-label-has-associated-control -->
         <label>{localize('FOLDER.ExportKeepFolders')}</label>
         <input type=checkbox name=keepFolders bind:checked={keepFolders}>
      </div>
   </fieldset>
</form>
