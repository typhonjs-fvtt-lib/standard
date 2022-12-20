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

   import { colord }            from '#runtime/color/colord';

   import { applyStyles }       from '@typhonjs-svelte/lib/action';
   import { isWritableStore }   from '@typhonjs-svelte/lib/store';
   import { isObject }          from '@typhonjs-svelte/lib/util';

   import { InternalState }     from './model/InternalState.js';

   import {
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

   // Set changes in internal color state to external prop. Set any optional store and dispatch an event.
   $: {
      const newColor = $currentColor;
      color = newColor;

      // Note: We must store `$currentColor` in a temporary variable to use below otherwise this reactive block will
      // be triggered by external changes in color.

      // If any external store is set in options then set current color.
      if (externalStore) { externalStore.set(newColor); }

      // Dispatch `on:input` event for current color.
      dispatch('input', { color: newColor });
   }

   // When `color` prop changes detect if it is an external change potentially updating internal state.
   $: if (!colord($currentColor).isEqual(color))
   {
      colorState.updateExternal(color);
   }

   // When any `externalStore` from `options` changes detect any external change potentially updating internal state.
   $: if (externalStore && !colord($currentColor).isEqual($externalStore))
   {
      colorState.updateExternal($externalStore);
   }

   /** @type {HTMLDivElement} */
   let inputEl = void 0;

   /** @type {HTMLSpanElement} */
   let spanEl = void 0;

   /**
    * Special capture handling of keyboard presses for specific actions when in popup mode like `Esc` to reset color
    * to initial state when popped up and `Enter` to close the picker container.
    *
    * @param {KeyboardEvent}    event -
    */
   function onKeypress(event)
   {
console.log(`!! TJSColordPicker - onKeypress - 0 - event.key: ${event.key}; event.code: `, event.code);
      if (!$isPopup) { return; }

      if (event.key === 'Enter' && $isPopup)
      {
console.log(`!! TJSColordPicker - onKeypress - 1`)

         const isOpen = internalState.isOpen;

         internalState.swapIsOpen();

         event.preventDefault();
         event.stopPropagation();

         if (isOpen)
         {
console.log(`!! TJSColordPicker - onKeypress - 2 - inputEl: `, inputEl)
            inputEl.focus();
         }
      }
   }
</script>

<span bind:this={spanEl}
      class=tjs-color-picker
      on:keypress|capture={onKeypress}
      style:--_tjs-color-picker-current-color-hsl={$hslString}
      style:--_tjs-color-picker-current-color-hsl-hue={$hslHueString}
      style:--_tjs-color-picker-current-color-hsla={$hslaString}
      style:--_tjs-color-picker-width-option={$width}
      style:--_tjs-color-picker-padding-option={$padding}
      use:applyStyles={styles}>
    <input name={$inputName} type=hidden value={$currentColorString}/>
    {#if $isPopup}
        <Input bind:inputEl />
    {/if}
    <MainLayout />
</span>

<style>
    span {
        position: relative;
    }
</style>
