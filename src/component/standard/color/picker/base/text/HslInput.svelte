<script>
   import { getContext }    from 'svelte';

   import { rippleFocus }   from '@typhonjs-fvtt/svelte-standard/action';

   const internalState = getContext('#tjs-color-picker-state');

   const { isAlpha } = internalState.stores;
   const { textState } = internalState.colorState.stores;

   const { alpha } = textState.alpha.stores;
   const { h, s, l } = textState.hsl.stores;

   const inputAlpha = {
      store: alpha,
      efx: rippleFocus(),
      type: 'number',
      min: 0,
      max: 1,
      step: 0.01,
      options: {
         blurOnEnterKey: true,
         cancelOnEscKey: true
      }
   };
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
    <input aria-label="luminance chanel color"
           bind:value={$l}
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

