<script>
   import { getContext }      from '#svelte';

   import { TJSDocument }     from '#runtime/svelte/store/fvtt/document';

   import {
      isDocument,
      isFolder }              from '#runtime/types/fvtt-shim/guard';

   import { localize }        from '#runtime/util/i18n';

   import { selectOptions }   from './util.js';

   export let document = void 0;

   const application = getContext('#external')?.application;

   const managedPromise = getContext('#managedPromise');

   if (!isDocument(document))
   {
      throw new TypeError(`TJSOwnershipControl error: 'document' is not an instance of Document.`);
   }

   const doc = new TJSDocument(document, { delete: application.close.bind(application) });

   let form, instructions;
   let currentDefault, defaultLevels, playerLevels, users;
   let isFolderInst = isFolder(document);
   let isEmbedded = document.isEmbedded;
   let ownership = document.ownership;

   let showGM = false;

   if (!ownership && !isFolderInst)
   {
      throw new Error(`The ${document.documentName} document does not contain ownership data`);
   }

   $: if ($doc !== document)
   {
      if (!isDocument(document))
      {
         throw new TypeError(`TJSOwnershipControl error: 'document' is not an instance of Document.`);
      }

      doc.set(document);

      application.data.set('title', localize('OWNERSHIP.Title', { object: document.name }));
   }

   $: {
      isFolderInst = isFolder($doc);
      isEmbedded = $doc.isEmbedded;
      ownership = $doc.ownership;

      if (!ownership && !isFolderInst)
      {
         throw new Error(`The ${$doc?.documentName} document does not contain ownership data`);
      }

      instructions = localize(isFolderInst ? 'OWNERSHIP.HintFolder' : 'OWNERSHIP.HintDocument');

      ({ currentDefault, defaultLevels, playerLevels, users } = getData());
   }

   /**
    * Builds the data for the permission dialog from the document.
    */
   function getData()
   {
      // User permission levels
      const playerLevels = Object.entries(globalThis.CONST.DOCUMENT_META_OWNERSHIP_LEVELS).map(([name, level]) =>
      {
         return { level, label: localize(`OWNERSHIP.${name}`) };
      });

      if (!isFolderInst) { playerLevels.pop(); }

      for (const [name, level] of Object.entries(globalThis.CONST.DOCUMENT_OWNERSHIP_LEVELS))
      {
         if ((level < 0) && !isEmbedded) { continue; }

         playerLevels.push({ level, label: localize(`OWNERSHIP.${name}`) });
      }

      // Default permission levels
      const defaultLevels = globalThis.foundry.utils.deepClone(playerLevels);
      defaultLevels.shift();

      const docAuthor = $doc?.author;

      // Player users
      const users = game.users.map((user) =>
      ({
         user,
         level: isFolderInst ? globalThis.CONST.DOCUMENT_META_OWNERSHIP_LEVELS.NOCHANGE : ownership[user.id],
         isAuthor: docAuthor === user,
         isGM: user.isGM,
         cssClass: user.isGM ? 'gm' : ''
      })).sort((a, b) => a.user.name.localeCompare(b.user.name, game.i18n.lang));

      // Construct and return the data object
      return {
         currentDefault: $doc?.ownership?.default ?? globalThis.CONST.DOCUMENT_META_OWNERSHIP_LEVELS.DEFAULT,
         defaultLevels,
         playerLevels,
         users
      };
   }

   export function requestSubmit()
   {
      form.requestSubmit();
   }

   /**
    * Saves any form data / changes to document.
    *
    * @returns {Promise<void>}
    */
   async function saveData(event)
   {
      if (!isDocument($doc)) { return; }

      const formData = new globalThis.foundry.applications.ux.FormDataExtended(event.target).object;

      // Collect new ownership levels from the form data
      const metaLevels = globalThis.CONST.DOCUMENT_META_OWNERSHIP_LEVELS;
      const omit = isFolderInst ? metaLevels.NOCHANGE : metaLevels.DEFAULT;
      const ownershipLevels = {};
      for (const [user, level] of Object.entries(formData))
      {
         if (level === omit)
         {
            delete ownershipLevels[user];
            continue;
         }
         ownershipLevels[user] = level;
      }

      // Update all documents in a Folder
      if (isFolder($doc))
      {
         const cls = globalThis.getDocumentClass($doc.type);
         const updates = $doc.contents.map((d) =>
         {
            const ownership = globalThis.foundry.utils.deepClone(d.ownership);

            for (const [k, v] of Object.entries(ownershipLevels))
            {
               if (v === metaLevels.DEFAULT) { delete ownership[k]; }
               else { ownership[k] = v; }
            }

            return { _id: d.id, ownership };
         });

         await cls.updateDocuments(updates, { diff: false, recursive: false, noHook: true });

         managedPromise.resolve($doc);
         application.close();
         return;
      }

      // Update a single Document
      await $doc.update({ ownership: ownershipLevels }, { diff: false, recursive: false, noHook: true });

      managedPromise.resolve($doc);
      application.close();
   }
</script>

<svelte:options accessors={true}/>

<form bind:this={form}
      class="document-ownership standard-form"
      on:submit|preventDefault={saveData}>
   <p class=instructions>{instructions}</p>

   <div class=form-group>
      <div class=form-fields>
         <label class=checkbox>
            {localize('OWNERSHIP.ShowGM')}
            <input type=checkbox bind:checked={showGM}>
         </label>
      </div>
   </div>

   <div class=form-group>
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label>{localize('OWNERSHIP.AllPlayers')}</label>
      <select name=default data-dtype=Number>
         {@html selectOptions(defaultLevels, { selected: currentDefault, nameAttr: 'level', labelAttr: 'label' })}
      </select>
   </div>

   <hr>

   <main>
      {#each users as data (data.user.id)}
         <div class=form-group class:hidden={!showGM && data.isGM}>
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label>
               {data.user.name}
               {#if data.isGM}
                  <i class="role-icon fa-solid fa-crown fa-fw" data-tooltip="USER.RoleGamemaster"></i>
               {/if}
            </label>
            {#if data.isAuthor}
               <div class=author>{localize('Author')}</div>
            {:else}
               <select name={data.user.id} data-dtype=Number>
                  {@html selectOptions(playerLevels, { selected: data.level, nameAttr: 'level', labelAttr: 'label' })}
               </select>
            {/if}
         </div>
      {/each}
   </main>
</form>

<style>
   hr {
      margin: 0;
   }

   main {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      max-height: 360px;
      overflow-y: auto;
   }
</style>
