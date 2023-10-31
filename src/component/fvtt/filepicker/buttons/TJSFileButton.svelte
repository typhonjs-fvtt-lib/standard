<script>
   import { createEventDispatcher } from '#svelte';

   import { applyStyles }           from '#runtime/svelte/action/dom';
   import { localize }              from '#runtime/svelte/helper';
   import { findParentElement }     from '#runtime/util/browser';
   import { isObject }              from '#runtime/util/object';
   import { isWritableStore }       from '#runtime/util/store';

   import { FVTTFilePicker }        from '#standard/application';

   export let filepath = '';

   export let button = void 0;

   export let pickerOptions = void 0;

   // Button props --------------------------------------------------------------------------------------------------

   export let icon = 'fas fa-file';

   export let label = void 0;

   export let title = void 0;

   export let styles = void 0;

   export let efx = void 0;

   export let onPress = void 0;
   export let onContextMenu = void 0;
   export let onClickPropagate = void 0;

   const dispatch = createEventDispatcher();

   /** @type {HTMLButtonElement} */
   let buttonEl;

   // ----------------------------------------------------------------------------------------------------------------

   $: icon = isObject(button) && typeof button.icon === 'string' ? button.icon :
    typeof icon === 'string' ? icon : 'fas fa-file';

   $: label = isObject(button) && typeof button.label === 'string' ? button.label :
    typeof label === 'string' ? label : void 0;

   $: title = isObject(button) && typeof button.title === 'string' ? button.title :
    typeof title === 'string' ? title : void 0;

   $: styles = isObject(button) && isObject(button.styles) ? button.styles :
    isObject(styles) ? styles : void 0;

   $: efx = isObject(button) && typeof button.efx === 'function' ? button.efx :
    typeof efx === 'function' ? efx : () => {};

   $: onPress = isObject(button) && typeof button.onPress === 'function' ? button.onPress :
    typeof onPress === 'function' ? onPress : void 0;

   $: onContextMenu = isObject(button) && typeof button.onContextMenu === 'function' ? button.onContextMenu :
    typeof onContextMenu === 'function' ? onContextMenu : void 0;

   $: onClickPropagate = isObject(button) && typeof button.onClickPropagate === 'boolean' ? button.onClickPropagate :
    typeof onClickPropagate === 'boolean' ? onClickPropagate : false;

   $: pickerOptions = isObject(button) && isObject(button.pickerOptions) ? button.pickerOptions :
    isObject(pickerOptions) ? pickerOptions : void 0;

   // ----------------------------------------------------------------------------------------------------------------

   /**
    * Invokes the Foundry file picker.
    */
   async function invokePicker()
   {
      // Bring any existing file picker to the top and on success return immediately as this is a successive invocation.
      if (typeof pickerOptions?.id === 'string' && FVTTFilePicker.bringToTop(pickerOptions?.id)) { return; }

      // Locate any parent glasspane in order to promote the file picker app to the associated container.
      const glasspaneEl = findParentElement({ source: buttonEl, class: 'tjs-glass-pane' });

      // Add any glasspane ID to `pickerOptions`.
      const options = isObject(pickerOptions) ? { ...pickerOptions, glasspaneId: glasspaneEl?.id } :
       { glasspaneId: glasspaneEl?.id }

      const result = await FVTTFilePicker.browse(options);

      if (result)
      {
         filepath = result;
         if (isWritableStore(pickerOptions?.store)) { pickerOptions.store.set(result); }
      }
   }

   /**
    * Handle click event.
    *
    * @param {MouseEvent}    event -
    */
   function onClick(event)
   {
      if (typeof onPress === 'function') { onPress(); }

      dispatch('press');

      invokePicker();

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
      if (typeof onContextMenu === 'function') { onContextMenu(); }

      if (!onClickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }
</script>

<button bind:this={buttonEl}
        class=tjs-file-button
        on:click={onClick}
        on:contextmenu={onContextMenuPress}
        on:click
        on:contextmenu
        title={localize(title)}
        use:applyStyles={styles}
        use:efx>
   <i class={icon}></i>
   {localize(label)}
</button>

<style>
   button {
      display: flex;
      align-items: center;
      gap: 0.25em;

      /* TODO: Consider setting default values from Foundry styles via TJSStyleManager / cssVariables defined in root index.js
      /*background: var(--tjs-file-button-background, var(--tjs-button-background));*/
      /*border: var(--tjs-file-button-border, var(--tjs-button-border));*/
      /*border-radius: var(--tjs-file-button-border-radius, var(--tjs-button-border-radius));*/
      /*border-width: var(--tjs-file-button-border-width, var(--tjs-button-border-width));*/

      cursor: var(--tjs-file-button-cursor, var(--tjs-button-cursor, pointer));
      height: var(--tjs-file-button-height, var(--tjs-input-height, inherit));
      width: var(--tjs-file-button-width, fit-content);
   }

   button:hover {
      box-shadow: var(--tjs-file-button-box-shadow-focus-hover, var(--tjs-default-box-shadow-focus-hover));
      outline: var(--tjs-file-button-outline-focus-hover, var(--tjs-default-outline-focus-hover, revert));
      transition: var(--tjs-file-button-transition-focus-hover, var(--tjs-default-transition-focus-hover));
      text-shadow: var(--tjs-file-button-text-shadow-focus-hover, var(--tjs-default-text-shadow-focus-hover, inherit));
   }

   button:focus-visible {
      box-shadow: var(--tjs-file-button-box-shadow-focus-visible, var(--tjs-default-box-shadow-focus-visible));
      outline: var(--tjs-file-button-outline-focus-visible, var(--tjs-default-outline-focus-visible, revert));
      transition: var(--tjs-file-button-transition-focus-visible, var(--tjs-default-transition-focus-visible));
      text-shadow: var(--tjs-file-button-text-shadow-focus-visible, var(--tjs-default-text-shadow-focus-hover, inherit));
   }

   i {
      margin: unset;
   }
</style>
