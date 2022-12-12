<script>
   /**
    * TODO: Finish documentation.
    *
    * Events:
    * - input: current color
    */

   import {
      createEventDispatcher,
      getContext,
      onDestroy,
      setContext }              from 'svelte';

   import { colord }            from '@typhonjs-fvtt/runtime/color/colord';

   import { applyStyles }       from '@typhonjs-svelte/lib/action';
   import { isWritableStore }   from '@typhonjs-svelte/lib/store';
   import { isObject }          from '@typhonjs-svelte/lib/util';

   import { InternalState }     from './model/InternalState.js';

   import {
      ArrowKeyHandler,
      Input,
      MainLayout }              from './view/index.js'

   /**
    * color properties
    */
   export let color = void 0;

   /**
    * User settable options / customization properties.
    *
    * @type {TJSColordPickerOptions}
    */
   export let options = void 0;

   const dispatch = createEventDispatcher();

   const external = getContext('external');

   const internalState = new InternalState(color, options, external?.sessionStorage);

   setContext('#tjs-color-picker-state', internalState);

   const {
      components,
      inputName,
      isPopup,
      padding,
      width
   } = internalState.stores;

   const colorState = internalState.colorState;

   const {
      currentColor,
      currentColorString,
      hslString,
      hslHueString,
      hslaString,
   } = colorState.stores;

   onDestroy(() => internalState.destroy());

   /** @type {object} */
   $: styles = isObject(options) && isObject(options.styles) ? options.styles : void 0;

   $: externalStore = isObject(options) && isWritableStore(options.store) ? options.store : void 0;

   // When options changes update internal state.
   $: internalState.updateOptions(options);

   $: {
      color = $currentColor;

      // If any external store is set in options then set current color.
      if (externalStore) { externalStore.set(color); }

      // Dispatch `on:input` event for current color.
      dispatch('input', { color });
   }

   // When `color` prop changes detect if it is an external change potentially updating internal state.
   $: if (!colord($currentColor).isEqual(color)) { colorState.updateExternal(color); }

   // When any `externalStore` from `options` changes detect any external change potentially updating internal state.
   $: if (externalStore && !colord($currentColor).isEqual($externalStore))
   {
      colorState.updateExternal($externalStore);
   }

   /** @type {HTMLSpanElement} */
   let spanEl = void 0;

   let hasBeenTabbed = false;

   /**
    * @param {KeyboardEvent}    e -
    */
   function keydown(e)
   {
      if (e.key === 'Tab')
      {
         hasBeenTabbed = true;
      }
   }

   /**
    * @param {KeyboardEvent}    e -
    */
   function keyup(e)
   {
      if (e.key === 'Tab' && $isPopup)
      {
         internalState.isOpen = spanEl?.contains(document.activeElement);
      }
   }
</script>

<ArrowKeyHandler/>

<svelte:window on:keydown={keydown} on:keyup={keyup}/>

<span bind:this={spanEl}
      class=tjs-color-picker
      class:has-been-tabbed={hasBeenTabbed}
      style:--_tjs-color-picker-current-color-hsl={$hslString}
      style:--_tjs-color-picker-current-color-hsl-hue={$hslHueString}
      style:--_tjs-color-picker-current-color-hsla={$hslaString}
      style:--_tjs-color-picker-width-option={$width}
      style:--_tjs-color-picker-padding-option={$padding}
      use:applyStyles={styles}>
    <input name={$inputName} type=hidden value={$currentColorString}/>
    {#if $isPopup}
        <Input />
    {/if}
    <MainLayout />
</span>

<style>
    span {
        position: relative;
    }

    /* TODO: Refactor ----------------------------------------------------------------------------------------------- */
    .tjs-color-picker.has-been-tabbed :global(.text-input button:focus-visible) {
        outline: 2px solid var(--tjs-color-picker-focus-color, red);
        outline-offset: 2px;
    }
</style>
