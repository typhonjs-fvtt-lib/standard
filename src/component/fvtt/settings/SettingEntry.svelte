<script>
   /**
    * --tjs-settings-edit-entry-label-color - inherit
    * --tjs-settings-edit-entry-label-font-size - inherit
    * --tjs-settings-edit-entry-label-line-height - var(--form-field-height) / Foundry variable
    *
    * --tjs-settings-edit-entry-hint-color - var(--color-text-dark-secondary) / Foundry variable
    * --tjs-settings-edit-entry-hint-font-size - var(--font-size-12) / Foundry variable
    * --tjs-settings-edit-entry-hint-line-height - var(--line-height-16) / Foundry variable
    * --tjs-settings-edit-entry-hint-margin - 0.5em 0
    */
   import { FVTTFilePickerControl } from '#standard/application/control/filepicker';

   import { TJSIconButton }         from '#standard/component/button';

   import {
      TJSInput,
      TJSInputCheckbox,
      TJSSelect }                   from '#standard/component/form';

   /** @type {object} */
   export let setting = void 0;

   const store = setting.store;

   async function onFilePicker()
   {
      const result = await FVTTFilePickerControl.browse({
         modal: true,
         type: setting.filePicker,
         current: setting.value
      });

      if (result) { $store = result; }
   }
</script>

<section class=tjs-settings-edit-entry>
    <label for={setting.id}>{setting.name}</label>
    <div class:checkbox={setting.componentType === 'checkbox'}>
        {#if setting.componentType === 'checkbox'}
            <TJSInputCheckbox {store} />
        {:else if setting.componentType === 'number'}
            <TJSInput input={setting.inputData} />
        {:else if setting.componentType === 'range-number'}
            <TJSInput input={setting.inputData} />
        {:else if setting.componentType === 'select'}
            <TJSSelect select={setting.selectData} />
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
    div {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        flex: 3;
        justify-content: flex-end;
        align-items: center;
    }

    div.checkbox {
        flex: 0
    }

    label {
        color: var(--tjs-settings-edit-entry-label-color, inherit);
        font-size: var(--tjs-settings-edit-entry-label-font-size, inherit);
        line-height: var(--tjs-settings-edit-entry-label-line-height, var(--form-field-height));
        flex: 2;
    }

    p {
        flex: 0 0 100%;
        color: var(--tjs-settings-edit-entry-hint-color, var(--color-text-dark-secondary));
        font-size: var(--tjs-settings-edit-entry-hint-font-size, var(--font-size-12));
        line-height: var(--tjs-settings-edit-entry-hint-line-height, var(--line-height-16));
        margin: var(--tjs-settings-edit-entry-hint-margin, 0.5em 0);
        min-height: 1rem;
    }

    section {
        clear: both;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
    }
</style>
