<script>
   // import type { RgbaColor, HsvaColor, Colord } from 'colord';
   // import type { A11yColor, Components } from '../type/types';

   import {
	   colord,
	   extend } 			from '@typhonjs-fvtt/runtime/color/colord';

   import { a11yPlugin }    from '@typhonjs-fvtt/runtime/color/colord-plugins';

   import Picker            from './Picker.svelte';
   import Slider            from './Slider.svelte';
   import Alpha             from './Alpha.svelte';
   import TextInput         from './variant/default/TextInput.svelte';
   import SliderIndicator   from './variant/default/SliderIndicator.svelte';
   import PickerIndicator   from './variant/default/PickerIndicator.svelte';
   import ArrowKeyHandler   from './ArrowKeyHandler.svelte';
   import PickerWrapper     from './variant/default/PickerWrapper.svelte';
   import SliderWrapper     from './variant/default/SliderWrapper.svelte';
   import Input             from './variant/default/Input.svelte';
   import Wrapper           from './variant/default/Wrapper.svelte';
   import A11yNotice        from './variant/default/A11yNotice.svelte';
   import A11ySingleNotice  from './variant/default/A11ySingleNotice.svelte';
   import A11ySummary       from './variant/default/A11ySummary.svelte';

   extend([a11yPlugin]);

   /**
    * TODO: DEFINE TYPE
    *
    * @type {Partial<Components>}
    */
   export let components = {};

   /**
    * Customization properties
    */

   /** @type {string} */
   export let label = 'Choose a color';

   /** @type {boolean} */
   export let isAlpha = true;

   /** @type {boolean} */
   export let isInput = true;

   /** @type {boolean} */
   export let isTextInput = true;

   /** @type {boolean} */
   export let isA11y = false;

   /**
    * TODO: DEFINE TYPE
    *
    * @type {Array<A11yColor>}
    */
   export let a11yColors = [{hex: '#ffffff'}];

   /** @type {string} */
   export let a11yGuidelines =
    '<p style="margin: 0; font-size: 12px;">Learn more at <a href="https://webaim.org/articles/contrast/" target="_blank">WebAIM contrast guide</a></p>';

   /** @type {boolean} */
   export let isA11yOpen = false;

   /** @type {boolean} */
   export let isA11yClosable = true;

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
   export let rgb = {r: 255, g: 0, b: 0, a: 1};

   /** @type {HsvaColor} */
   export let hsv = {h: 0, s: 1, v: 1, a: 1};

   /** @type {string} */
   export let hex = '#ff0000';

   /** @type {Colord | undefined} */
   export let color = void 0;

   /** @type {boolean} */
   export let isDark = false;

   /**
    * Internal old value to trigger color conversion
    */

   /**
    * TODO: DEFINE TYPE
    *
    * @type {RgbaColor}
    */
   let _rgb = {r: 255, g: 0, b: 0, a: 1};

   /**
    * TODO: DEFINE TYPE
    *
    * @type {HsvaColor}
    */
   let _hsv = {h: 0, s: 1, v: 1, a: 1};

   /** @type {string} */
   let _hex = '#ff0000';

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
      a11yNotice: A11yNotice,
      a11ySingleNotice: A11ySingleNotice,
      a11ySummary: A11ySummary,
      input: Input,
      wrapper: Wrapper
   };

   $: if (hsv || rgb || hex)
   {
      updateColor();
   }

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
   function mousedown({target})
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
      if (e.key === 'Tab')
      {
         isOpen = span?.contains(document.activeElement);
      }
   }

   /**
    * using a function seems to trigger the exported value change only once when all of them has been updated
    * and not just after the hsv change
    */
   function updateColor()
   {
      // reinitialize empty alpha values
      if (hsv.a === undefined)
      {
         hsv.a = 1;
      }
      if (_hsv.a === undefined)
      {
         _hsv.a = 1;
      }
      if (rgb.a === undefined)
      {
         rgb.a = 1;
      }
      if (_rgb.a === undefined)
      {
         _rgb.a = 1;
      }
      if (hex?.substring(7) === 'ff')
      {
         hex = hex.substring(0, 7);
      }
      if (hex?.substring(7) === 'ff')
      {
         hex = hex.substring(0, 7);
      }

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

      if (color)
      {
         isDark = color.isDark();
      }

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

<span bind:this={span} class="color-picker">
	{#if isInput}
		<svelte:component this={getComponents().input} bind:labelWrapper bind:isOpen {hex} {label}/>
	{:else}
		<input type="hidden" value={hex}/>
	{/if}

    <svelte:component this={getComponents().wrapper} bind:wrapper {isOpen} {isPopup} {toRight}>
		<Picker
                components={getComponents()}
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
        {#if isA11y}
			<svelte:component
                    this={getComponents().a11yNotice}
                    components={getComponents()}
                    {a11yColors}
                    {color}
                    {hex}
                    {a11yGuidelines}
                    {isA11yOpen}
                    {isA11yClosable}
            />
		{/if}
	</svelte:component>
</span>

<style>
    span {
        position: relative;
    }
</style>
