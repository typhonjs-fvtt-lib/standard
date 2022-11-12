<script>
   import { getContext }   from 'svelte';

   const internalState = getContext('#cp-state');

   const { isAlpha } = internalState.stores;
   const { textState } = internalState.colorState.stores;

   const { alpha } = textState.alpha.stores;
   const { hex, isHexValid } = textState.hex.stores;
</script>

<div class=input-container>
    <input aria-label="hex color"
           class:is-input-invalid={!$isHexValid}
           bind:value={$hex}
           style="flex: 3"
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
