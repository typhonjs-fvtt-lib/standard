<script>
   import { getContext } from '#svelte';

   import { TJSInput }   from '../../../form/input/index.js'

   const internalState = getContext('#tjs-color-picker-state');
   const colorState = internalState.colorState;

   const { hasAlpha, isOpen, isPopup, lockTextFormat } = internalState.stores;
   const { textState } = colorState.stores;

   const activeTextState = textState.activeState;
   const { alpha } = textState.alpha.inputData;

   /**
    * When in popout mode and not open reset active text state to the current color format.
    */
   $: if ($isPopup && !$isOpen)
   {
      activeTextState.setFormat(colorState.format);
   }

   /**
    * Advances color format on click.
    */
   function onClick()
   {
      if (!$lockTextFormat) { activeTextState.next(); }
   }

   function onKeydown(event)
   {
      if (event.code === 'Space')
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * Advances color format on `Space` key up.
    *
    * @param {KeyboardEvent}  event -
    */
   function onKeyup(event)
   {
      if (!$lockTextFormat && event.code === 'Space')
      {
         activeTextState.next();

         event.preventDefault();
         event.stopPropagation();
      }
   }
</script>

<div class=picker-text-input>
   <div class=input-container>
      {#each $activeTextState.inputData as input (input.pickerLabel)}
         <TJSInput {input} />
      {/each}
      {#if $hasAlpha && $activeTextState.hasAlpha}
         <TJSInput input={alpha} />
      {/if}
   </div>
   <div class=input-attributes
        role=button
        aria-label="next color format"
        tabindex={!$lockTextFormat ? 0 : -1}
        class:lock-text-format={$lockTextFormat}
        on:click|preventDefault={onClick}
        on:keydown={onKeydown}
        on:keyup={onKeyup}>

      {#each $activeTextState.inputData as input (input.pickerLabel)}
         <span>{input.pickerLabel}</span>
      {/each}
      {#if $hasAlpha && $activeTextState.hasAlpha}
         <span>A</span>
      {/if}
   </div>
</div>

<style>
    .input-attributes {
       display: flex;
       flex: 1;

       background: var(--tjs-color-picker-overlay-background, rgba(0, 0, 0, 0.1));
       border: var(--tjs-input-number-border, var(--tjs-input-border));
       border-radius: 0.25em;

       cursor: pointer;
       text-align: center;
    }

    .input-attributes:focus-visible {
       box-shadow: var(--tjs-color-picker-box-shadow-focus-visible, var(--tjs-default-box-shadow-focus-visible));
       outline: var(--tjs-color-picker-outline-focus-visible, var(--tjs-default-outline-focus-visible, revert));
       transition: var(--tjs-color-picker-transition-focus-visible, var(--tjs-default-transition-focus-visible));
    }

    .input-attributes.lock-text-format {
       cursor: default;
    }

    .input-attributes span {
       flex: 1;
    }

    /* Child text input components */
    .input-container {
       display: flex;
       flex: 1;
    }

    .picker-text-input {
       display: flex;
       flex-direction: column;

       --tjs-input-flex: 1;
       --tjs-input-text-align: center;
       --tjs-input-width: 0; /* Required for Firefox / flex layout will resize */
    }

    @container tjs-color-picker-container (min-width: 0) {
       .picker-text-input {
          gap: max(3px, 2cqw);
       }

       /* Child text input components */
       .input-container {
          gap: min(8px, 2cqw);
       }

       .input-attributes {
          gap: min(8px, 2cqw);
       }
    }

    @container tjs-color-picker-container (0 <= width < 235px) {
       .picker-text-input {
          /* For Firefox */
          --tjs-input-number-appearance: textfield;

          /* For Webkit */
          --tjs-input-number-webkit-inner-spin-button-appearance: none;
          --tjs-input-number-webkit-inner-spin-button-opacity: 0;
       }
    }

    @container tjs-color-picker-container (width < 115px) {
       .picker-text-input {
          display: none;
       }
    }

    @container tjs-color-picker-container (min-width: 115px) {
       .picker-text-input {
          display: flex;
       }
    }

    @container tjs-color-picker-container (min-width: 235px) {
       .picker-text-input {
          /* For Firefox */
          --tjs-input-number-appearance: auto;

          /* For Webkit */
          --tjs-input-number-webkit-inner-spin-button-opacity: 1;
       }

       /**
        * For Webkit: It is necessary to include an explicit style to modify -webkit-appearance otherwise Chrome posts
        * warning messages constantly if set by a CSS variable in TJSInputNumber.
        */
       .input-container :global(input[type="number"]::-webkit-inner-spin-button) {
          -webkit-appearance: inner-spin-button;
       }
    }
</style>
