<script>
   import { getContext }    from 'svelte';

   import { TJSInput }      from '../../../../form/input/index.js'

   const internalState = getContext('#tjs-color-picker-state');

   const { isAlpha } = internalState.stores;

   const {
      activeTextMode,
      textState } = internalState.colorState.stores;

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
<div class=input-attributes
     role=button
     aria-label="next color format"
     tabindex=0
     on:click|preventDefault={() => activeTextMode.nextMode()}
     on:keydown|preventDefault={(event) => { if (event.code === 'Space') { activeTextMode.nextMode() } }}>
    <span>H</span>
    <span>S</span>
    <span>L</span>
    {#if $isAlpha}
        <span>A</span>
    {/if}
</div>


