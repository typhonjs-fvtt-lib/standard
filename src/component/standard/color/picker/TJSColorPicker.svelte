<script>
   // import type { RgbaColor, HsvaColor, Colord } from 'colord';

   import { setContext}     from 'svelte';

   import { applyStyles }   from '@typhonjs-fvtt/runtime/svelte/action';
   import { isObject }      from '@typhonjs-fvtt/runtime/svelte/util';

   import { InternalState } from './model/InternalState.js';

   import {
      Alpha,
      ArrowKeyHandler,
      Input,
      Picker,
      Slider }              from './base/index.js'

   /**
    * color properties
    */
   export let color = void 0;

   /**
    * User settable options / customization properties.
    *
    * @type {TJSColorPickerOptions}
    */
   export let options = void 0;

   const internalState = new InternalState($$props, options);

   setContext('#cp-state', internalState);

   const {
      components,
      isAlpha,
      isDark,
      isPopup,
      isTextInput
   } = internalState.stores;

console.log(`!! TJSColorPicker - ctor - $$props: `, $$props)

   const colorState = internalState.colorState;
   const { hsv } = colorState.stores;

   /** @type {HTMLSpanElement} */
   let span = void 0;

   /** @type {object} */
   $: styles = isObject(options) && isObject(options.styles) ? options.styles : void 0;

   // When options changes update external options.
   $: internalState.update(options);

   // When `color` changes detect if it is an external change and update internal state accordingly.
   $: if (color) { colorState.updateExternal(color); }

   $: if ($colorState)
   {
      color = colorState.getExternalColor();
// console.log(`!! TJSColorPicker - $colorState - 0 - color: `, color);
   }

   // When alpha is set to false externally ensure local state is correct.
   $: if (!$isAlpha) { $hsv.a = 1; }

   /**
    * @param {KeyboardEvent}    e -
    */
   function keydown(e)
   {
      if (e.key === 'Tab')
      {
         span.classList.add('has-been-tabbed');
      }
   }

   /**
    * @param {KeyboardEvent}    e -
    */
   function keyup(e)
   {
      if (e.key === 'Tab' && $isPopup)
      {
         internalState.isOpen = span?.contains(document.activeElement);
      }
   }
</script>

<ArrowKeyHandler/>

<svelte:window on:keydown={keydown} on:keyup={keyup}/>

<span bind:this={span} class=color-picker use:applyStyles={styles}>
<!--    <input type=hidden value={hex}/>-->
    {#if $isPopup}
        <Input />
    {/if}
    <svelte:component this={$components.wrapper}>
        <Picker />
        <Slider />
        {#if $isAlpha}
            <Alpha />
        {/if}
        {#if $isTextInput}
            <svelte:component this={$components.textInput} />
        {/if}
    </svelte:component>
</span>

<style>
    span {
        position: relative;
    }
</style>
