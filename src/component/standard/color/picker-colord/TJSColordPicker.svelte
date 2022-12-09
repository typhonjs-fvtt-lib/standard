<script>
   // import type { RgbaColor, HsvaColor, Colord } from 'colord';

   import {
      getContext,
      onDestroy,
      setContext }          from 'svelte';

   import { colord }        from '@typhonjs-fvtt/runtime/color/colord';

   import { applyStyles }   from '@typhonjs-svelte/lib/action';
   import { isObject }      from '@typhonjs-svelte/lib/util';

   import { InternalState } from './model/InternalState.js';

   import {
      ArrowKeyHandler,
      Input,
      MainLayout }          from './view/index.js'

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

   const external = getContext('external');

   const internalState = new InternalState(color, options, external?.sessionStorage);

   setContext('#tjs-color-picker-state', internalState);

   const {
      components,
      isPopup,
      width
   } = internalState.stores;

   const colorState = internalState.colorState;

   const {
      hslString,
      hslHueString,
      hslaString,
      currentColor
   } = colorState.stores;

   onDestroy(() => internalState.destroy());

   /** @type {object} */
   $: styles = isObject(options) && isObject(options.styles) ? options.styles : void 0;

   // When options changes update internal state.
   $: internalState.updateOptions(options);

   $: color = $currentColor;

   // When `color` prop changes detect if it is an external change potentially updating internal state.
   $: if (!colord($currentColor).isEqual(color)) { colorState.updateExternal(color); }

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
      style:--tjs-color-picker-container-width={$width}
      use:applyStyles={styles}>
    <input type=hidden value={$hslaString}/>
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
