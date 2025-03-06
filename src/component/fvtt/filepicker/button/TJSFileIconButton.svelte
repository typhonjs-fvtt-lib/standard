<script>
   /**
    * Provides a pre-configured icon button interfacing w/ the Foundry file picker.
    *
    * Please see {@link FVTTFilePickerBrowseOptions} for the `pickerOptions` prop.
    * Please see {@link TJSIconButton} for the button component / CSS variable support.
    *
    * This component provides one way binding by default. You may explicitly bind to the `urlString` prop to create a
    * two-way binding.
    *
    * @componentDocumentation
    */

   import { createEventDispatcher }    from '#svelte';

   import { isMinimalWritableStore }   from '#runtime/svelte/store/util';
   import { isObject }                 from '#runtime/util/object';

   import { FVTTFilePickerControl }    from '#standard/application/control/filepicker';
   import { TJSIconButton }            from '#standard/component/button';

   export let urlString = '';

   /** @type {object} */
   export let button = void 0;

   /** @type {import('#standard/application/control/filepicker').FVTTFilePickerBrowseOptions} */
   export let pickerOptions = void 0;

   const dispatch = createEventDispatcher();

   // ----------------------------------------------------------------------------------------------------------------

   $: pickerOptions = isObject(button) && isObject(button.pickerOptions) ? button.pickerOptions :
    isObject(pickerOptions) ? pickerOptions : void 0;

   // When `urlString` changes from internal / external set any pickerOptions store and invoke any `onURLString`
   // callback.
   $: if (urlString?.length)
   {
      if (isMinimalWritableStore(pickerOptions?.store)) { pickerOptions.store.set(urlString); }

      if (typeof pickerOptions?.onURLString === 'function') { pickerOptions.onURLString({ urlString }); }

      dispatch('filepicker:urlString', { urlString });
   }

   // ----------------------------------------------------------------------------------------------------------------

   /**
    * Invokes the Foundry file picker.
    *
    * @param {CustomEvent} event - TJSIconButton `press` event.
    */
   async function invokePicker(event)
   {
      // Bring any existing file picker to the top and on success return immediately as this is a successive invocation.
      if (typeof pickerOptions?.id === 'string' && FVTTFilePickerControl.bringToFront(pickerOptions?.id)) { return; }

      // Locate any parent glasspane in order to promote the file picker app to the associated container.
      const glasspaneEl = event.detail?.event?.target?.closest('.tjs-glass-pane');

      // Add any glasspane ID to `pickerOptions`.
      const options = isObject(pickerOptions) ? { ...pickerOptions, glasspaneId: glasspaneEl?.id } :
       { glasspaneId: glasspaneEl?.id };

      // Result is null when the user cancels / closes the file picker app.
      const result = await FVTTFilePickerControl.browse(options, event.detail?.event);

      if (result)
      {
         let validated = true;

         if (typeof pickerOptions?.onValidateURLString === 'function')
         {
            validated = await pickerOptions.onValidateURLString({ urlString: result });
            if (typeof validated !== 'boolean')
            {
               console.warn(`FVTTFilePickerBrowseOptions.onValidate warning: boolean not returned.`);
               return;
            }
         }

         if (validated) { urlString = result; }
      }
   }
</script>

<!-- Note: setting of icon directly. It can be customized by setting button.icon -->
<TJSIconButton on:press={invokePicker} {...$$props} icon={'fas fa-file'} />
