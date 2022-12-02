<script>
   import { getContext }    from 'svelte';

   import { TJSInput }      from '../../../../form/input/index.js'

   const internalState = getContext('#tjs-color-picker-state');

   const { isAlpha } = internalState.stores;
   const { textState } = internalState.colorState.stores;

   const { alpha } = textState.alpha.inputData;
   const { h, s, l } = textState.hsl.inputData;
</script>

<div class=input-container>
    <TJSInput input={h} />
    <TJSInput input={s} />
    <TJSInput input={l} />
    {#if $isAlpha}
        <TJSInput input={alpha} />
    {/if}
</div>

<style>
    @container tjs-color-picker-container (min-width: 0) {
        .input-container {
            display: flex;
            flex: 1;
            gap: min(8px, 2cqw);
        }
    }
</style>
