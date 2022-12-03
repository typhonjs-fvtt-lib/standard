<script>
   import { getContext } from 'svelte';

   import { TJSInput }  from '../../../../form/input/index.js'

   const internalState = getContext('#tjs-color-picker-state');

   const { isAlpha } = internalState.stores;

   const {
      activeTextMode,
      textState } = internalState.colorState.stores;

   const { alpha } = textState.alpha.inputData;
   const { hex } = textState.hex.inputData;
</script>

<div class=input-container>
    <TJSInput input={hex} />
</div>
<div class=input-attributes
     role=button
     aria-label="next color format"
     tabindex=0
     on:click|preventDefault={() => activeTextMode.nextMode()}
     on:keydown|preventDefault={(event) => { if (event.code === 'Space') { activeTextMode.nextMode() } }}>
    <span>HEX</span>
</div>
