<script>
   // import type { RgbaColor, HsvaColor, Colord } from 'colord';
   // import type { Components } from '../type/types';

   import { colord }        from '@typhonjs-fvtt/runtime/color/colord';
   import { applyStyles }   from '@typhonjs-fvtt/runtime/svelte/action';
   import { isObject }      from '@typhonjs-fvtt/runtime/svelte/util';

   import Picker            from './Picker.svelte';
   import Slider            from './Slider.svelte';
   import Alpha             from './Alpha.svelte';
   import TextInput         from './default/TextInput.svelte';
   import SliderIndicator   from './default/SliderIndicator.svelte';
   import PickerIndicator   from './default/PickerIndicator.svelte';
   import ArrowKeyHandler   from './ArrowKeyHandler.svelte';
   import PickerWrapper     from './default/PickerWrapper.svelte';
   import SliderWrapper     from './default/SliderWrapper.svelte';
   import Input             from './default/Input.svelte';
   import Wrapper           from './default/Wrapper.svelte';

   /**
    * TODO: DEFINE TYPE
    *
    * @type {Partial<Components>}
    */
   export let components = {};

   /**
    * Customization properties
	*
	* TODO: Change this to an options object
    */

   /**
    * TODO: DEFINE TYPE
    *
    * @type {object}
    */
   export let options = void 0;

   /** @type {string} */
   $: styles = isObject(options) && isObject(options.styles) ? options.styles : void 0;

   /** @type {boolean} */
   export let isAlpha = true;

   /** @type {boolean} */
   export let isInput = true;

   /** @type {boolean} */
   export let isTextInput = true;

   /** @type {boolean} */
   export let isPopup = isInput;

   /** @type {boolean} */
   export let isOpen = !isInput;

   /** @type {boolean} */
   export let toRight = false;

   /**
    * color properties
    */

   /**
    * TODO: DEFINE TYPE
    *
    * @type {RgbaColor}
    */
   export let rgb = { r: 255, g: 0, b: 0, a: 1 };

   /** @type {HsvaColor} */
   export let hsv = { h: 0, s: 1, v: 1, a: 1 };

   /** @type {string} */
   export let hex = '#ff0000';

   /** @type {Colord | undefined} */
   export let color = void 0;

   /**
    * Internal old value to trigger color conversion
    */

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
   let _hsv = { h: 0, s: 1, v: 1, a: 1 };

   /** @type {string} */
   let _hex = '#ff0000';

   /** @type {boolean} */
   let isDark = false;

   /** @type {HTMLSpanElement} */
   let span = void 0;

   /** @type {HTMLLabelElement} */
   let labelWrapper = void 0;

   /** @type {HTMLElement} */
   let wrapper = void 0;

   /**
    * TODO: DEFINE TYPE
    *
    * @type {Components}
    */
   const default_components = {
      sliderIndicator: SliderIndicator,
      pickerIndicator: PickerIndicator,
      alphaIndicator: SliderIndicator,
      pickerWrapper: PickerWrapper,
      sliderWrapper: SliderWrapper,
      alphaWrapper: SliderWrapper,
      textInput: TextInput,
      input: Input,
      wrapper: Wrapper
   };

   $: if (hsv || rgb || hex) { updateColor(); }

   /**
    * @returns {{}}
    */
   function getComponents()
   {
      return {
         ...default_components,
         ...components
      };
   }

   /**
    * @param {object} opts - Required parameters
    *
    * @param {MouseEvent}    opts.target -
    */
   function mousedown({ target })
   {
      if (isInput)
      {
         if (labelWrapper.contains(target) || labelWrapper.isSameNode(target))
         {
            isOpen = !isOpen;
         }
         else if (isOpen && !wrapper.contains(target))
         {
            isOpen = false;
         }
      }
   }

   /**
    * @param {KeyboardEvent}    e -
    */
   function keyup(e)
   {
      if (e.key === 'Tab') { isOpen = span?.contains(document.activeElement); }
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

      if (color) { isDark = color.isDark(); }

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
</script>

<ArrowKeyHandler/>

<svelte:window on:mousedown={mousedown} on:keydown={keydown} on:keyup={keyup}/>

<span bind:this={span} class=color-picker use:applyStyles={styles}>
    {#if isInput}
        <svelte:component this={getComponents().input} bind:labelWrapper bind:isOpen {hex} />
    {:else}
        <input type=hidden value={hex}/>
    {/if}

    <svelte:component this={getComponents().wrapper} bind:wrapper {isOpen} {isPopup} {toRight}>
        <Picker components={getComponents()}
                h={hsv.h}
                bind:s={hsv.s}
                bind:v={hsv.v}
                bind:isOpen
                {toRight}
                {isDark}
        />
        <Slider components={getComponents()} bind:h={hsv.h} {toRight}/>
        {#if isAlpha}
            <Alpha components={getComponents()} bind:a={hsv.a} {hex} bind:isOpen {toRight}/>
        {/if}
        {#if isTextInput}
            <svelte:component this={getComponents().textInput} bind:hex bind:rgb bind:hsv {isAlpha}/>
        {/if}
    </svelte:component>
</span>

<style>
    span {
        position: relative;
    }
</style>
