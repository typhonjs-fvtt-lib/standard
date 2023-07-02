<script>
   import { getContext }    from '#svelte';

   import { ripple }        from '#runtime/svelte/action/animate';

   import TJSColordButton   from '../../../TJSColordButton.svelte';

   const internalState = getContext('#tjs-color-picker-state');
   const colorState = internalState.colorState;

   const savedColorState = internalState.addOnState.get('saved-colors').savedColorsState;
</script>

<section>
    {#each $savedColorState as color (color)}
        <TJSColordButton {color}
                         on:press={() => colorState.setColor(color)}
                         on:contextmenu={() => savedColorState.deleteColor(color)}
                         efx={ripple({ keyCode: 'Space' })}
                         keyCode={'Space'} />
    {/each}
</section>

<style>
    section {
        width: inherit;

        display: grid;
        border-top: 1px solid gray;

        --tjs-icon-button-border: var(--tjs-input-number-border, var(--tjs-input-border));
        --tjs-icon-button-border-radius: 0.25em;
        --tjs-icon-button-border-width: 1px;
    }

    @container tjs-color-picker-container (min-width: 0) {
        section {
            --tjs-icon-button-diameter: clamp(10px, 8cqw, 32px);

            padding: min(4px, 1.5cqw);

            grid-template-columns: 10% 10% 10% 10% 10% 10% 10% 10%;
            grid-template-rows: clamp(10px, 8cqw, 32px);
            column-gap: 3%;
            row-gap: 2cqw;
        }
    }
</style>
