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
    *
    * @privateRemarks
    * TODO: replace range input support below w/ TJSInputRange when available.
    */
   import { FVTTFilePickerControl } from '#standard/application/control/filepicker';

   import { TJSIconButton }         from '#standard/component/button';

   import {
      TJSInput,
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

<section class=tjs-settings-entry>
    <label for={setting.id}>{setting.name}</label>
    <div class:checkbox={setting.componentType === 'checkbox'}>
        {#if setting.componentType === 'checkbox'}
            <input type=checkbox id={setting.id} bind:checked={$store} />
        {:else if setting.componentType === 'number'}
            <TJSInput input={setting.inputData} />
        {:else if setting.componentType === 'range'}
            <input type=range id={setting.id} min={setting.range.min} max={setting.range.max} step={setting.range.step} bind:value={$store} />
            <span class=range-value>{$store}</span>
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
        color: var(--tjs-settings-entry-label-color, inherit);
        font-size: var(--tjs-settings-entry-label-font-size, inherit);
        line-height: var(--tjs-settings-entry-label-line-height, var(--form-field-height));
        flex: 2;
    }

    input[type=range] {
        margin-left: 0.25em;
    }

    span.range-value {
        display: block;
        flex: 0 1 fit-content;
        text-align: center;
        border: var(--tjs-input-border, 1px solid var(--color-border-light-primary));
        border-radius: var(--tjs-input-border-radius);
        padding: 0.25em;
        margin-left: 0.5em;
    }

    p {
        flex: 0 0 100%;
        color: var(--tjs-settings-entry-hint-color, var(--color-text-dark-secondary));
        font-size: var(--tjs-settings-entry-hint-font-size, var(--font-size-12));
        line-height: var(--tjs-settings-entry-hint-line-height, var(--line-height-16));
        margin: var(--tjs-settings-entry-hint-margin, 0.5em 0);
        min-height: 1rem;
    }

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
</style>
