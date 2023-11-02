<script>
   /**
    * --tjs-default-text-shadow-focus-hover: system default
    * --tjs-default-outline-focus-visible: undefined; global replacement for focus-visible outline.
    *
    * --tjs-file-slot-button-background
    * --tjs-file-slot-button-background-focus
    * --tjs-file-slot-button-background-focus-visible
    * --tjs-file-slot-button-background-hover
    * --tjs-file-slot-button-border
    * --tjs-file-slot-button-border-radius
    * --tjs-file-slot-button-box-shadow-focus-visible
    * --tjs-file-slot-button-cursor
    * --tjs-file-slot-button-diameter
    * --tjs-file-slot-button-outline-focus-visible
    * --tjs-file-slot-button-transition
    * --tjs-file-slot-button-transition-focus-visible
    */
   import {
      createEventDispatcher,
      setContext }                  from '#svelte';
   import { writable }              from '#svelte/store';

   import { applyStyles }           from '#runtime/svelte/action/dom';
   import { findParentElement }     from '#runtime/util/browser';
   import { isObject }              from '#runtime/util/object';
   import { isWritableStore }       from '#runtime/util/store';

   import { FVTTFilePickerControl } from '#standard/application';

   export let filepath = '';
   export let button = void 0;
   export let pickerOptions = void 0;

   export let styles = void 0;
   export let efx = void 0;
   export let keyCode = void 0;
   export let onPress = void 0;
   export let onContextMenu = void 0;
   export let onClickPropagate = void 0;

   const dispatch = createEventDispatcher();

   const s_EFX_DEFAULT = () => {};

   const storeFilepath = writable(filepath);
   setContext('filepath', storeFilepath);

   let efxEl;

   $: styles = isObject(button) && isObject(button.styles) ? button.styles :
    isObject(styles) ? styles : void 0;
   $: efx = isObject(button) && typeof button.efx === 'function' ? button.efx :
    typeof efx === 'function' ? efx : s_EFX_DEFAULT;
   $: keyCode = isObject(button) && typeof button.keyCode === 'string' ? button.keyCode :
    typeof keyCode === 'string' ? keyCode : 'Enter';

   $: onPress = isObject(button) && typeof button.onPress === 'function' ? button.onPress :
    typeof onPress === 'function' ? onPress : void 0;
   $: onContextMenu = isObject(button) && typeof button.onContextMenu === 'function' ? button.onContextMenu :
    typeof onContextMenu === 'function' ? onContextMenu : void 0;

   $: onClickPropagate = isObject(button) && typeof button.onClickPropagate === 'boolean' ? button.onClickPropagate :
    typeof onClickPropagate === 'boolean' ? onClickPropagate : false;

   $: pickerOptions = isObject(button) && isObject(button.pickerOptions) ? button.pickerOptions :
    isObject(pickerOptions) ? pickerOptions : void 0;

   // When filepath changes from internal / external set any pickerOptions store and invoke any `onFilepath` callback.
   $: if (filepath?.length)
   {
      if (isWritableStore(pickerOptions?.store)) { pickerOptions.store.set(filepath); }

      if (typeof pickerOptions?.onFilepath === 'function') { pickerOptions.onFilepath(filepath);}

      // Set context store.
      $storeFilepath = filepath;
   }

   // ----------------------------------------------------------------------------------------------------------------

   /**
    * Invokes the Foundry file picker.
    */
   async function invokePicker(event)
   {
      // Bring any existing file picker to the top and on success return immediately as this is a successive invocation.
      if (typeof pickerOptions?.id === 'string' && FVTTFilePickerControl.bringToTop(pickerOptions?.id)) { return; }

      // Locate any parent glasspane in order to promote the file picker app to the associated container.
      const glasspaneEl = findParentElement({ source: event.target, class: 'tjs-glass-pane' });

      // Add any glasspane ID to `pickerOptions`.
      const options = isObject(pickerOptions) ? { ...pickerOptions, glasspaneId: glasspaneEl?.id } :
       { glasspaneId: glasspaneEl?.id }

      const result = await FVTTFilePickerControl.browse(options);

      if (result)
      {
         let validated = true;

         if (typeof pickerOptions?.onValidate === 'function')
         {
            validated = pickerOptions.onValidate(result);
            if (typeof validated !== 'boolean')
            {
               console.warn(`FVTTFilePickerBrowseOptions.onValidate warning: 'onValidate' did not return a boolean.`);
               return;
            }
         }

         if (validated) { filepath = result; }
      }
   }

   /**
    * Handle click event.
    *
    * @param {MouseEvent}    event -
    */
   function onClick(event)
   {
      invokePicker(event);

      if (typeof onPress === 'function') { onPress({ event }); }

      dispatch('press', { event });

      if (!onClickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * @param {MouseEvent}   event -
    */
   function onContextMenuPress(event)
   {
      if (typeof onContextMenu === 'function') { onContextMenu({ event }); }

      if (!onClickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * Consume / stop propagation of key down when key codes match.
    *
    * @param {KeyboardEvent}    event -
    */
   function onKeydown(event)
   {
      if (event.code === keyCode)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * Handle press event if key codes match.
    *
    * @param {KeyboardEvent}    event -
    */
   function onKeyup(event)
   {
      if (event.code === keyCode)
      {
         // Because the efx is not the key event listener forward on a new event to trigger effect.
         if (efxEl) { efxEl.dispatchEvent(new KeyboardEvent(event.type, { key: event.key, code: event.code })); }

         invokePicker(event);

         if (typeof onPress === 'function') { onPress({ event }); }

         dispatch('press', { event });

         event.preventDefault();
         event.stopPropagation();
      }
   }
</script>

<div class=tjs-file-slot-button
     on:click={onClick}
     on:contextmenu={onContextMenuPress}
     on:keydown={onKeydown}
     on:keyup={onKeyup}
     on:click
     on:contextmenu
     role=button
     tabindex=0
     use:applyStyles={styles}>
   <slot />
   {#if efx !== s_EFX_DEFAULT}
      <div bind:this={efxEl}
           class=tjs-file-slot-button-efx
           use:efx />
   {/if}
</div>

<style>
    .tjs-file-slot-button {
        position: relative;

        height: var(--tjs-file-slot-button-diameter, fit-content);
        width: var(--tjs-file-slot-button-diameter, fit-content);

        background: var(--tjs-file-slot-button-background);
        border: var(--tjs-file-slot-button-border, var(--tjs-input-border));
        border-radius: var(--tjs-file-slot-button-border-radius, var(--tjs-input-border-radius));
        cursor: var(--tjs-file-slot-button-cursor, pointer);
        transition: var(--tjs-file-slot-button-transition, background 0.2s ease-in-out);
    }

    .tjs-file-slot-button:focus {
        background: var(--tjs-file-slot-button-background-focus);
    }

    .tjs-file-slot-button:focus-visible {
        background: var(--tjs-file-slot-button-background-focus-visible);
        box-shadow: var(--tjs-file-slot-button-box-shadow-focus-visible, var(--tjs-default-box-shadow-focus-visible));
        outline: var(--tjs-file-slot-button-outline-focus-visible, var(--tjs-default-outline-focus-visible, revert));
        transition: var(--tjs-file-slot-button-transition-focus-visible, var(--tjs-default-transition-focus-visible));
    }

    .tjs-file-slot-button:hover {
        background: var(--tjs-file-slot-button-background-hover);
    }

    /**
     * The efx overlay
     */
    .tjs-file-slot-button-efx {
       position: absolute;
       top: 0;
       left: 0;

       height: 100%;
       width: 100%;

       overflow: hidden;
    }
</style>
