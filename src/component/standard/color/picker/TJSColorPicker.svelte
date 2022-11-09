<script>
   // import type { RgbaColor, HsvaColor, Colord } from 'colord';

   import {
      onDestroy,
      setContext }                  from 'svelte';

   import { applyStyles }           from '@typhonjs-fvtt/runtime/svelte/action';
   import { isObject }              from '@typhonjs-fvtt/runtime/svelte/util';

   import { InternalState }         from './model/InternalState.js';

   import {
      Alpha,
      ArrowKeyHandler,
      Input,
      Picker,
      Slider }                      from './base/index.js'

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

   const colorState = internalState.colorState;

   const {
      rgbString,
      rgbHueString,
      rgbaString,
      outputColor
   } = colorState.stores;

   onDestroy(() => internalState.destroy());

   // When alpha is set to false externally ensure local state is correct.
   // TODO: REFACTOR GENERIC COLOR STATE
   // const { hsv } = colorState.stores;
   // $: if (!$isAlpha) { $hsv.a = 1; }

   /** @type {object} */
   $: styles = isObject(options) && isObject(options.styles) ? options.styles : void 0;

   // When options changes update internal state.
   $: internalState.update(options);

//    // When internal color state changes update `color` prop.
//    $: if ($colorState)
//    {
//       color = colorState.getExternalColor();
// // console.log(`!! TJSColorPicker - $colorState - 0 - color: `, color);
//    }

   $: {
      color = $outputColor;
// console.log(`!! TJSColorPicker - $outputColor: `, $outputColor)
   }

   // When `color` prop changes detect if it is an external change potentially updating internal state.
   $: if (color)
   {
// console.log(`!! TJSColorPicker - $:color: `, color)
      colorState.updateExternal(color);
   }

   /** @type {HTMLSpanElement} */
   let span = void 0;

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

<span bind:this={span}
      class=color-picker
      style:--_tjs-color-picker-current-color-rgb={$rgbString}
      style:--_tjs-color-picker-current-color-rgb-hue={$rgbHueString}
      style:--_tjs-color-picker-current-color-rgba={$rgbaString}
      use:applyStyles={styles}>
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
