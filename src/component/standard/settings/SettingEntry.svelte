<script>
   /**
    * --tjs-settings-entry-margin - 0 0 1rem 0
    *
    * --tjs-settings-entry-label-color - inherit
    * --tjs-settings-entry-label-font-size - inherit
    * --tjs-settings-entry-label-line-height - var(--form-field-height) / Foundry variable
    *
    * --tjs-settings-entry-hint-color - var(--color-text-dark-secondary) / Foundry variable
    * --tjs-settings-entry-hint-font-size - var(--font-size-12) / Foundry variable
    * --tjs-settings-entry-hint-line-height - var(--line-height-16) / Foundry variable
    * --tjs-settings-entry-hint-margin - 0.5em 0
    */

   import {
      TJSIconButton,
      TJSInput,
      TJSSelect }   from '@typhonjs-fvtt/svelte-standard/component';

   /** @type {object} */
   export let setting = void 0;

   const store = setting.store;

   let filePickerApp;

   function onFilePicker()
   {
      // Bring any existing file picker to the top.
      if (filePickerApp)
      {
         filePickerApp.bringToTop();
         return;
      }

      filePickerApp = new FilePicker({
         type: setting.filePicker,
         current: setting.value,
         callback: (result) => $store = result
      });

      // A little hack here to remove the existing reference to `filePickerApp` when closed.
      const originalClose = filePickerApp.close;
      filePickerApp.close = async function (options)
      {
         await originalClose.call(filePickerApp, options);
         filePickerApp = void 0;
      }

      filePickerApp.render(true, { focus: true });
   }
</script>

<section>
    <label for={setting.id}>{setting.name}</label>
    <div>
        {#if setting.componentType === 'checkbox'}
            <input type=checkbox id={setting.id} bind:checked={$store} />
        {:else if setting.componentType === 'number'}
            <TJSInput input={setting.inputData} />
        {:else if setting.componentType === 'range'}
            <input type=range id={setting.id} min={setting.range.min} max={setting.range.max} step={setting.range.step} bind:value={$store} />
        {:else if setting.componentType === 'select'}
            <TJSSelect select={setting.selectData} />
<!--            <select id={setting.id} bind:value={$store}>-->
<!--                {#each setting.choices as choice}-->
<!--                    <option value={choice.value}>-->
<!--                        {choice.text}-->
<!--                    </option>-->
<!--                {/each}-->
<!--            </select>-->
        {:else if setting.componentType === 'text'}
            <TJSInput input={setting.inputData} />
        {/if}
        {#if setting.filePicker}
            <TJSIconButton button={setting.buttonData} on:click={onFilePicker} />
        {/if}
    </div>
    {#if setting.hint}
        <p class=hint>{setting.hint}</p>
    {/if}
</section>

<style>
    section {
        clear: both;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
    }

    section:not(:last-child) {
        margin: var(--tjs-settings-entry-margin, 0 0 1rem 0);
    }

    label {
        color: var(--tjs-settings-entry-label-color, inherit);
        font-size: var(--tjs-settings-entry-label-font-size, inherit);
        line-height: var(--tjs-settings-entry-label-line-height, var(--form-field-height));
        flex: 2;
    }

    div {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        flex: 3;
        justify-content: flex-end;
        align-items: center;
    }

    p {
        flex: 0 0 100%;
        color: var(--tjs-settings-entry-hint-color, var(--color-text-dark-secondary));
        font-size: var(--tjs-settings-entry-hint-font-size, var(--font-size-12));
        line-height: var(--tjs-settings-entry-hint-line-height, var(--line-height-16));
        margin: var(--tjs-settings-entry-hint-margin, 0.5em 0);
        min-height: 1rem;
    }
</style>
