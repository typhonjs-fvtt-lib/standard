<script>
   import { getContext } from 'svelte';

   const internalState = getContext('#tjs-color-picker-state');

   const { activeTextMode } = internalState.colorState.stores;
</script>

<div class=text-input>
   <section>
      <svelte:component this={$activeTextMode.mode.class} />
   </section>
</div>

<style>
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
       }

       /* Child text input components */
       .text-input :global(.input-container) {
          display: flex;
          flex: 1;
          gap: min(8px, 2cqw);
       }

       .text-input :global(.input-attributes) {
          display: flex;
          flex: 1;
          gap: min(8px, 2cqw);

          border-radius: 4px;

          background: rgba(0, 0, 0, 0.1);
          cursor: pointer;
          margin-top: max(2px, 1cqw);
          text-align: center
       }

       .text-input :global(.input-attributes span) {
          flex: 1;
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

    @container tjs-color-picker-container (width < 110px) {
       .text-input {
          display: none;
       }
    }

    @container tjs-color-picker-container (min-width: 110px) {
       .text-input {
          display: flex;
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

       /**
        * For Webkit: It is necessary to include an explicit style to modify -webkit-appearance otherwise Chrome posts
        * warning messages constantly if set by a CSS variable in TJSInputNumber.
        */
       .text-input :global(input[type="number"]::-webkit-inner-spin-button) {
          -webkit-appearance: inner-spin-button;
       }
    }

    /* TODO: Refactor ----------------------------------------------------------------------------------------------- */
    /*button {*/
    /*   flex: 1;*/
    /*   border: none;*/
    /*   background-color: #eee;*/
    /*   padding: 0;*/
    /*   border-radius: 5px;*/
    /*   height: 30px;*/
    /*   line-height: 30px;*/
    /*   text-align: center;*/

    /*   cursor: pointer;*/
    /*   transition: background-color 0.2s;*/
    /*}*/

    /*button:hover {*/
    /*   background-color: #ccc;*/
    /*}*/

    /*button:focus {*/
    /*   outline: none;*/
    /*}*/
</style>
