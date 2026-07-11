<script>
   /**
    * Creates a reactive wrapper around the Foundry direct input or form group configuration for a
    * {@link fvtt.DataField}. By supplying `groupConfig` the form group is created {@link fvtt.FormGroupConfig}
    * where you may specify the `label`, `hint`, and `units` or additional configuration like `stacked`.
    *
    * @componentDescription
    */
   import { writable }                 from '#svelte/store';

   import { isMinimalWritableStore }   from '#runtime/svelte/store/util';
   import { PropBindingControl }       from '#runtime/svelte/util';

   import {
      hasSetter,
      isObject }                       from '#runtime/util/object';

   import {
      isBoolean,
      isFunction,
      resolveByPredicate }             from '#runtime/util/predicate';

   import { CrossRealm }               from '#runtime/util/realm';

   import {
      isDataField,
      isDataModelValidationFailure }   from '#runtime/types/fvtt-shim/predicate';

   import { Hashing }                  from '#runtime/util';

   /**
    * Combined configuration object for all props.
    *
    * Individual props take precedence over corresponding properties defined in `input`.
    *
    * @type {import('./types').TJSDataFieldOptions | undefined}
    */
   export let input = void 0;

   /**
    * The associated Foundry {@link fvtt.DataField}.
    *
    * @type {fvtt.DataField | undefined}
    */
   export let datafield = void 0;

   /**
    * Is the component enabled.
    *
    * @type {boolean}
    */
   export let enabled = void 0;

   /**
    * Useful for setting the major form areas for `label`, `hint`, and `units`.
    *
    * @type {fvtt.FormGroupConfig | undefined}
    */
   export let groupConfig = void 0;

   /**
    * The optional {@link fvtt.FormInputConfig} for the associated data field input construction.
    *
    * @type {fvtt.FormInputConfig | undefined}
    */
   export let inputConfig = void 0;

   /**
    * Callback function that receives any {@link fvtt.DataModelValidationFailure} instances when validation fails.
    *
    * @type {(err: fvtt.DataModelValidationFailure) => void | undefined}
    */
   export let onValidationFailure = void 0;

   /**
    * If / when the associated {@link fvtt.DataField} changes, reset the store to the initial value for the DataField.
    *
    * @type {boolean | undefined}
    */
   export let resetInitial = void 0;

   /**
    * The store receiving value changes. You may bind to or provide a custom store.
    *
    * @type {import('#runtime/svelte/store/util').MinimalWritable<unknown> | undefined}
    */
   export let store = void 0;

   /**
    * Effective resolved component properties.
    *
    * @type {import('./types').TJSDataFieldOptions}
    */
   const props = {
      datafield: void 0,
      enabled: true,
      groupConfig: void 0,
      inputConfig: void 0,
      onValidationFailure: void 0,
      resetInitial: false
   };

   /**
    * Resolves the effective store while preserving values published through the bindable `store` property.
    */
   const storeControl = new PropBindingControl(isMinimalWritableStore, writable(void 0));

   /**
    * Normalized combined component options.
    *
    * @type {import('./types').TJSDataFieldOptions}
    */
   let inputOptions = {};

   /**
    * When a data field input is mounted this references the active input source element.
    *
    * @type {HTMLElement | undefined}
    */
   let activeFieldEl;

   /**
    * Stores the associated container element. This is usually a div element, but the core `code-mirror` web component
    * specifically requires a form element.
    *
    * @type {HTMLDivElement | HTMLFormElement | undefined}
    */
   let containerEl;

   /**
    * Sets the `svelte:element` tag for the appropriate container element.
    *
    * @type {'div' | 'form'}
    */
   let containerTag = 'div';

   /**
    * Defines an error message to display inline when misconfigured.
    *
    * @type {string | undefined}
    */
   let errorMessage;

   /**
    * Tracks whether the active field element is a custom web component.
    */
   let isCustomEl = false;

   /**
    * Any defined `rootId` from `groupConfig`; otherwise a generated unique ID.
    */
   let uniqueId = createUniqueId();

   /**
    * Previous construction properties used to detect effective changes.
    *
    * @type {fvtt.DataField | undefined}
    */
   let previousDatafield;

   /**
    * @type {boolean}
    */
   let previousEnabled;

   /**
    * @type {fvtt.FormGroupConfig | undefined}
    */
   let previousGroupConfig;

   /**
    * @type {fvtt.FormInputConfig | undefined}
    */
   let previousInputConfig;

   /**
    * Describes the latest request to reconstruct the hosted Foundry element.
    */
   let reloadRequest = { revision: 0, datafieldChanged: false };

   /**
    * Invalidates stale asynchronous mount callbacks.
    */
   let mountGeneration = 0;

   /**
    * Normalize the combined input separately from resolution of the individual exported props.
    */
   $: inputOptions = isObject(input) ? input : {};

   /**
    * Resolve effective props. Valid individual props take precedence over values supplied through `input`.
    */
   $: props.datafield = resolveByPredicate(isDataField, datafield, inputOptions.datafield);

   $: props.enabled = resolveByPredicate(isBoolean, enabled, inputOptions.enabled) ?? true;

   $: props.groupConfig = resolveByPredicate(isObject, groupConfig, inputOptions.groupConfig);

   $: props.inputConfig = resolveByPredicate(isObject, inputConfig, inputOptions.inputConfig);

   $: props.onValidationFailure = resolveByPredicate(isFunction, onValidationFailure, inputOptions.onValidationFailure);

   $: props.resetInitial = resolveByPredicate(isBoolean, resetInitial, inputOptions.resetInitial) ?? false;

   $: store = storeControl.resolve(store, inputOptions.store);

   /*
    * The container tag is derived exclusively from the effective DataField.
    *
    * Changing `containerTag` causes Svelte to replace the `svelte:element`. The new `containerEl` binding then causes
    * the current reload request to be processed against the new container.
    */
   $: containerTag = requiresFormContainer(props.datafield) ? 'form' : 'div';

   /**
    * Only construction properties trigger reconstruction.
    *
    * - DataField changes require a new Foundry element.
    * - Group configuration changes require a new form group.
    * - Input configuration changes require a new input element.
    *
    * Store and resetInitial changes do not independently reconstruct the element.
    */
   $: {
      const datafieldChanged = props.datafield !== previousDatafield;
      const enabledChanged = props.enabled !== previousEnabled;
      const groupConfigChanged = props.groupConfig !== previousGroupConfig;
      const inputConfigChanged = props.inputConfig !== previousInputConfig;

      if (datafieldChanged || enabledChanged || groupConfigChanged || inputConfigChanged)
      {
         previousDatafield = props.datafield;
         previousEnabled = props.enabled;
         previousGroupConfig = props.groupConfig;
         previousInputConfig = props.inputConfig;

         if (groupConfigChanged) { uniqueId = createUniqueId(); }

         errorMessage = void 0;

         requestReload(datafieldChanged);
      }
   }

   /**
    * Process the latest construction request whenever both a request and a current container are available.
    *
    * This also reruns when Svelte replaces the container because its tag changes between `div` and `form`.
    */
   $: if (containerEl && reloadRequest.revision > 0) { loadPayloadEl(reloadRequest, containerEl); }

   /**
    * Store value changes update the existing active element directly rather than reconstructing it.
    */
   $: if (activeFieldEl !== void 0) { setValue($store); }

   /**
    * Determines whether a DataField requires a form container.
    *
    * @param {fvtt.DataField | undefined} value - DataField to test.
    *
    * @returns {boolean}
    */
   function requiresFormContainer(value)
   {
      return value instanceof foundry.data.fields.JavaScriptField || value instanceof foundry.data.fields.JSONField;
   }

   /**
    * Creates a new element reconstruction request.
    *
    * @param {boolean} datafieldChanged - Whether the effective DataField changed.
    */
   function requestReload(datafieldChanged)
   {
      reloadRequest = { revision: reloadRequest.revision + 1, datafieldChanged };
   }

   /**
    * @returns {string} Uses any defined `rootId` from `groupConfig`; otherwise creates a random ID.
    */
   function createUniqueId()
   {
      return typeof props.groupConfig?.rootId === 'string' ? props.groupConfig.rootId : `unique-${Hashing.uuidv4()}`;
   }

   /**
    * Dynamically loads the associated input element for the current DataField.
    *
    * @param {{ revision: number, datafieldChanged: boolean }} request - Current reload request.
    *
    * @param {HTMLDivElement | HTMLFormElement} targetContainer - Container receiving the element.
    */
   function loadPayloadEl(request, targetContainer)
   {
      const generation = ++mountGeneration;

      activeFieldEl = void 0;
      isCustomEl = false;

      if (!isDataField(props.datafield))
      {
         resetContainer(targetContainer);

         // No DataField present potentially reset store.
         if (request.datafieldChanged && props.resetInitial && $store !== void 0) { $store = void 0; }

         return;
      }

      if (!props.datafield.constructor.hasFormSupport)
      {
         resetContainer(targetContainer);

         // Potentially sync store to initial value of the DataField even though it can't be displayed.
         if (request.datafieldChanged && props.resetInitial)
         {
            const initialValue = props.datafield.getInitialValue();

            if ($store !== initialValue) { $store = initialValue; }
         }

         errorMessage = `No input element for ${props.datafield.constructor.name}`;

         return;
      }

      let currentValue = $store;

      errorMessage = void 0;

      const resetForDatafield = request.datafieldChanged && props.resetInitial;

      const validationFailure = props.datafield.validate(currentValue, { fallback: false });

      if (resetForDatafield || isDataModelValidationFailure(validationFailure))
      {
         currentValue = props.datafield.getInitialValue();

         // Keep store in sync.
         if ($store !== currentValue) { $store = currentValue; }
      }

      if (isObject(props.groupConfig))
      {
         loadFormGroupEl(currentValue, targetContainer, generation);
      }
      else
      {
         loadDataFieldEl(currentValue, targetContainer, generation);
      }
   }

   /**
    * Creates and mounts a standalone DataField input.
    *
    * @param {unknown} currentValue - Current input value.
    *
    * @param {HTMLDivElement | HTMLFormElement} targetContainer - Container receiving the input.
    *
    * @param {number} generation - Current mount generation.
    *
    * @param {boolean} updateStore - Whether the resolved initial value should update the store.
    */
   function loadDataFieldEl(currentValue, targetContainer, generation, updateStore)
   {
      /** @type {HTMLElement | undefined} */
      let datafieldEl;

      try
      {
         datafieldEl = props.datafield.toInput(Object.assign({ disabled: !props.enabled }, props.inputConfig ?? {},
          { value: currentValue }));
      }
      catch (err)
      {
         errorMessage = typeof err?.message === 'string' ? err.message : String(err);
         console.warn(err);
      }

      if (!datafieldEl)
      {
         resetContainer(targetContainer);
         return;
      }

      requestAnimationFrame(() =>
      {
         if (!isCurrentMount(generation, targetContainer)) { return; }

         targetContainer.replaceChildren(datafieldEl);

         activeFieldEl = datafieldEl;
         isCustomEl = isCustomElement(activeFieldEl);
      });
   }

   /**
    * Creates and mounts a DataField form group.
    *
    * @param {unknown} currentValue - Current input value.
    *
    * @param {HTMLDivElement | HTMLFormElement} targetContainer - Container receiving the form group.
    *
    * @param {number} generation - Current mount generation.
    */
   function loadFormGroupEl(currentValue, targetContainer, generation)
   {
      /** @type {HTMLElement | undefined} */
      let formGroupEl;

      try
      {
         formGroupEl = props.datafield.toFormGroup(Object.assign({}, props.groupConfig, { rootId: uniqueId }),
          Object.assign({ disabled: !props.enabled }, props.inputConfig ?? {}, { value: currentValue }));
      }
      catch (err)
      {
         errorMessage = typeof err?.message === 'string' ? err.message : String(err);
         console.warn(err);
      }

      if (!formGroupEl)
      {
         resetContainer(targetContainer);
         return;
      }

      requestAnimationFrame(() =>
      {
         if (!isCurrentMount(generation, targetContainer)) { return; }

         targetContainer.replaceChildren(formGroupEl);

         // Find the element that has a CSS ID that starts with the unique ID.
         let activeEl;

         const elements = targetContainer.querySelectorAll(`[id^="${CSS.escape(uniqueId)}"]`);

         for (const element of elements)
         {
            if (hasSetter(element, 'value'))
            {
               activeEl = element;
               break;
            }
         }

         activeFieldEl = activeEl;

         isCustomEl = isCustomElement(activeFieldEl);
      });
   }

   /**
    * Determines whether an asynchronous mount operation is still current.
    *
    * @param {number} generation - Mount generation being checked.
    *
    * @param {HTMLDivElement | HTMLFormElement} targetContainer - Original target container.
    *
    * @returns {boolean}
    */
   function isCurrentMount(generation, targetContainer)
   {
      return generation === mountGeneration && targetContainer === containerEl;
   }

   /**
    * Determines whether an element is a custom element.
    *
    * @param {HTMLElement | undefined} element - Element to test.
    *
    * @returns {boolean}
    */
   function isCustomElement(element)
   {
      return typeof element?.tagName === 'string' && element.tagName.includes('-');
   }

   /**
    * Handles changes emitted by the active Foundry input.
    *
    * @param {Event} event - Change event.
    */
   function onChange(event)
   {
      try
      {
         const eventTarget = event.target;

         if (!CrossRealm.browser.isHTMLElement(eventTarget)) { return; }

         if (!isDataField(props.datafield)) { return; }

         const eventTargetType = /** @type {HTMLInputElement} */ (eventTarget).type;

         // Foundry custom web components do not set event target type for their own change event. Ignore change events
         // originating from internal native inputs.
         if (isCustomEl && typeof eventTargetType === 'string') { return; }

         const eventValue = eventTargetType === 'checkbox' ? /** @type {HTMLInputElement} */ (eventTarget).checked :
          /** @type {HTMLInputElement} */ (eventTarget).value;

         // Clean may correct some bad user input, but not outright validation failure.
         const newValue = props.datafield.clean(eventValue);

         const validationFailure = props.datafield.validate(newValue, { fallback: false });

         if (isDataModelValidationFailure(validationFailure))
         {
            // Set old store value on failure.
            setValue($store);

            props.onValidationFailure?.(validationFailure);
         }
         else
         {
            $store = newValue;

            // Sync the control with the canonical value returned by `clean`. This will be ignored if same value
            // otherwise will reset the control if the value has been cleaned, but differs from UI state.
            setValue(newValue);
         }
      }
      catch (err)
      {
         console.warn(err);
      }
   }

   /**
    * Resets state and removes child content from the given container.
    *
    * @param {HTMLDivElement | HTMLFormElement | undefined} [targetContainer] Container to clear.
    */
   function resetContainer(targetContainer = containerEl)
   {
      activeFieldEl = void 0;
      isCustomEl = false;

      targetContainer?.replaceChildren();
   }

   /**
    * Updates the value of the active data field element after validation.
    *
    * @param {unknown} uncleanValue - Uncleaned value to set.
    */
   function setValue(uncleanValue)
   {
      if (!activeFieldEl || !props.datafield) { return; }

      try
      {
         const newValue = props.datafield.clean(uncleanValue);

         if (activeFieldEl.value === newValue) { return; }

         const validationFailure = props.datafield.validate(newValue, { fallback: false });

         if (isDataModelValidationFailure(validationFailure)) { return; }

         if (typeof activeFieldEl._setValue === 'function')
         {
            activeFieldEl._setValue(newValue);
         }
         else
         {
            activeFieldEl.value = newValue ?? '';
         }

         if (typeof activeFieldEl._refresh === 'function') { activeFieldEl._refresh(); }
      }
      catch (err)
      {
         console.warn(err);
      }
   }
</script>

{#if errorMessage}
   <div class="tjs-panel-content tjs-panel-content--flex-row tjs-content-error">{errorMessage}</div>
{:else}
   <!-- The core `code-mirror` web component specifically searches for the closest form. -->
   <svelte:element
      this={containerTag}
      class="tjs-content-datafield standard-form"
      bind:this={containerEl}
      on:change|preventDefault|stopPropagation={onChange}
   />
{/if}

<style lang=css>
   .tjs-content-error {
      background: var(--tjs-content-error-background);
      border-color: var(--tjs-content-error-border-color);
      color: var(--tjs-content-error-color);
      padding: var(--tjs-content-gap-half, 0.5rem);
   }
</style>
