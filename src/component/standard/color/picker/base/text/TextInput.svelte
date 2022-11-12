<script>
   import { getContext }   from 'svelte';

   import HexInput         from './HexInput.svelte';
   import HslInput         from './HslInput.svelte';
   import HsvInput         from './HsvInput.svelte';
   import RgbInput         from './RgbInput.svelte';

   const internalState = getContext('#tjs-color-picker-state');

   /** @type {['HEX', 'RGB', 'HSL', 'HSV']} */
   const modes = ['HEX', 'RGB', 'HSL', 'HSV'];

   /** @type {number} */
   let mode = 0;
</script>

<div class=text-input>
    {#if mode === 0}
        <HexInput />
    {:else if mode === 1}
        <RgbInput />
    {:else if mode === 2}
        <HslInput />
    {:else}
        <HsvInput />
    {/if}
    <button aria-label="change inputs to {modes[(mode + 1) % 4]}"
            on:click={() => (mode = (mode + 1) % 4)}>{modes[mode]}
    </button>
</div>

<style>
    @import 'text-input.css';
</style>
