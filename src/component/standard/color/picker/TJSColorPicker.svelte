<script>
   // import type { RgbaColor, HsvaColor, Colord } from 'colord';
   // import type { Components } from '../type/types';

   import { setContext}     from 'svelte';

   import { colord }        from '@typhonjs-fvtt/runtime/color/colord';
   import { applyStyles }   from '@typhonjs-fvtt/runtime/svelte/action';
   import { isObject }      from '@typhonjs-fvtt/runtime/svelte/util';

   import { HSVColorState } from './model/HSVColorState.js';
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

   /**
    * TODO: DEFINE TYPE
    *
    * @type {RgbaColor}
    */
   export let rgb = void 0;

   /** @type {HsvaColor} */
   export let hsv = void 0;

   /** @type {string} */
   export let hex = void 0;

   if (rgb === void 0) { rgb = { r: 255, g: 0, b: 0, a: 1 }; }
   if (hsv === void 0) { hsv = { h: 0, s: 100, v: 100, a: 1 }; }
   if (hex === void 0) { hex = '#ff0000'; }

   /**
    * User settable options / customization properties.
    *
    * @type {TJSColorPickerOptions}
    */
   export let options = void 0;

   const internalState = new InternalState($$props, options);

   const components = internalState.stores.components;

   const isAlpha = internalState.stores.isAlpha;
   const isDark = internalState.stores.isDark;
   const isPopup = internalState.stores.isPopup;
   const isTextInput = internalState.stores.isTextInput;

   setContext('#cp-state', internalState);

   /**
    * Internal color state
    */
   const colorState = new HSVColorState();

   /** @type {object} */
   $: styles = isObject(options) && isObject(options.styles) ? options.styles : void 0;

   $: internalState.update(options);

console.log(`!! TJSColorPicker - ctor - $$props: `, $$props)
   /**
    * Internal old value to trigger color conversion
    */

   /** @type {Colord | undefined} */
   let color = void 0;

   /**
    * TODO: DEFINE TYPE
    *
    * @type {RgbaColor}
    */
   let _rgb = { r: 255, g: 0, b: 0, a: 1 };

   /**
    * TODO: DEFINE TYPE
    *
    * @type {HsvaColor}
    */
   let _hsv = { h: 0, s: 100, v: 100, a: 1 };

   /** @type {string} */
   let _hex = '#ff0000';

   /** @type {HTMLSpanElement} */
   let span = void 0;

   $: if (hsv || rgb || hex)
   {
      updateColor();
   }

   // When alpha is set to false externally ensure local state is correct.
   $: if (!$isAlpha)
   {
      hsv.a = 1;
   }

   /**
    * using a function seems to trigger the exported value change only once when all of them has been updated
    * and not just after the hsv change
    */
   function updateColor()
   {
      // reinitialize empty alpha values
      if (hsv.a === undefined) { hsv.a = 1; }
      if (_hsv.a === undefined) { _hsv.a = 1; }

      if (rgb.a === undefined) { rgb.a = 1; }
      if (_rgb.a === undefined) { _rgb.a = 1; }

      // TODO: REVIEW IF DUPLICATED LINE IS NECESSARY
      if (hex?.substring(7) === 'ff') { hex = hex.substring(0, 7); }
      if (hex?.substring(7) === 'ff') { hex = hex.substring(0, 7); }

      // check which color format changed and updates the others accordingly
      if (hsv.h !== _hsv.h || hsv.s !== _hsv.s || hsv.v !== _hsv.v || hsv.a !== _hsv.a)
      {
         color = colord(hsv);
         rgb = color.toRgb();
         hex = color.toHex();
      }
      else if (rgb.r !== _rgb.r || rgb.g !== _rgb.g || rgb.b !== _rgb.b || rgb.a !== _rgb.a)
      {
         color = colord(rgb);
         hex = color.toHex();
         hsv = color.toHsv();
      }
      else if (hex !== _hex)
      {
         color = colord(hex);
         rgb = color.toRgb();
         hsv = color.toHsv();
      }

      if (color) { $isDark = color.isDark(); }

      // update old colors
      _hsv = Object.assign({}, hsv);
      _rgb = Object.assign({}, rgb);
      _hex = hex;
   }

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
    <input type=hidden value={hex}/>
    {#if $isPopup}
        <Input {hex} />
    {/if}
    <svelte:component this={$components.wrapper}>
        <Picker h={hsv.h}
                bind:s={hsv.s}
                bind:v={hsv.v}
        />
        <Slider bind:h={hsv.h} />
        {#if $isAlpha}
            <Alpha bind:a={hsv.a} {hex} />
        {/if}
        {#if $isTextInput}
            <svelte:component this={$components.textInput} bind:hex bind:rgb bind:hsv />
        {/if}
    </svelte:component>
</span>

<style>
    span {
        position: relative;
    }
</style>
