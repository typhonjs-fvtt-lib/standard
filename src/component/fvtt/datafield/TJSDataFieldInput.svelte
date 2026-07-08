<script>
   /**
    * Creates a reactive wrapper around the Foundry {@link fvtt.DataField} form input.
    *
    * @componentDescription
    *
    * @privateRemarks
    * Since this is specifically for Foundry we directly associate w/ the form CSS vars below.
    */
   import { writable }                 from '#svelte/store';

   import { isObject }                 from '#runtime/util/object';
   import { isMinimalWritableStore }   from '#runtime/svelte/store/util';

   /**
    * @type {import('./types').TJSDataFieldInputOptions}
    */
   export let input = void 0;

   /** @type {fvtt.DataField} */
   export let datafield = void 0;

   /** @type {fvtt.FormInputConfig} */
   export let inputConfig = void 0;

   /** @type {import('#runtime/svelte/store/util').MinimalWritable<unknown>} */
   export let store = void 0;

   /** @type {boolean} */
   export let resetInitial = void 0;

   let loadEl = false;

   let containerEl;

   let containerTag = 'div';

   let activeFieldEl;

   // Tracks whether the activeEl is a custom web component.
   let isCustomEl = false;

   $: {
      datafield = isObject(input) && input.datafield instanceof foundry.data.fields.DataField ? input.datafield :
       datafield instanceof foundry.data.fields.DataField ? datafield : void 0;

      console.log(`!!! TJSDataFieldInput - $datafield`)

      loadEl = true;
   }

   $: {
      inputConfig = isObject(input) && isObject(input.inputConfig) ? input.inputConfig :
       isObject(inputConfig) ? inputConfig : void 0;

      console.log(`!!! TJSDataFieldInput - $inputConfig`)

      loadEl = true;
   }

   $: {
      store = isObject(input) && isMinimalWritableStore(input.store) ? input.store :
       isMinimalWritableStore(store) ? store : writable(void 0);

      console.log(`!!! TJSDataFieldInput - $store`)

      loadEl = true;
   }

   $: resetInitial = isObject(input) && typeof resetInitial === 'boolean' ? input.resetInitial :
    typeof resetInitial === 'boolean' ? resetInitial : false;

   /**
    * Loads the current associated input when `containerEl` is defined and `loadEl` is true.
    */
   $: if (containerEl && loadEl) { loadDatafieldEl(); }

   // When store changes attempt to update web component / active element.
   // $: if (activeFieldEl) { setValue($store); }
   $: if (activeFieldEl !== void 0)
   {
      console.log(`!!! TJSDataFieldInput - $activeFieldEl - changed - invoke setValue - $store: ${$store}`);

      setValue($store);
   }

   function loadDatafieldEl()
   {
      console.log(`!!! TJSDataFieldInput - loadDatafieldEl - 0`);
      loadEl = false;

      if (datafield)
      {
         let currentValue = $store;

         // Validate current value and reset to initial value from data field as necessary.
         const err = datafield.validate(currentValue, { fallback: false });
         if (resetInitial || (err instanceof foundry.data.validation.DataModelValidationFailure))
         {
            console.log(`!!! TJSDataFieldInput - loadDatafieldEl - A1 - current store value: `, currentValue);
            currentValue = datafield.getInitialValue();
            console.log(`!!! TJSDataFieldInput - loadDatafieldEl - A2 - new current initial value: `, currentValue);
         }

         /** @type {HTMLElement | undefined} */
         let datafieldEl;

         try
         {
            datafieldEl = datafield.toInput(Object.assign({}, inputConfig ?? {}, { value: currentValue }));
         }
         catch (err)
         {
            console.warn(err);
         }

         if (datafieldEl)
         {
            // Use rAF to all element to finish creation.
            requestAnimationFrame(() =>
            {
               containerEl.replaceChildren(datafieldEl);

               activeFieldEl = datafieldEl;

               // Check if root element is a compound Foundry web component.
               isCustomEl = typeof activeFieldEl?.tagName === 'string' && activeFieldEl.tagName.includes('-');

               if (resetInitial) { $store = currentValue; }
            })
         }
         else
         {
            activeFieldEl = void 0;
            containerEl.replaceChildren();
            $store = void 0;
         }
      }
      else
      {
         activeFieldEl = void 0;
         containerEl.replaceChildren();
         $store = void 0;
      }
   }

   function onChange(event)
   {
      try
      {
         const eventTargetType = event?.target?.type;

         console.log(`!!! TJSDataFieldInput - onChange - 0 - isCustomEl: ${isCustomEl}; eventTargetType: ${eventTargetType}`)

         // Foundry custom web components do not set event target type for change events. Ignore any internal change
         // events that are specifically from input events internal to these web components.
         // For instance for the HueField / internal range input we must ignore value changes from the release of the
         // range slider.
         if (isCustomEl && typeof eventTargetType === 'string') { return; }

         const eventValue = eventTargetType === 'checkbox' ? event?.target.checked : event?.target?.value;

         // Cleaned value w/ type for the associated data field.
         const newValue = datafield.clean(eventValue);

         console.log(`!!! TJSDataFieldInput - onChange - 1 - eventValue: `, eventValue);
         console.log(`!!! TJSDataFieldInput - onChange - 2 - cleaned newValue:`, newValue);

         // Validate cleaned value.
         const err = datafield.validate(newValue, { fallback: false });
         if (err instanceof foundry.data.validation.DataModelValidationFailure)
         {
            // This can raise false positives depending on coercion.
            if (err?.message)
            {
               // console.warn(`Setting data field (${setting.key}) validation error: ${err.toString()}`);
            }

            console.log(`!!! TJSDataFieldInput - onChange - A - newValue validate error - old $store:`, $store);

            // Reset with old value.
            setValue($store);
         }
         else
         {
            console.log(`!!! TJSDataFieldInput - onChange - B - before store.set - newValue:`, newValue);

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
      console.log(`!!! TJSDataFieldInput - setValue - 0`);

      if (!activeFieldEl) { return; }

      console.log(`!!! TJSDataFieldInput - setValue - 1 - uncleanValue:`, uncleanValue);

      try
      {
         const newValue = datafield.clean(uncleanValue);

         if (activeFieldEl?.value === newValue) { return; }

         const err = datafield.validate(newValue, { fallback: false });
         if (!(err instanceof foundry.data.validation.DataModelValidationFailure))
         {
            if (typeof activeFieldEl?._setValue === 'function')
            {
               console.log(`!!! TJSDataFieldInput - setValue - A1 - _setValue (newValue):`, newValue);

               activeFieldEl._setValue(newValue);
            }
            else
            {
               console.log(`!!! TJSDataFieldInput - setValue - A2 - .value = (newValue):`, newValue);

               activeFieldEl.value = newValue ?? '';
            }

            // if (typeof activeFieldEl?._refresh === 'function') { activeFieldEl._refresh(); }
            if (typeof activeFieldEl?._refresh === 'function')
            {
               console.log(`!!! TJSDataFieldInput - setValue - B - _refresh`);

               activeFieldEl._refresh();
            }
         }
      }
      catch (err)
      {
         console.warn(err);
      }
   }
</script>

<!-- The core `code-mirror` component specifically searches for the closest `form` -->
<svelte:element this={containerTag} bind:this={containerEl} on:change|preventDefault|stopPropagation={onChange}>
</svelte:element>
