<script>
   /**
    * Creates a reactive wrapper around the Foundry {@link fvtt.DataField} form input.
    *
    * @componentDescription
    *
    * @privateRemarks
    * Since this is specifically for Foundry we directly associate w/ the form CSS vars below.
    */
   import { onMount }   from '#svelte';

   import { hasSetter } from '#runtime/util/object';

   /** @type {fvtt.DataField} */
   export let datafield;

   /** @type {fvtt.FormInputConfig | undefined} */
   export let inputConfig;

   /** @type {import('#runtime/svelte/store/util').MinimalWritable<unknown>} */
   export let store;

   let divEl;

   let activeFieldEl;

   // Tracks whether the activeEl is a custom web component.
   let isCustomEl = false;

   onMount(() =>
   {
      if (datafield)
      {
         const datafieldEl = datafield.toInput(Object.assign({}, inputConfig ?? {}, { value: $store }));

         // Use rAF to all element to finish creation.
         requestAnimationFrame(() =>
         {
            divEl.appendChild(datafieldEl);

            const activeEl = divEl.querySelector(`[name="${config.rootId}"]`);

            if (hasSetter(activeEl, 'value')) { activeFieldEl = activeEl; }

            // Check if root element is a compound Foundry web component.
            if (typeof activeEl?.tagName === 'string' && activeEl.tagName.includes('-')) { isCustomEl = true; }
         })
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
         const newValue = datafield.clean(valueStr);

         // Validate cleaned value.
         const err = datafield.validate(newValue, { fallback: false });
         if (err instanceof foundry.data.validation.DataModelValidationFailure)
         {
            // This can raise false positives depending on coercion.
            if (err?.message)
            {
               // console.warn(`Setting data field (${setting.key}) validation error: ${err.toString()}`);
            }

            // Reset with old value.
            setValue($store);
         }
         else
         {
            store.set(newValue);
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
    * @param {unknown}  uncleanValue - Uncleaned value to set.
    */
   function setValue(uncleanValue)
   {
      if (!activeFieldEl) { return; }

      try
      {
         const newValue = datafield.clean(uncleanValue);

         if (activeFieldEl?.value === newValue) { return; }

         const err = datafield.validate(newValue, { fallback: false });
         if (!(err instanceof foundry.data.validation.DataModelValidationFailure))
         {
            if (typeof activeFieldEl?._setValue === 'function')
            {
               activeFieldEl._setValue(newValue);
            }
            else
            {
               activeFieldEl.value = newValue ?? '';
            }

            if (typeof activeFieldEl?._refresh === 'function') { activeFieldEl._refresh(); }
         }
      }
      catch (err)
      {
         console.warn(err);
      }
   }
</script>
<div bind:this={divEl}
     on:change|preventDefault|stopPropagation={onChange}>
</div>
