<script>
   import { getContext } from 'svelte';

   const internalState = getContext('#tjs-color-picker-state');

   const { activeTextMode } = internalState.colorState.stores;
</script>

<div class=text-input>
   <section>
      <svelte:component this={$activeTextMode.mode.class} />
   </section>
   <button aria-label="next color format"
           on:click={() => activeTextMode.prevMode()}>{$activeTextMode.mode.name}
   </button>
</div>

<style>
    @import 'text-input.css';

    .text-input {
       display: flex;
       flex-direction: column;

       --tjs-input-flex: 1;
       --tjs-input-value-invalid-color: red;
       --tjs-input-text-align: center;
       --tjs-input-width: 5px;
    }

    @container tjs-color-picker-container (min-width: 0) {
       .text-input {
          gap: max(3px, 2cqw);
          margin-top: max(4px, 2.5cqw);
       }
    }

    @container tjs-color-picker-container (0 <= width < 235px) {
       .text-input {
          font-size: max(0.5em, 0.5em + 2.98cqi);
          --tjs-input-height: max(13px, 13px + 5cqi);

          /* For Firefox */
          --tjs-input-number-appearance: textfield;

          /* For Webkit */
          --tjs-input-number-webkit-inner-spin-button-appearance: none;
          --tjs-input-number-webkit-inner-spin-button-opacity: 0;
       }
    }

    @container tjs-color-picker-container (0 <= width < 110px) {
       section {
          display: none;
       }
    }

    @container tjs-color-picker-container (min-width: 110px) {
       section {
          display: block;
       }
    }

    @container tjs-color-picker-container (min-width: 235px) {
       .text-input {
          font-size: 1em;
          --tjs-input-height: 26px;

          /* For Firefox */
          --tjs-input-number-appearance: auto;

          /* For Webkit */
          --tjs-input-number-webkit-inner-spin-button-opacity: 1;
       }
    }
</style>
