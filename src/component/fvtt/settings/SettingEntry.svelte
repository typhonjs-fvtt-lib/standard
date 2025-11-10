<script>
   /**
    * Handles the setting entry to modify setting value.
    *
    * @componentDescription
    *
    * @privateRemarks
    * Since this is specifically for Foundry we directly associate w/ the form CSS vars below.
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
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label>
       <span class=label>{setting.name}</span>
       <span class=content class:checkbox={setting.componentType === 'checkbox'}>
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
       </span>
    </label>
    {#if setting.hint}
        <p>{setting.hint}</p>
    {/if}
</section>

<style>
    .content {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        flex: 3;
        justify-content: flex-end;
        align-items: center;
    }

    .content.checkbox {
        flex: 0
    }

    label {
        display: contents;
    }

    .label {
       flex: 2;
       color: var(--tjs-settings-edit-entry-label-color, var(--color-form-label));
       cursor: var(--tjs-settings-edit-entry-cursor, var(--tjs-cursor-default));
       font-size: var(--tjs-settings-edit-entry-label-font-size, inherit);
       font-weight: bold;
       line-height: var(--tjs-settings-edit-entry-label-line-height, var(--input-height));
    }

    p {
        flex: 0 0 100%;
        color: var(--tjs-settings-edit-entry-hint-color, var(--color-form-hint));
        cursor: var(--tjs-settings-edit-entry-cursor, var(--tjs-cursor-default));
        font-size: var(--tjs-settings-edit-entry-hint-font-size, var(--font-size-14));
        margin: var(--tjs-settings-edit-entry-hint-margin, 0);
        min-height: 1rem;
    }

    section {
        clear: both;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
    }

    section:hover p {
       color: var(--tjs-settings-edit-entry-hint-color-hover, var(--color-form-hint-hover));
    }

    section:hover .label {
       color: var(--tjs-settings-edit-entry-label-color-hover, var(--color-form-label-hover));
    }
</style>
