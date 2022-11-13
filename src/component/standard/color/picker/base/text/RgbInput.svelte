<script>
   import { getContext }    from 'svelte';

   import { TJSInput }      from '../../../../form/input/index.js'

   const internalState = getContext('#tjs-color-picker-state');

   const { isAlpha } = internalState.stores;
   const { textState } = internalState.colorState.stores;

   const { alpha } = textState.alpha.inputData;
   const { r, g, b } = textState.rgb.inputData;
</script>

<div class=input-container>
    <TJSInput input={r} />
    <TJSInput input={g} />
    <TJSInput input={b} />
    {#if $isAlpha}
        <TJSInput input={alpha} />
    {/if}
</div>

