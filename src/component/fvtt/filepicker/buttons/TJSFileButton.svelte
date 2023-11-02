<script>
   import { createEventDispatcher } from '#svelte';

   import { findParentElement }     from '#runtime/util/browser';
   import { isObject }              from '#runtime/util/object';
   import { isWritableStore }       from '#runtime/util/store';

   import { FVTTFilePickerControl } from '#standard/application';
   import { TJSButton }             from '#standard/component';

   export let filepath = '';

   export let button = void 0;

   /** @type {import('#standard/application').FVTTFilePickerBrowseOptions} */
   export let pickerOptions = void 0;

   const dispatch = createEventDispatcher();

   // ----------------------------------------------------------------------------------------------------------------

   $: pickerOptions = isObject(button) && isObject(button.pickerOptions) ? button.pickerOptions :
    isObject(pickerOptions) ? pickerOptions : void 0;

   // When filepath changes from internal / external set any pickerOptions store and invoke any `onFilepath` callback.
   $: if (filepath?.length)
   {
      if (isWritableStore(pickerOptions?.store)) { pickerOptions.store.set(filepath); }

      if (typeof pickerOptions?.onFilepath === 'function') { pickerOptions.onFilepath({ filepath });}

      dispatch('filepath', { filepath });
   }

   // ----------------------------------------------------------------------------------------------------------------

   /**
    * Invokes the Foundry file picker.
    *
    * @param {CustomEvent} event - MouseEvent.
    */
   async function invokePicker(event)
   {
      // Bring any existing file picker to the top and on success return immediately as this is a successive invocation.
      if (typeof pickerOptions?.id === 'string' && FVTTFilePickerControl.bringToTop(pickerOptions?.id)) { return; }

      // Locate any parent glasspane in order to promote the file picker app to the associated container.
      const glasspaneEl = findParentElement({ source: event.detail.event.target, class: 'tjs-glass-pane' });

      // Add any glasspane ID to `pickerOptions`.
      const options = isObject(pickerOptions) ? { ...pickerOptions, glasspaneId: glasspaneEl?.id } :
       { glasspaneId: glasspaneEl?.id }

      // Result is null when the user cancels / closes the file picker app.
      const result = await FVTTFilePickerControl.browse(options);

      if (result)
      {
         let validated = true;

         if (typeof pickerOptions?.onValidate === 'function')
         {
            validated = pickerOptions.onValidate({ filepath: result });
            if (typeof validated !== 'boolean')
            {
               console.warn(`FVTTFilePickerBrowseOptions.onValidate warning: 'onValidate' did not return a boolean.`);
               return;
            }
         }

         if (validated) { filepath = result; }
      }
   }
</script>

<TJSButton on:press={invokePicker} {button} icon={'fas fa-file'} />
