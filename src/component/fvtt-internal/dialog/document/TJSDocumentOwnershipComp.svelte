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

      const title = localize('OWNERSHIP.Title');

      application.data.set('title', `${title}: ${document.name}`);
   }

   $: {
      ({ currentDefault, defaultLevels, playerLevels, users } = getData());
      isFolderInst = isFolder($doc);
      isEmbedded = $doc.isEmbedded;
      instructions = localize(isFolderInst ? 'OWNERSHIP.HintFolder' : 'OWNERSHIP.HintDocument');

      if (!ownership && !isFolderInst)
      {
         throw new Error(`The ${document.documentName} document does not contain ownership data`);
      }
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

      // Player users
      const users = globalThis.game.users.map(user => {
         return {
            user,
            level: isFolderInst ? globalThis.CONST.DOCUMENT_META_OWNERSHIP_LEVELS.NOCHANGE : ownership[user.id],
            isAuthor: $doc.author === user
         };
      });

      // Construct and return the data object
      return {
         currentDefault: $doc?.ownership?.default ?? playerLevels[0],
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

      const formData = new foundry.applications.ux.FormDataExtended(event.target).object;

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

<form bind:this={form} on:submit|preventDefault={saveData}>
   <p class=notes>{instructions}</p>

   <div class=form-group>
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label>{localize('OWNERSHIP.AllPlayers')}</label>
      <select name=default data-dtype=Number>
         {@html selectOptions(defaultLevels, { selected: currentDefault, nameAttr: 'level', labelAttr: 'label' })}
      </select>
   </div>
   <hr/>

   {#each users as data (data.user.id)}
      <div class=form-group class:hidden={data.user.isGM}>
         <!-- svelte-ignore a11y-label-has-associated-control -->
         <label>{data.user.name}</label>
            <select name={data.user.id} data-dtype=Number>
               {@html selectOptions(playerLevels, { selected: data.level, nameAttr: 'level', labelAttr: 'label' })}
            </select>
        </div>
    {/each}
</form>
