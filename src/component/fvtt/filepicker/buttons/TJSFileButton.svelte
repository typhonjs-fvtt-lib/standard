<script>
   import { findParentElement }     from '#runtime/util/browser';
   import { isObject }              from '#runtime/util/object';
   import { isWritableStore }       from '#runtime/util/store';

   import { FVTTFilePickerControl } from '#standard/application';
   import { TJSButton }             from '#standard/component';

   export let filepath = '';

   export let button = void 0;

   export let pickerOptions = void 0;

   $: pickerOptions = isObject(button) && isObject(button.pickerOptions) ? button.pickerOptions :
    isObject(pickerOptions) ? pickerOptions : void 0;

   // When filepath changes from internal / external set the pickerOptions store.
   $: if (filepath?.length)
   {
      if (isWritableStore(pickerOptions?.store)) { pickerOptions.store.set(filepath); }
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

      const result = await FVTTFilePickerControl.browse(options);

      if (result)
      {
         filepath = result;
      }
   }
</script>

<TJSButton on:press={invokePicker} {button} icon={'fas fa-file'} />
