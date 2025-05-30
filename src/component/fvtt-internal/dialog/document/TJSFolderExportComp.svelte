<script>
   import { getContext }   from '#svelte';

   import { TJSDocument }  from '#runtime/svelte/store/fvtt/document';
   import { isFolder }     from '#runtime/types/fvtt-shim/guard';
   import { localize }     from '#runtime/util/i18n';

   export let document = void 0;

   export let packName = void 0;
   export let merge = void 0;
   export let keepId = void 0;

   let selected;

   $: packName = typeof packName === 'string' ? packName : void 0;
   $: merge = typeof merge === 'boolean' ? merge : true;
   $: keepId = typeof keepId === 'boolean' ? keepId : true;

   const application = getContext('#external')?.application;

   const managedPromise = getContext('#managedPromise');

   if (!isFolder(document))
   {
      throw new TypeError(`TJSFolderExport error: 'document' is not an instance of Folder.`);
   }

   const doc = new TJSDocument(document, { delete: application.close.bind(application) });

   // Get eligible pack destinations
   let packs = globalThis.game.packs.filter(p => (p.documentName === document.type) && !p.locked);
   if (!packs.length)
   {
      globalThis.ui.notifications.warn(localize('FOLDER.ExportWarningNone', { type: document.type }));
      managedPromise.resolve(null);
      application.close();
   }

   selected = packs[0].metadata.name;

   // Configure any default pack by ID search.
   for (const pack of packs)
   {
      if (pack.title === packName) { selected = pack.metadata.name; }
   }

   $:
   {
      // Update the title if document name changes
      application.data.set('title', `${localize('FOLDER.ExportTitle')}: ${$doc.name}`);
   }

   /**
    * Export folder documents to compendium.
    *
    * @returns {Promise<globalThis.CompendiumCollection | boolean>}
    */
   export async function exportData()
   {
      // Find the pack; maybe it has been deleted or locked
      const pack = globalThis.game.packs.find(
       (p) => (p?.metadata?.package === 'world') && (p?.metadata?.name === selected));

      if (pack instanceof CompendiumCollection && !pack?.locked)
      {
         await document.exportToCompendium(pack, {
            updateByName: merge,
            keepId
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

<form on:submit|preventDefault={exportData} autocomplete=off>
    <p class=notes>{localize('FOLDER.ExportHint')}</p>
    <div class=form-group>
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label>{localize('FOLDER.ExportDestination')}</label>
        <select name=pack bind:value={selected}>
            {#each packs as pack (pack.id)}
                <option value={pack.metadata.name}>{pack.title}</option>
            {/each}
        </select>
    </div>
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
</form>
