<script>
   import { getContext }   from 'svelte';

   import HexInput         from './HexInput.svelte';
   import HsvInput         from './HsvInput.svelte';
   import RgbInput         from './RgbInput.svelte';

   const internalState = getContext('#cp-state');

   /** @type {['HEX', 'RGB', 'HSV']} */
   const modes = ['HEX', 'RGB', 'HSV'];

   /** @type {number} */
   let mode = 0;
</script>

<div class=text-input>
    {#if mode === 0}
        <HexInput />
    {:else if mode === 1}
        <RgbInput />
    {:else}
        <HsvInput />
    {/if}
    <button aria-label="change inputs to {modes[(mode + 1) % 3]}"
            on:click={() => (mode = (mode + 1) % 3)}>{modes[mode]}
    </button>
</div>

<style>
    @import 'text-input.css';
</style>
