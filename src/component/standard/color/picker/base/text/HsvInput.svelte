<script>
   import { getContext } from 'svelte';

   const internalState = getContext('#tjs-color-picker-state');

   const { isAlpha } = internalState.stores;
   const { textState } = internalState.colorState.stores;

   const { alpha } = textState.alpha.stores;
   const { h, s, v } = textState.hsv.stores;
</script>

<div class=input-container>
    <input aria-label="hue chanel color"
           bind:value={$h}
           type=number
           min=0
           max=360
    />
    <input aria-label="saturation chanel color"
           bind:value={$s}
           type=number
           min=0
           max=100
    />
    <input aria-label="brightness chanel color"
           bind:value={$v}
           type=number
           min=0
           max=100
    />
    {#if $isAlpha}
        <input aria-label="transparency chanel color"
               bind:value={$alpha}
               type=number
               min=0
               max=1
               step=0.01
        />
    {/if}
</div>

