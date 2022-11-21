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
</style>
