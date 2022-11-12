<script>
   import { getContext } from 'svelte';

   const internalState = getContext('#cp-state');

   const { isAlpha } = internalState.stores;
   const { textState } = internalState.colorState.stores;

   const { alpha } = textState.alpha.stores;
   const { r, g, b } = textState.rgb.stores;
</script>

<div class=input-container>
    <input aria-label="red chanel color"
           bind:value={$r}
           type=number
           min=0
           max=255
    />
    <input aria-label="green chanel color"
           bind:value={$g}
           type=number
           min=0
           max=255
    />
    <input aria-label="blue chanel color"
           bind:value={$b}
           type=number
           min=0
           max=255
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
