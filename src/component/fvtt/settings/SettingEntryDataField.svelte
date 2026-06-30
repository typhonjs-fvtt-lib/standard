<script>
   /**
    * Handles the setting entry to modify setting value.
    *
    * @componentDescription
    *
    * @privateRemarks
    * Since this is specifically for Foundry we directly associate w/ the form CSS vars below.
    */
   import { onMount }   from '#svelte';

   import { hasSetter } from '#runtime/util/object';

   /** @type {TJSGameSettingsWithUI.UISetting.Data} */
   export let setting = void 0;

   const store = setting.store;

   let formEl;

   let activeFieldEl;

   // Tracks whether the activeEl is a custom web component.
   let isCustomEl = false;

   onMount(() =>
   {
      if (setting.dataFieldEl)
      {
         formEl.appendChild(setting.dataFieldEl);
         const activeEl = formEl.querySelector(`[name="${setting.id}"]`);

         if (hasSetter(activeEl, 'value')) { activeFieldEl = activeEl; }

         if (typeof activeEl?.tagName === 'string' && activeEl.tagName.includes('-')) { isCustomEl = true; }
      }
   });

   // When store changes attempt to update web component / active element.
   $: if (activeFieldEl) { setValue($store); }

   function onChange(event)
   {
      try
      {
         // Foundry custom web components do not set event target type for change events. Ignore any internal change
         // events that are specifically from input events internal to these web components.
         // For instance for the HueField / internal range input we must ignore value changes from the release of the
         // range slider.
         if (isCustomEl && event?.target?.type !== void 0) { return; }

         const valueStr = event?.target?.value;

         // Cleaned value w/ type for the associated data field.
         const value = setting.dataField.clean(valueStr);

         // Validate cleaned value.
         const err = setting.dataField.validate(value, { fallback: false });
         if (err instanceof foundry.data.validation.DataModelValidationFailure)
         {
            // This can raise false positives depending on coercion.
            if (err?.message)
            {
               console.warn(`Setting data field (${setting.key}) validation error: ${err.toString()}`);
            }

            // Reset with old value.
            setValue($store);
         }
         else
         {
            store.set(value);
         }
      }
      catch (err)
      {
         console.warn(err);
      }
   }

   /**
    * Update value of active data field element after data validation.
    *
    * @param {unknown}  value - Value to set.
    */
   function setValue(value)
   {
      try
      {
         if (activeFieldEl?.value === value) { return; }

         // The Foundry data validators work with strings, so try the `toString` value first.
         // For instance the `Color` special Foundry / number won't validate unless `toString` is used.
         if (typeof value?.toString === 'function')
         {
            const strValue = value.toString();

            const err = setting.dataField.validate(strValue, { fallback: false });
            if (!(err instanceof foundry.data.validation.DataModelValidationFailure))
            {
               activeFieldEl.value = strValue;
               return;
            }
         }

         // Fallback attempt at straight validation.
         const err = setting.dataField.validate(value, { fallback: false });
         if (!(err instanceof foundry.data.validation.DataModelValidationFailure))
         {
            activeFieldEl.value = value;
         }
      }
      catch { /**/ }
   }
</script>
<form bind:this={formEl}
      class='standard-form'
      on:change|preventDefault|stopPropagation={onChange}
      on:submit|preventDefault|stopPropagation={() => null}>
</form>
