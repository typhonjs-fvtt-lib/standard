<script>
   import { getContext } from 'svelte';

   import { TJSInput }   from '../../../form/input/index.js'

   const internalState = getContext('#tjs-color-picker-state');

   const { isAlpha } = internalState.stores;
   const { textState } = internalState.colorState.stores;

   const activeTextState = textState.activeState;
   const { alpha } = textState.alpha.inputData;
</script>

<div class=picker-text-input>
   <div class=input-container>
      {#each $activeTextState.inputData as input (input.pickerLabel)}
         <TJSInput {input} />
      {/each}
      {#if $isAlpha && $activeTextState.hasAlpha}
         <TJSInput input={alpha} />
      {/if}
   </div>
   <div class=input-attributes
        role=button
        aria-label="next color format"
        tabindex=0
        on:click|preventDefault={() => activeTextState.next()}
        on:keydown|preventDefault={(event) => { if (event.code === 'Space') { activeTextState.next() } }}>

      {#each $activeTextState.inputData as input (input.pickerLabel)}
         <span>{input.pickerLabel}</span>
      {/each}
      {#if $isAlpha && $activeTextState.hasAlpha}
         <span>A</span>
      {/if}
   </div>
</div>

<style>
    .picker-text-input {
       display: flex;
       flex-direction: column;

       --tjs-input-flex: 1;
       --tjs-input-value-invalid-color: red;
       --tjs-input-text-align: center;
       --tjs-input-width: 5px;
    }

    @container tjs-color-picker-container (min-width: 0) {
       .picker-text-input {
          gap: max(3px, 2cqw);
       }

       /* Child text input components */
       .input-container {
          display: flex;
          flex: 1;
          gap: min(8px, 2cqw);
       }

       .input-attributes {
          display: flex;
          flex: 1;
          gap: min(8px, 2cqw);

          border-radius: 4px;

          background: rgba(0, 0, 0, 0.1);
          cursor: pointer;
          text-align: center
       }

       .input-attributes span {
          flex: 1;
       }
    }

    @container tjs-color-picker-container (0 <= width < 235px) {
       .picker-text-input {
          font-size: max(0.35em, 0.35em + 3.885cqi);
          --tjs-input-height: max(8px, 8px + 7.65cqi);

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
          font-size: 1em;
          --tjs-input-height: 26px;

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
