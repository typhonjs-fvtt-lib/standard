<script>
   import { getContext } from 'svelte';

   const internalState = getContext('#tjs-color-picker-state');

   const { activeTextMode } = internalState.colorState.stores;
</script>

<div class=text-input>
   <svelte:component this={$activeTextMode.mode.class} />
   <button aria-label="next color format"
           on:click={() => activeTextMode.prevMode()}>{$activeTextMode.mode.name}
   </button>
</div>

<style>
    @import 'text-input.css';

    .text-input {
       display: flex;
       flex-direction: column;
    }

    @container tjs-color-picker-container (min-width: 0) {
       .text-input {
          gap: max(3px, 2cqw);
          margin-top: max(4px, 2.5cqw);
       }
    }
</style>
