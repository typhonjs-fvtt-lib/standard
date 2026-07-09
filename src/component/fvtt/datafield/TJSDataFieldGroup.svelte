<script>
   /**
    * Creates a reactive wrapper around the Foundry form group configuration for a {@link fvtt.DataField}. By supplying
    * a {@link fvtt.FormGroupConfig} you may specify the `rootId`, `label`, `hint`, and `units`.
    *
    * @componentDescription
    *
    * @privateRemarks
    * Since this is specifically for Foundry we directly associate w/ the form CSS vars below.
    */
   import { writable }                 from '#svelte/store';

   import { isMinimalWritableStore }   from '#runtime/svelte/store/util';

   import {
      hasSetter,
      isObject }                       from '#runtime/util/object';

   import { Hashing }                  from '#runtime/util';

   /**
    * Combined configuration object for all props.
    *
    * @type {import('./types').TJSDataFieldGroupOptions}
    */
   export let input = void 0;

   /**
    * The associated Foundry {@link fvtt.DataField}.
    *
    * @type {fvtt.DataField}
    */
   export let datafield = void 0;

   /**
    * Useful for setting the major form areas for `label`, `hint`, and `units`.
    *
    * @type {fvtt.FormGroupConfig | undefined}
    */
   export let groupConfig = void 0;

   /**
    * The optional {@link fvtt.FormInputConfig} for the associated data field input construction.
    *
    * @type {fvtt.FormInputConfig}
    */
   export let inputConfig = void 0;

   /**
    * The store receiving value changes. You may bind to or provide a custom store.
    *
    * @type {import('#runtime/svelte/store/util').MinimalWritable<unknown>}
    */
   export let store = void 0;

   /**
    * If / when the associated {@link DataField} is changed reset the store to the initial value for the DataField.
    *
    * @type {boolean}
    */
   export let resetInitial = void 0;

   /**
    * When a data field input is mounted this references the active input source element.
    *
    * @type {HTMLElement | undefined}
    */
   let activeFieldEl;

   /**
    * Stores the associated container element. This is usually a div element, but the core code mirror web component
    * specifically requires a form element.
    *
    * @type {HTMLDivElement | HTMLFormElement | undefined}
    */
   let containerEl;

   /**
    * Sets the `svelte:element` tag for the appropriate container element.
    *
    * @type {string}
    */
   let containerTag = 'div';

   /**
    * Defines an error message to display inline when misconfigured.
    *
    * @type {string | undefined}
    */
   let errorMessage;

   /**
    * Tracks whether the activeFieldEl is a custom web component.
    *
    * @type {boolean}
    */
   let isCustomEl = false;

   /**
    * A boolean flag to signal a reload of the associated data field input is required.
    */
   let loadEl = false;

   /**
    * Any defined `rootId` from `groupConfig` if defined otherwise create random ID to assign during form group
    * construction.
    */
   let uniqueId = createUniqueId();

   $: {
      datafield = isObject(input) && input.datafield instanceof foundry.data.fields.DataField ? input.datafield :
       datafield instanceof foundry.data.fields.DataField ? datafield : void 0;

      console.log(`!!! TJSDataFieldGroup - $datafield`)

      errorMessage = void 0;

      containerTag = (datafield instanceof foundry.data.fields.JavaScriptField) ||
       (datafield instanceof foundry.data.fields.JSONField) ? 'form' : 'div';

      loadEl = true;
   }

   $: {
      groupConfig = isObject(input) && isObject(input.groupConfig) ? input.groupConfig :
       isObject(groupConfig) ? groupConfig : void 0;

      console.log(`!!! TJSDataFieldGroup - $groupConfig`)

      uniqueId = createUniqueId();

      errorMessage = void 0;

      loadEl = true;
   }

   $: {
      inputConfig = isObject(input) && isObject(input.inputConfig) ? input.inputConfig :
       isObject(inputConfig) ? inputConfig : void 0;

      console.log(`!!! TJSDataFieldGroup - $inputConfig`)

      errorMessage = void 0;

      loadEl = true;
   }

   $: {
      store = isObject(input) && isMinimalWritableStore(input.store) ? input.store :
       isMinimalWritableStore(store) ? store : writable(void 0);

      console.log(`!!! TJSDataFieldGroup - $store`)

      errorMessage = void 0;

      loadEl = true;
   }

   $: resetInitial = isObject(input) && typeof resetInitial === 'boolean' ? input.resetInitial :
    typeof resetInitial === 'boolean' ? resetInitial : false;

   /**
    * Loads the current associated input when `containerEl` is defined and `loadEl` is true.
    */
   $: if (containerEl && loadEl) { loadFormgroupEl(); }

   // When store changes attempt to update web component / active element.
   // $: if (activeFieldEl) { setValue($store); }
   $: if (activeFieldEl !== void 0)
   {
      console.log(`!!! TJSDataFieldGroup - $activeFieldEl - changed - invoke setValue - $store: ${$store}`);

      setValue($store);
   }

   /**
    * Uses any defined `rootId` from `groupConfig` if defined otherwise create random ID to assign during form group
    * construction.
    */
   function createUniqueId()
   {
      return typeof groupConfig?.rootId === 'string' ? groupConfig.rootId : `unique-${Hashing.uuidv4()}`;
   }

   /**
    * Dynamically loads the associated input element for the current DataField.
    */
   function loadFormgroupEl()
   {
      console.log(`!!! TJSDataFieldGroup - loadDatafieldEl - 0`);
      loadEl = false;

      if (datafield)
      {
         let currentValue = $store;

         errorMessage = void 0;

         // Detect if the given DataField has an input element.
         if (!datafield.constructor.hasFormSupport)
         {
            resetContainer();
            errorMessage = `No input element for ${datafield.constructor.name}`;
            return;
         }

         // Validate current value and reset to initial value from data field as necessary.
         const err = datafield.validate(currentValue, { fallback: false });
         if (resetInitial || (err instanceof foundry.data.validation.DataModelValidationFailure))
         {
            console.log(`!!! TJSDataFieldGroup - loadDatafieldEl - A1 - current store value: `, currentValue);
            currentValue = datafield.getInitialValue();
            console.log(`!!! TJSDataFieldGroup - loadDatafieldEl - A2 - new current initial value: `, currentValue);
         }

         /** @type {HTMLElement | undefined} */
         let formgroupEl;

         try
         {
            formgroupEl = datafield.toFormGroup(Object.assign({}, groupConfig, { rootId: uniqueId }),
             Object.assign({}, inputConfig ?? {}, { value: currentValue }));
         }
         catch (err)
         {
            console.warn(err);
         }

         if (formgroupEl)
         {
            // Use rAF so all elements finish creation.
            requestAnimationFrame(() =>
            {
               containerEl.replaceChildren(formgroupEl);

               const activeEl = containerEl.querySelector(`[name="${groupConfig.rootId}"]`);

               if (hasSetter(activeEl, 'value')) { activeFieldEl = activeEl; }

               // Check if root element is a compound Foundry web component.
               isCustomEl = typeof activeFieldEl?.tagName === 'string' && activeFieldEl.tagName.includes('-');

               if (resetInitial) { $store = currentValue; }
            })
         }
         else
         {
            resetContainer();
         }
      }
      else
      {
         resetContainer();
      }
   }

   function onChange(event)
   {
      try
      {
         const eventTargetType = event?.target?.type;

         console.log(`!!! TJSDataFieldGroup - onChange - 0 - isCustomEl: ${isCustomEl}; eventTargetType: ${eventTargetType}`)

         // Foundry custom web components do not set event target type for change events. Ignore any internal change
         // events that are specifically from input events internal to these web components.
         // For instance for the HueField / internal range input we must ignore value changes from the release of the
         // range slider.
         if (isCustomEl && typeof eventTargetType === 'string') { return; }

         const eventValue = eventTargetType === 'checkbox' ? event?.target.checked : event?.target?.value;

         // Cleaned value w/ type for the associated data field.
         const newValue = datafield.clean(eventValue);

         console.log(`!!! TJSDataFieldGroup - onChange - 1 - eventValue: `, eventValue);
         console.log(`!!! TJSDataFieldGroup - onChange - 2 - cleaned newValue:`, newValue);

         // Validate cleaned value.
         const err = datafield.validate(newValue, { fallback: false });
         if (err instanceof foundry.data.validation.DataModelValidationFailure)
         {
            if (err?.message)
            {
               // TODO: Perhaps fire a validation error event.
               // console.warn(``);
            }

            console.log(`!!! TJSDataFieldGroup - onChange - A - newValue validate error - old $store:`, $store);

            // Reset with old value.
            setValue($store);
         }
         else
         {
            console.log(`!!! TJSDataFieldGroup - onChange - B - before store.set - newValue:`, newValue);

            $store = newValue;
         }
      }
      catch (err)
      {
         console.warn(err);
      }
   }

   /**
    * Resets state / removes children content from container.
    */
   function resetContainer()
   {
      activeFieldEl = void 0;
      containerEl?.replaceChildren();

      if (resetInitial) { $store = void 0; }
   }

   /**
    * Update value of active data field element after data validation.
    *
    * @param {unknown}  uncleanValue - Uncleaned value to set.
    */
   function setValue(uncleanValue)
   {
      console.log(`!!! TJSDataFieldGroup - setValue - 0`);

      if (!activeFieldEl) { return; }

      console.log(`!!! TJSDataFieldGroup - setValue - 1 - uncleanValue:`, uncleanValue);

      try
      {
         const newValue = datafield.clean(uncleanValue);

         if (activeFieldEl?.value === newValue) { return; }

         const err = datafield.validate(newValue, { fallback: false });
         if (!(err instanceof foundry.data.validation.DataModelValidationFailure))
         {
            if (typeof activeFieldEl?._setValue === 'function')
            {
               console.log(`!!! TJSDataFieldGroup - setValue - A1 - _setValue (newValue):`, newValue);

               activeFieldEl._setValue(newValue);
            }
            else
            {
               console.log(`!!! TJSDataFieldGroup - setValue - A2 - .value = (newValue):`, newValue);

               activeFieldEl.value = newValue ?? '';
            }

            // if (typeof activeFieldEl?._refresh === 'function') { activeFieldEl._refresh(); }
            if (typeof activeFieldEl?._refresh === 'function')
            {
               console.log(`!!! TJSDataFieldGroup - setValue - B - _refresh`);

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
{#if errorMessage}
   <div class="tjs-panel-content tjs-panel-content--flex-row tjs-content-error">
      {errorMessage}
   </div>
{:else}
   <!-- The core `code-mirror` component specifically searches for the closest `form` -->
   <svelte:element this={containerTag}
                   class=standard-form
                   bind:this={containerEl}
                   on:change|preventDefault|stopPropagation={onChange}>
   </svelte:element>
{/if}

<style lang=css>
   .tjs-content-error {
      background: var(--tjs-content-error-background);
      border-color: var(--tjs-content-error-border-color);
      color: var(--tjs-content-error-color);
      padding: var(--tjs-content-gap-half, 0.5rem);
   }
</style>
