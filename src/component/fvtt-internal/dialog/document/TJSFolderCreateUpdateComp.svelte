<script>
   import { getContext }   from '#svelte';

   import { TJSDocument }  from '#runtime/svelte/store/fvtt/document';
   import { isFolder }     from '#runtime/types/fvtt-shim/guard';
   import { localize }     from '#runtime/util/i18n';

   import { radioBoxes }   from './util.js';

   export let document = void 0;

   const s_REGEX_HEX_COLOR = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

   const application = getContext('#external')?.application;

   const managedPromise = getContext('#managedPromise');

   if (!isFolder(document))
   {
      throw new TypeError(`TJSFolderCreateUpdate error: 'document' is not an instance of Folder.`);
   }

   const doc = new TJSDocument(document, { delete: application.close.bind(application) });
   const newName = localize('DOCUMENT.New', { type: localize(foundry.documents.Folder.metadata.label) });
   const sortingModes = { a: 'FOLDER.SortAlphabetical', m: 'FOLDER.SortManual' };

   let form;

   let name = document?._id ? document.name : '';
   let color = document?.color;

   // Track original color.
   let origColor = color;

   let colorText = '';

   $: if ($doc !== document)
   {
      if (!isFolder(document))
      {
         throw new TypeError(`TJSFolderCreateUpdate error: 'document' is not an instance of Folder.`);
      }

      doc.set(document);

      name = document?.id ? document.name : '';
      color = document?.color;
      origColor = color;

      // Update the dialog button label and title.
      application.data.merge({
         buttons: {
            submit: {
               label: localize(document?._id ? 'FOLDER.Update' : 'SIDEBAR.ACTIONS.CREATE.Folder')
            }
         },
         title: document?.id ? `${localize('FOLDER.Update')}: ${document.name}` : localize('SIDEBAR.ACTIONS.CREATE.Folder')
      });
   }

   // Reactive block to test color and if it is not a valid hex color then reset colorText and set color to black.
   $: if (s_REGEX_HEX_COLOR.test(color))
   {
      colorText = color;
   }
   else
   {
      colorText = '#000000';
      color = '#000000'
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
      const formData = new foundry.applications.ux.FormDataExtended(event.target).object;

      if (!formData.name?.trim()) { formData.name = foundry.documents.Folder.implementation.defaultName(); }
      if (!formData.parent) { formData.parent = null; }

      let modifiedDoc = document;

      if (document.id)
      {
         await document.update(formData);
      }
      else
      {
         document.updateSource(formData);
         modifiedDoc = await foundry.documents.Folder.create(document);
      }

      managedPromise.resolve(modifiedDoc);
      application.close();
   }
</script>

<svelte:options accessors={true}/>

<form bind:this={form}
      class=standard-form
      on:submit|preventDefault={saveData}
      autocomplete=off>
   <input type=hidden name=type value={document.type} />
   <input type=hidden name=parent value={document.parent} />
   <input type=hidden name=color bind:value={colorText} />

   <div class=form-group>
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label>{localize('FOLDER.FIELDS.name.label')}</label>
      <div class=form-fields>
         <input type=text name=name placeholder={newName} value={name} required/>
      </div>
   </div>

   <div class=form-group>
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label>{localize('FOLDER.FIELDS.color.label')}</label>
      <div class=form-fields>
         <input type=text name=colorText bind:value={colorText} readonly />
         <input type=color bind:value={color} data-edit=color />
         <button type=button on:click={() => color = origColor}><i class="fas fa-trash-restore"></i></button>
      </div>
   </div>

   <div class=form-group>
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label>{localize('FOLDER.FIELDS.sorting.label')}</label>
      <div class=form-fields>
         {@html radioBoxes('sorting', sortingModes, { checked: document.sorting, localize: true })}
      </div>
   </div>
</form>

<style>
   input[type=color] {
      flex: 0 0 40px;
      height: 40px;
      margin: -4px;
      background: transparent;
      border: none;
      cursor: var(--cursor-pointer);
   }
</style>
